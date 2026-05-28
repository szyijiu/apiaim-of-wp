const rateLimit = require('express-rate-limit');

// 速率限制：每个 IP 每分钟最多 60 次请求
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    success: false,
    code: 42900,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 充值接口更严格的限制：每个 IP 每分钟最多 10 次
const topupLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    code: 42900,
    message: '充值请求过于频繁'
  }
});

// 输入清理：移除潜在的危险字符
function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>"'`;]/g, '').trim();
}

// 验证邮箱格式
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 验证 order_id 格式（只允许字母数字和下划线）
function isValidOrderId(orderId) {
  return /^[A-Za-z0-9_-]{1,64}$/.test(orderId);
}

// 验证 package_sku 格式
function isValidSku(sku) {
  return /^[a-z0-9_]{1,32}$/.test(sku);
}

module.exports = { apiLimiter, topupLimiter, sanitizeInput, isValidEmail, isValidOrderId, isValidSku };
