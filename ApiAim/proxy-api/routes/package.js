const express = require('express');
const router = express.Router();

// 套餐列表（静态配置，可扩展为从数据库读取）
const PACKAGES = [
  {
    sku: 'topup_10',
    name: '充值¥10',
    type: 'topup',
    price: 10.00,
    currency: 'CNY',
    description: '账户余额增加10元'
  },
  {
    sku: 'topup_50',
    name: '充值¥50',
    type: 'topup',
    price: 50.00,
    currency: 'CNY',
    description: '账户余额增加50元'
  },
  {
    sku: 'topup_100',
    name: '充值¥100',
    type: 'topup',
    price: 100.00,
    currency: 'CNY',
    description: '账户余额增加100元'
  },
  {
    sku: 'topup_500',
    name: '充值¥500',
    type: 'topup',
    price: 500.00,
    currency: 'CNY',
    description: '账户余额增加500元'
  },
  {
    sku: 'coding_plan_lite',
    name: 'Coding Plan Lite',
    type: 'subscription',
    price: 7.90,
    price_original: 40.00,
    currency: 'CNY',
    quota: 18000,
    valid_days: 30,
    description: '每5小时1200次请求，每周9000次，每月18000次'
  },
  {
    sku: 'coding_plan_pro',
    name: 'Coding Plan Pro',
    type: 'subscription',
    price: 39.90,
    price_original: 200.00,
    currency: 'CNY',
    quota: 90000,
    valid_days: 30,
    description: '每5小时6000次请求，每周45000次，每月90000次'
  },
  {
    sku: 'redemption_code',
    name: '兑换码',
    type: 'redemption',
    price: 0.00,
    currency: 'CNY',
    description: '发放一次性兑换码'
  }
];

module.exports = function(pool) {
  // 查询套餐列表
  router.get('/list', async (req, res) => {
    try {
      res.json({
        success: true,
        code: 0,
        data: PACKAGES
      });
    } catch (error) {
      console.error('[Package] List error:', error.message);
      res.json({
        success: false,
        code: 50000,
        message: '服务器内部错误'
      });
    }
  });

  return router;
};
