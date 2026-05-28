const express = require('express');
const router = express.Router();
const { isValidEmail, sanitizeInput } = require('../middleware/security');

module.exports = function(pool) {
  // 查询用户信息
  router.get('/query', async (req, res) => {
    try {
      const { email } = req.query;

      if (!email || !isValidEmail(email)) {
        return res.json({ success: false, code: 40002, message: '邮箱格式无效' });
      }

      const cleanEmail = sanitizeInput(email);

      // 查询用户
      const [users] = await pool.query(
        'SELECT id, email, display_name, status, balance, quota, group_id, created_time FROM users WHERE email = ? LIMIT 1',
        [cleanEmail]
      );

      if (users.length === 0) {
        return res.json({ success: false, code: 40003, message: '用户不存在' });
      }

      const user = users[0];

      // 查询订阅信息
      const [subscriptions] = await pool.query(
        'SELECT plan_type, quota, quota_used, expired_time FROM subscriptions WHERE user_id = ? AND expired_time > UNIX_TIMESTAMP() ORDER BY expired_time DESC',
        [user.id]
      );

      let planInfo = null;
      if (subscriptions.length > 0) {
        const sub = subscriptions[0];
        planInfo = {
          sku: sub.plan_type === 'pro' ? 'coding_plan_pro' : 'coding_plan_lite',
          name: sub.plan_type === 'pro' ? 'Coding Plan Pro' : 'Coding Plan Lite',
          quota_total: sub.quota,
          quota_used: sub.quota_used,
          quota_remaining: sub.quota - sub.quota_used,
          expires_at: new Date(sub.expired_time * 1000).toISOString(),
          auto_renew: true
        };
      }

      res.json({
        success: true,
        code: 0,
        data: {
          user_id: String(user.id),
          email: user.email,
          display_name: user.display_name,
          balance: user.balance || 0,
          plan: planInfo,
          created_at: new Date(user.created_time * 1000).toISOString()
        }
      });

    } catch (error) {
      console.error('[User] Query error:', error.message);
      res.json({
        success: false,
        code: 50000,
        message: '服务器内部错误'
      });
    }
  });

  return router;
};
