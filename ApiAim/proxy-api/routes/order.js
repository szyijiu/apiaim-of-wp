const express = require('express');
const router = express.Router();
const { isValidOrderId, sanitizeInput } = require('../middleware/security');

module.exports = function(pool) {
  // 查询订单状态
  router.get('/status', async (req, res) => {
    try {
      const { order_id } = req.query;

      if (!order_id || !isValidOrderId(order_id)) {
        return res.json({ success: false, code: 40002, message: '订单号格式无效' });
      }

      const cleanOrderId = sanitizeInput(order_id);

      // 查询订单
      const [orders] = await pool.query(
        'SELECT id, order_id, status, transaction_id, synced_time FROM orders WHERE order_id = ? LIMIT 1',
        [cleanOrderId]
      );

      if (orders.length === 0) {
        return res.json({ success: false, code: 40004, message: '订单不存在' });
      }

      const order = orders[0];
      let statusText;
      switch (order.status) {
        case 1: statusText = 'pending'; break;
        case 2: statusText = 'synced'; break;
        case -1: statusText = 'failed'; break;
        default: statusText = 'unknown';
      }

      res.json({
        success: true,
        code: 0,
        data: {
          order_id: order.order_id,
          status: statusText,
          transaction_id: order.transaction_id || null,
          synced_at: order.synced_time ? new Date(order.synced_time * 1000).toISOString() : null
        }
      });

    } catch (error) {
      console.error('[Order] Status query error:', error.message);
      res.json({
        success: false,
        code: 50000,
        message: '服务器内部错误'
      });
    }
  });

  return router;
};
