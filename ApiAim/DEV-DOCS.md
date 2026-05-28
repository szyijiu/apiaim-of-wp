# ApiAim × Aigogogo 充值同步 - 开发需求文档

## 一、项目概述

| 项目 | 地址 | 技术栈 |
|------|------|--------|
| 主站 | https://apiaim.com | New API |
| 代理站 | https://aigogogo.net | WordPress + WooCommerce |

**核心思路**：代理站支付完成后，**主动调用主站 API** 完成充值同步。

---

## 二、整体链路

```
┌─────────────────────────────────────────────────────────┐
│  用户在 aigogogo.net 购买套餐/充值                        │
│       │                                                  │
│       ▼                                                  │
│  WooCommerce 订单完成 (status: completed)                │
│       │                                                  │
│       ▼                                                  │
│  WP 插件调用 apiaim.com API 接口                          │
│       │                                                  │
│       ▼                                                  │
│  apiaim.com 处理：                                       │
│    - 根据邮箱查找/创建用户                                │
│    - 增加余额 / 激活套餐 / 发放兑换码                     │
│    - 返回处理结果                                         │
│       │                                                  │
│       ▼                                                  │
│  aigogogo.net 记录同步结果到订单 meta                     │
│       │                                                  │
│       ▼                                                  │
│  同步成功 → 订单标记完成                                  │
│  同步失败 → 重试队列 / 管理员通知                         │
└─────────────────────────────────────────────────────────┘
```

---

## 三、主站需要提供的 API 接口

### 3.1 通用说明

**Base URL**: `https://apiaim.com/api/v1`

**认证方式**: API Key，通过 Header 传递

```
Authorization: Bearer <代理站API密钥>
Content-Type: application/json
```

### 3.2 接口清单

| 接口 | 方法 | 用途 |
|------|------|------|
| `/proxy/topup` | POST | 充值（余额/套餐/兑换码） |
| `/proxy/user/query` | GET | 查询用户信息 |
| `/proxy/package/list` | GET | 查询套餐列表 |
| `/proxy/order/status` | GET | 查询订单同步状态 |
| `/proxy/ping` | GET | 连通性测试 |

### 3.3 接口详细定义

---

#### 3.3.1 充值接口 `POST /proxy/topup`

**请求参数：**

