const express = require('express');
const router = express.Router();
const { topupLimiter, isValidEmail, isValidOrderId, isValidSku } = require('../middleware/security');
const { sanitizeInput } = require('../middleware/security');

module.exports = function(pool) {
  // 充值接口
  router.post('/', topupLimiter, async (req, res) => {
    try {
      const { email, order_id, package_sku, amount, currency = 'CNY', extra = {} } = req.body;

      // 输入验证
      if (!email || !isValidEmail(email)) {
        return res.json({ success: false, code: 40002, message: '邮箱格式无效' });
      }
      if (!order_id || !isValidOrderId(order_id)) {
        return res.json({ success: false, code: 40002, message: '订单号格式无效' });
      }
      if (!package_sku || !isValidSku(package_sku)) {
        return res.json({ success: false, code: 40002, message: '套餐SKU格式无效' });
      }
      if (amount === undefined || amount < 0) {
        return res.json({ success: false, code: 40002, message: '金额无效' });
      }

      // 清理输入
      const cleanEmail = sanitizeInput(email);
      const cleanOrderId = sanitizeInput(order_id);
      const cleanSku = sanitizeInput(package_sku);

      // 检查幂等性（相同 order_id 只处理一次）
      const [existingOrder] = await pool.query(
        'SELECT id, status FROM orders WHERE order_id = ? LIMIT 1',
        [cleanOrderId]
      );

      if (existingOrder.length > 0) {
        if (existingOrder[0].status === 'completed') {
          return res.json({ success: false, code: 40004, message: '订单已处理' });
        }
        // 如果是 pending 状态，继续处理（可能是重试）
      }

      // 查找用户
      const [users] = await pool.query(
        'SELECT id, email, status, balance, quota, group_id FROM users WHERE email = ? LIMIT 1',
        [cleanEmail]
      );

      let userId;
      if (users.length === 0) {
        // 创建新用户
        const [newUser] = await pool.query(
          'INSERT INTO users (email, display_name, role, status, balance, quota, group_id, created_time) VALUES (?, ?, 1, 1, 0, 0, 5, UNIX_TIMESTAMP())',
          [cleanEmail, cleanEmail.split('@')[0]]
        );
        userId = newUser.insertId;
      } else {
        userId = users[0].id;
      }

      // 根据套餐类型执行不同操作
      let action, amountAdded, newBalance, quotaGranted, expiresAt, transactionId;

      // 记录订单
      await pool.query(
        'INSERT INTO orders (user_id, order_id, package_sku, amount, currency, status, created_time) VALUES (?, ?, ?, ?, ?, 1, UNIX_TIMESTAMP())',
        [userId, cleanOrderId, cleanSku, amount, currency]
      );

      // 根据 SKU 类型处理
      if (cleanSku.startsWith('topup_')) {
        // 充值余额
        const topupAmount = parseFloat(cleanSku.replace('topup_', ''));
        action = 'balance_add';
        amountAdded = topupAmount;
        quotaGranted = 0;
        expiresAt = null;

        await pool.query(
          'UPDATE users SET balance = balance + ? WHERE id = ?',
          [topupAmount, userId]
        );

        const [newUser] = await pool.query('SELECT balance FROM users WHERE id = ?', [userId]);
        newBalance = newUser[0].balance;

      } else if (cleanSku.startsWith('coding_plan_')) {
        // 激活/延长订阅套餐
        const planType = cleanSku === 'coding_plan_pro' ? 'pro' : 'lite';
        const quota = planType === 'pro' ? 90000 : 18000;
        const validDays = 30;

        action = 'plan_activate';
        amountAdded = 0;
        quotaGranted = quota;
        newBalance = 0;

        // 计算到期时间
        const now = new Date();
        expiresAt = new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000);
        const expiresTimestamp = Math.floor(expiresAt.getTime() / 1000);

        // 检查是否有未过期的同类型套餐
        const [existingPlan] = await pool.query(
          'SELECT id, quota_used, expired_time FROM subscriptions WHERE user_id = ? AND plan_type = ? AND expired_time > UNIX_TIMESTAMP() LIMIT 1',
          [userId, planType]
        );

        if (existingPlan.length > 0) {
          // 延长现有套餐
          const currentExpiry = existingPlan[0].expired_time * 1000;
          const newExpiry = Math.max(currentExpiry, now.getTime()) + validDays * 24 * 60 * 60 * 1000;
          const newExpiresTimestamp = Math.floor(newExpiry / 1000);

          await pool.query(
            'UPDATE subscriptions SET quota = quota + ?, expired_time = ? WHERE id = ?',
            [quota, newExpiresTimestamp, existingPlan[0].id]
          );
          expiresAt = new Date(newExpiry);
        } else {
          // 创建新订阅
          await pool.query(
            'INSERT INTO subscriptions (user_id, plan_type, quota, quota_used, expired_time, created_time) VALUES (?, ?, ?, 0, ?, UNIX_TIMESTAMP())',
            [userId, planType, quota, expiresTimestamp]
          );
        }

        // 更新用户配额
        await pool.query(
          'UPDATE users SET quota = quota + ? WHERE id = ?',
          [quota, userId]
        );

      } else if (cleanSku === 'redemption_code') {
        // 发放兑换码
        action = 'redemption_code';
        amountAdded = 0;
        quotaGranted = 0;
        newBalance = 0;
        expiresAt = null;

        // 生成兑换码
        const code = 'APIA-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
                     Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
                     Math.random().toString(36).substring(2, 6).toUpperCase();

        await pool.query(
          'INSERT INTO redemption_codes (user_id, code, status, created_time) VALUES (?, ?, 0, UNIX_TIMESTAMP())',
          [userId, code]
        );

      } else {
        // 未知套餐
        await pool.query(
          'UPDATE orders SET status = -1 WHERE order_id = ?',
          [cleanOrderId]
        );
        return res.json({ success: false, code: 40001, message: '套餐SKU不存在' });
      }

      // 生成交易ID
      transactionId = 'txn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

      // 更新订单状态为完成
      await pool.query(
        'UPDATE orders SET status = 2, transaction_id = ?, synced_time = UNIX_TIMESTAMP() WHERE order_id = ?',
        [transactionId, cleanOrderId]
      );

      // 返回结果（不暴露敏感信息）
      const responseData = {
        apiaim_user_id: String(userId),
        email: cleanEmail,
        action: action,
        amount_added: amountAdded || 0,
        new_balance: newBalance || 0,
        quota_granted: quotaGranted || 0,
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        transaction_id: transactionId
      };

      // 如果是兑换码，添加到响应
      if (action === 'redemption_code') {
        responseData.redemption_code = code;
      }

      res.json({
        success: true,
        code: 0,
        message: '充值成功',
        data: responseData
      });

    } catch (error) {
      console.error('[Topup] Error:', error.message);
      res.json({
        success: false,
        code: 50000,
        message: '服务器内部错误'
      });
    }
  });

  return router;
};
