# Aigogogo ApiAim Sync

WooCommerce 订单同步到 ApiAim 主站的 WordPress 插件。

## 安装

1. 将 `aigogogo-apiaim-sync` 文件夹上传到 `wp-content/plugins/`
2. 在 WordPress 后台启用插件
3. 前往 **WooCommerce → ApiAim 同步** 配置 API 地址和密钥

## WP-Cron 定时任务

插件使用 WP-Cron 每 5 分钟重试失败的同步订单。

如果使用服务器级 cron，禁用 WP-Cron 并添加：

```bash
*/5 * * * * wget -q -O- https://aigogogo.net/wp-cron.php
```

## 订单商品 SKU 规范

WooCommerce 商品 SKU 必须与 ApiAim 套餐一致：

| SKU | 说明 |
|-----|------|
| topup_10 | 充值 ¥10 |
| topup_50 | 充值 ¥50 |
| topup_100 | 充值 ¥100 |
| topup_500 | 充值 ¥500 |
| coding_plan_lite | Coding Plan Lite |
| coding_plan_pro | Coding Plan Pro |
| redemption_code | 兑换码 |

## 日志

错误日志记录在 WordPress 的 `wp-content/debug.log` 中（需启用 `WP_DEBUG`）。