```json
{
  "email": "user@example.com",
  "order_id": "WC-20260528-001",
  "package_sku": "coding_plan_lite",
  "amount": 7.90,
  "currency": "CNY",
  "extra": {}
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | ✅ | 用户邮箱（主站登录凭证） |
| order_id | string | ✅ | 代理站订单号（幂等键） |
| package_sku | string | ✅ | 套餐SKU（见下方清单） |
| amount | number | ✅ | 实付金额（元） |
| currency | string | ❌ | 货币，默认 CNY |
| extra | object | ❌ | 扩展参数（兑换码场景用） |

**套餐 SKU 清单：**

| SKU | 说明 | 主站动作 |
|-----|------|----------|
| `topup_10` | 充值¥10 | 余额+10 |
| `topup_50` | 充值¥50 | 余额+50 |
| `topup_100` | 充值¥100 | 余额+100 |
| `topup_500` | 充值¥500 | 余额+500 |
| `coding_plan_lite` | Lite月卡 | 激活套餐，配额18000次/月 |
| `coding_plan_pro` | Pro月卡 | 激活套餐，配额90000次/月 |
| `redemption_code` | 兑换码 | 发放兑换码 |

**成功响应（200）：**

```json
{
  "success": true,
  "code": 0,
  "message": "充值成功",
  "data": {
    "apiaim_user_id": "10086",
    "email": "user@example.com",
    "action": "balance_add",
    "amount_added": 10.00,
    "new_balance": 110.00,
    "quota_granted": 0,
    "expires_at": null,
    "transaction_id": "txn_987654321"
  }
}
```

**套餐激活响应示例：**

```json
{
  "success": true,
  "code": 0,
  "message": "套餐激活成功",
  "data": {
    "apiaim_user_id": "10086",
    "email": "user@example.com",
    "action": "plan_activate",
    "amount_added": 0,
    "new_balance": 0,
    "quota_granted": 18000,
    "expires_at": "2026-06-28T00:00:00Z",
    "transaction_id": "txn_987654322"
  }
}
```

**兑换码响应示例：**

```json
{
  "success": true,
  "code": 0,
  "message": "兑换码发放成功",
  "data": {
    "apiaim_user_id": "10086",
    "email": "user@example.com",
    "action": "redemption_code",
    "amount_added": 0,
    "new_balance": 0,
    "quota_granted": 0,
    "expires_at": null,
    "transaction_id": "txn_987654323",
    "redemption_code": "APIA-XXXX-YYYY-ZZZZ"
  }
}
```

**失败响应：**

```json
{
  "success": false,
  "code": 40001,
  "message": "套餐SKU不存在",
  "data": null
}
```

**错误码表：**

| code | 说明 |
|------|------|
| 0 | 成功 |
| 40001 | 套餐SKU不存在 |
| 40002 | 参数错误 |
| 40003 | 用户不存在（且无法创建） |
| 40004 | 重复订单（order_id已处理） |
| 40005 | 余额不足（按量计费扣款场景） |
| 40100 | API密钥无效 |
| 50000 | 服务器内部错误 |

---

#### 3.3.2 查询用户 `GET /proxy/user/query?email=xxx`

**成功响应：**

```json
{
  "success": true,
  "code": 0,
  "data": {
    "user_id": "10086",
    "email": "user@example.com",
    "display_name": "张三",
    "balance": 110.00,
    "plan": {
      "sku": "coding_plan_lite",
      "name": "Coding Plan Lite",
      "quota_total": 18000,
      "quota_used": 5200,
      "quota_remaining": 12800,
      "expires_at": "2026-06-28T00:00:00Z",
      "auto_renew": true
    },
    "created_at": "2026-01-15T08:00:00Z"
  }
}
```

---

#### 3.3.3 查询套餐列表 `GET /proxy/package/list`

**成功响应：**

```json
{
  "success": true,
  "code": 0,
  "data": [
    {
      "sku": "topup_100",
      "name": "充值¥100",
      "type": "topup",
      "price": 100.00,
      "currency": "CNY",
      "description": "账户余额增加100元"
    },
    {
      "sku": "coding_plan_lite",
      "name": "Coding Plan Lite",
      "type": "subscription",
      "price": 7.90,
      "price_original": 40.00,
      "currency": "CNY",
      "quota": 18000,
      "valid_days": 30,
      "description": "每5小时1200次请求，每周9000次，每月18000次"
    },
    {
      "sku": "coding_plan_pro",
      "name": "Coding Plan Pro",
      "type": "subscription",
      "price": 39.90,
      "price_original": 200.00,
      "currency": "CNY",
      "quota": 90000,
      "valid_days": 30,
      "description": "每5小时6000次请求，每周45000次，每月90000次"
    }
  ]
}
```

---

#### 3.3.4 查询订单状态 `GET /proxy/order/status?order_id=xxx`

**成功响应：**

```json
{
  "success": true,
  "code": 0,
  "data": {
    "order_id": "WC-20260528-001",
    "status": "synced",
    "transaction_id": "txn_987654321",
    "synced_at": "2026-05-28T10:30:05Z"
  }
}
```

---

#### 3.3.5 连通性测试 `GET /proxy/ping`

**成功响应：**

```json
{
  "success": true,
  "code": 0,
  "message": "pong",
  "server_time": "2026-05-28T10:30:00Z"
}
```

---

## 四、aigogogo.net WordPress 插件实现

### 4.1 插件结构

```
wp-content/plugins/aigogogo-apiaim-sync/
├── aigogogo-apiaim-sync.php         # 主入口
├── includes/
│   ├── class-api-client.php         # 调用 apiaim API
│   ├── class-order-handler.php      # WooCommerce 订单处理
│   ├── class-sync-queue.php         # 重试队列
│   └── class-admin-settings.php     # 后台配置
└── templates/
    └── admin-settings.php           # 设置页面模板
```

### 4.2 核心逻辑：订单完成后调用 API

```php
// 监听 WooCommerce 订单状态变更
add_action('woocommerce_order_status_completed', 'aigogogo_sync_to_apiaim', 10, 1);

