=== ApiAim of wp ===
Contributors: apiaim
Tags: woocommerce, api, payment sync, topup, subscription, order sync
Requires at least: 5.8
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Sync WooCommerce orders to the ApiAim platform — supports balance topups, subscription plan activation, and redemption code delivery.

== Description ==

ApiAim of wp bridges your WooCommerce store with the ApiAim platform (<a href="https://apiaim.com">apiaim.com</a>). When a customer completes a payment on your WooCommerce site, the plugin automatically syncs the order to ApiAim, creating or updating the user's account and granting their purchased benefits.

= Key Features =

* **Auto-sync on payment** — Triggers when WooCommerce order status changes to `completed`. No manual intervention needed.
* **Balance topup** — Predefined SKUs (topup_10, topup_50, etc.) increase the user's ApiAim balance.
* **Subscription plans** — Activate or extend Coding Plan Lite / Pro with quota-based subscriptions.
* **Redemption codes** — Generate and deliver one-time redemption codes to customers.
* **User auto-creation** — If the buyer's email doesn't exist on ApiAim, the plugin creates an account automatically.
* **Idempotent sync** — Duplicate order processing is prevented via order_id tracking.
* **Retry queue** — Failed syncs are retried with exponential backoff (1min → 5min → 30min → 2h) up to 5 attempts.
* **Admin notification** — Sends an email to the site admin when all retry attempts are exhausted.
* **Connectivity test** — One-click ping test from the settings page to verify the connection.
* **Detailed order meta** — Sync status, transaction ID, ApiAim user ID, and redemption codes are saved to the order.

= How It Works =

```
WooCommerce Order Completed
        │
        ▼
Plugin calls ApiAim /api/v1/proxy/topup
        │
        ▼
ApiAim looks up user by email (creates if new)
        │
        ▼
Processes action: balance_add / plan_activate / redemption_code
        │
        ▼
Sync result saved to order meta
```

== Installation ==

1. Upload the `apiaim-of-wp` folder to `/wp-content/plugins/`, or install via WordPress plugin upload.
2. Activate the plugin through the Plugins screen.
3. Go to WooCommerce → Settings → **ApiAim 同步** tab.
4. Enter your ApiAim API URL and API Key.
5. Click **Test Connection** to verify the setup.
6. Assign the correct SKU to your WooCommerce products (matching your ApiAim package SKUs).

= API Key Security =

For production, define the API key in `wp-config.php` instead of storing it in the database:

```
define('APIAIM_API_KEY', 'your-api-key-here');
```

The plugin will read this constant automatically. The settings page input field will be disabled when the constant is set.

== Frequently Asked Questions ==

= Which WooCommerce order status triggers the sync? =

The plugin hooks into `woocommerce_order_status_completed`. Only orders that reach the `completed` status are synced.

= What happens if the ApiAim server is unreachable? =

The plugin adds the order to a retry queue. A WP-Cron job runs every 5 minutes to retry failed syncs with exponential backoff: 1 minute, 5 minutes, 30 minutes, 2 hours. After 5 total attempts, the admin is notified via email.

= Can I test the connection before going live? =

Yes. Go to WooCommerce → Settings → ApiAim 同步 and click the **Test Connection** button. This calls the /api/v1/proxy/ping endpoint.

= What SKU format should I use for products? =

* `topup_10`, `topup_50`, `topup_100`, `topup_500` — Balance topup
* `coding_plan_lite` — Coding Plan Lite (18,000 requests/month)
* `coding_plan_pro` — Coding Plan Pro (90,000 requests/month)
* `redemption_code` — One-time redemption code

== Changelog ==

= 1.1.0 =
* Fix plugin not found after update (flat-file vs subdirectory install path)
* Fix redemption_code ReferenceError crash
* Fix NaN balance when invalid topup_ SKU is sent
* Fix dirty order records created before SKU validation
* Fix ping connectivity test deadlock
* Fix subscription expiry boundary off by 1 second
* Fix Mixed Content error on admin-ajax URL
* Use constant-time comparison for API key validation
* Support APIAIM_API_KEY constant in wp-config.php
* Add error_log when include files fail to load

= 1.0.9 =
* Initial release for WooCommerce-ApiAim sync

== Upgrade Notice ==

= 1.1.0 =
Critical update that fixes plugin activation after upgrade. If you are upgrading from 1.0.9, deactivate and reactivate the plugin after updating.
