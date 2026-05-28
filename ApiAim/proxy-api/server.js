const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const { apiKeyAuth, timestampCheck } = require('./middleware/auth');
const { apiLimiter } = require('./middleware/security');

// 路由模块
const topupRoutes = require('./routes/topup');
const userRoutes = require('./routes/user');
const packageRoutes = require('./routes/package');
const orderRoutes = require('./routes/order');
const pingRoutes = require('./routes/ping');

async function main() {
  // 创建数据库连接池
  const pool = mysql.createPool(config.db);

  // 测试数据库连接
  try {
    await pool.query('SELECT 1');
    console.log('[DB] 数据库连接成功');
  } catch (error) {
    console.error('[DB] 数据库连接失败:', error.message);
    process.exit(1);
  }

  // 创建 Express 应用
  const app = express();

  // 安全中间件
  app.use(helmet());
  app.use(cors({
    origin: ['https://aigogogo.net', 'https://www.aigogogo.net', 'https://aigogogo.minxing.work'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Timestamp']
  }));

  // 解析 JSON 请求体
  app.use(express.json({ limit: '10kb' }));

  // 全局速率限制
  app.use('/api/', apiLimiter);

  // 认证中间件（除 ping 外所有接口）
  app.use('/api/v1/proxy/topup', apiKeyAuth, timestampCheck);
  app.use('/api/v1/proxy/user', apiKeyAuth, timestampCheck);
  app.use('/api/v1/proxy/package', apiKeyAuth, timestampCheck);
  app.use('/api/v1/proxy/order', apiKeyAuth, timestampCheck);

  // 路由挂载
  app.use('/api/v1/proxy/topup', topupRoutes(pool));
  app.use('/api/v1/proxy/user', userRoutes(pool));
  app.use('/api/v1/proxy/package', packageRoutes(pool));
  app.use('/api/v1/proxy/order', orderRoutes(pool));
  app.use('/api/v1/proxy/ping', pingRoutes(pool));

  // 404 处理
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      code: 40400,
      message: '接口不存在'
    });
  });

  // 全局错误处理
  app.use((err, req, res, next) => {
    console.error('[Server] Unhandled error:', err.message);
    res.status(500).json({
      success: false,
      code: 50000,
      message: '服务器内部错误'
    });
  });

  // 启动服务器
  app.listen(config.port, () => {
    console.log(`[Server] ApiAim Proxy API running on port ${config.port}`);
    console.log(`[Server] Environment: ${config.nodeEnv}`);
  });
}

main().catch(err => {
  console.error('[Server] Fatal error:', err);
  process.exit(1);
});
