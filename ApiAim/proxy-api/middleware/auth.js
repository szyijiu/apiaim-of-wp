const config = require('../config');

// API Key 认证中间件
function apiKeyAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      code: 40100,
      message: '缺少认证信息'
    });
  }

  const token = authHeader.slice(7);
  if (!token || token !== config.apiKey) {
    // 不要暴露具体错误原因
    return res.status(401).json({
      success: false,
      code: 40100,
      message: '认证失败'
    });
  }

  next();
}

// 请求时间戳验证（防重放）
function timestampCheck(req, res, next) {
  const timestamp = req.headers['x-timestamp'];
  if (!timestamp) {
    return res.status(401).json({
      success: false,
      code: 40100,
      message: '缺少时间戳'
    });
  }

  const requestTime = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.abs(now - requestTime);

  // 允许5分钟偏差
  if (diff > 300) {
    return res.status(401).json({
      success: false,
      code: 40100,
      message: '请求已过期'
    });
  }

  next();
}

module.exports = { apiKeyAuth, timestampCheck };
