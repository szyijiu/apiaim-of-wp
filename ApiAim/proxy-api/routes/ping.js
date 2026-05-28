const express = require('express');
const router = express.Router();

module.exports = function(pool) {
  // 连通性测试
  router.get('/', async (req, res) => {
    try {
      // 测试数据库连接
      await pool.query('SELECT 1');

      res.json({
        success: true,
        code: 0,
        message: 'pong',
        server_time: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Ping] Database connection error:', error.message);
      res.json({
        success: false,
        code: 50000,
        message: '数据库连接失败'
      });
    }
  });

  return router;
};
