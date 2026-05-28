# ApiAim Proxy API

为 aigogogo.net 提供的代理充值 API 服务。

## 目录结构

```
proxy-api/
├── server.js              # 主入口
├── config.js              # 配置
├── package.json           # 依赖
├── .env.example           # 环境变量模板
├── middleware/
│   ├── auth.js            # API Key 认证
│   └── security.js        # 速率限制、输入校验
└── routes/
    ├── topup.js           # 充值接口
    ├── user.js            # 用户查询
    ├── package.js         # 套餐列表
    ├── order.js           # 订单状态
    └── ping.js            # 连通性测试
```

## 接口清单

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | /api/v1/proxy/topup | ✅ | 充值（余额/套餐/兑换码） |
| GET  | /api/v1/proxy/user/query | ✅ | 查询用户信息 |
| GET  | /api/v1/proxy/package/list | ✅ | 查询套餐列表 |
| GET  | /api/v1/proxy/order/status | ✅ | 查询订单同步状态 |
| GET  | /api/v1/proxy/ping | ❌ | 连通性测试 |

## 部署

### 1. 安装依赖

```bash
cd proxy-api
npm install --production
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入数据库连接和 API 密钥
```

### 3. 启动服务

```bash
npm start
# 或使用 PM2 生产部署
pm2 start server.js --name apiaim-proxy-api
```

### 4. Nginx 反向代理

```nginx
server {
    listen 443 ssl;
    server_name apiaim.com;

    location /api/v1/proxy/ {
        proxy_pass http://127.0.0.1:3001/api/v1/proxy/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 30s;
    }
}
```

## 安全措施

- API Key 认证：所有接口（除 ping 外）需 Bearer Token
- 时间戳防重放：拒绝超过 5 分钟的请求
- 速率限制：充值接口 10次/分钟，其他接口 60次/分钟
- 输入校验：邮箱、订单号、SKU 格式验证
- 参数化查询：防止 SQL 注入
- 响应不暴露内部错误详情
- 日志不记录密钥和支付详情

## 数据库表结构

依赖 New API 现有表：

- `users` — 用户信息（email, balance, status 等）
- `orders` — 订单记录（order_id, status, transaction_id 等）
- `subscriptions` — 订阅套餐（user_id, plan_type, quota, expired_time 等）
- `redemption_codes` — 兑换码（user_id, code, status 等）