function aigogogo_sync_to_apiaim($order_id) {
    $order = wc_get_order($order_id);
    $email = $order->get_billing_email();
    $sku   = get_post_meta($order_id, '_apiaim_package_sku', true);
    $amount = $order->get_total();

    $client = new Aigogogo_Apiaim_Client();
    $result = $client->topup([
        'email'      => $email,
        'order_id'   => 'WC-' . $order_id,
        'package_sku'=> $sku,
        'amount'     => (float) $amount,
        'currency'   => 'CNY',
    ]);

    if ($result['success']) {
        update_post_meta($order_id, '_apiaim_sync_status', 'success');
        update_post_meta($order_id, '_apiaim_transaction_id', $result['data']['transaction_id']);
        update_post_meta($order_id, '_apiaim_user_id', $result['data']['apiaim_user_id']);
    } else {
        update_post_meta($order_id, '_apiaim_sync_status', 'failed');
        update_post_meta($order_id, '_apiaim_sync_error', $result['message']);
        // 加入重试队列
        Aigogogo_Sync_Queue::add($order_id, $result['code']);
    }
}
```

### 4.3 API 调用类

```php
class Aigogogo_Apiaim_Client {
    private $base_url = 'https://apiaim.com/api/v1';
    private $api_key;

    public function __construct() {
        $this->api_key = get_option('apiaim_api_key');
    }

    public function topup($params) {
        return $this->request('POST', '/proxy/topup', $params);
    }

    public function query_user($email) {
        return $this->request('GET', '/proxy/user/query?email=' . urlencode($email));
    }

    public function ping() {
        return $this->request('GET', '/proxy/ping');
    }

    private function request($method, $endpoint, $data = null) {
        $args = [
            'method'  => $method,
            'timeout' => 30,
            'headers' => [
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . $this->api_key,
            ],
        ];
        if ($data && $method === 'POST') {
            $args['body'] = json_encode($data);
        }
        $response = wp_remote_request($this->base_url . $endpoint, $args);
        return json_decode(wp_remote_retrieve_body($response), true);
    }
}
```

### 4.4 后台配置页

WooCommerce → 设置 → **ApiAim 同步** 标签页：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| API 地址 | 主站 base URL | https://apiaim.com |
| API 密钥 | 代理站专用密钥 | （空） |
| 同步模式 | 自动同步 / 手动确认 | 自动同步 |
| 重试次数 | 失败后重试次数 | 5 |
| 重试间隔 | 秒 | 60 |
| 超时时间 | 秒 | 30 |

### 4.5 订单详情显示同步状态

在 WooCommerce 订单详情页添加 meta box：

```
ApiAim 同步状态:  ✅ 已同步
主站交易号:      txn_987654321
主站用户ID:      10086
同步时间:        2026-05-28 10:30:05
```

---

## 五、重试机制

| 情况 | 处理 |
|------|------|
| 网络超时 | 立即重试1次，失败后加入队列 |
| 40004（重复订单） | 直接标记成功，不重试 |
| 40100（密钥无效） | 停止重试，管理员通知 |
| 50000（服务器错误） | 指数退避重试：1min → 5min → 30min → 2h |
| 超过重试次数 | 标记为"待处理"，发送邮件通知管理员 |

**WP-Cron 定时任务（每5分钟）：**

```php
add_action('aigogogo_apiaim_retry_sync', 'aigogogo_retry_failed_orders');
// 扫描 _apiaim_sync_status = 'pending' 且超过重试间隔的订单
// 重新调用 apiaim API
// 更新同步状态
```

---

## 六、安全要求

| 项目 | 要求 |
|------|------|
| 传输 | 强制 HTTPS（TLS 1.2+） |
| 认证 | API Key 放在 `wp-config.php` 常量中，不存数据库明文 |
| 幂等性 | order_id 作为幂等键，主站相同 order_id 只处理一次 |
| 防重放 | 请求带时间戳，主站拒绝超过5分钟的请求 |
| 日志 | 不记录完整 API Key，只记录前6位 + `***` |

---

## 七、开发排期

| 阶段 | 内容 | 负责方 | 周期 |
|------|------|--------|------|
| 1 | 主站 API 接口开发（5个接口） | apiaim | 3天 |
| 2 | WordPress 插件开发 | aigogogo | 4天 |
| 3 | 联调测试 | 双方 | 2天 |
| 4 | 重试/对账/通知完善 | 双方 | 2天 |
| 5 | 灰度上线 | 双方 | 1天 |
| **合计** | | | **12天** |

---

## 八、验收标准

- [ ] 代理站购买充值包 → 主站余额正确增加
- [ ] 代理站购买 Coding Plan Lite → 主站套餐正确激活
- [ ] 代理站购买 Coding Plan Pro → 主站套餐正确激活
- [ ] 代理站购买兑换码 → 主站发放兑换码
- [ ] 重复订单不重复处理（幂等性）
- [ ] 网络异常时自动重试成功
- [ ] 超过重试次数后管理员收到通知
- [ ] 订单详情页显示同步状态
- [ ] 后台可配置 API 地址、密钥、重试参数
