<?php
/**
 * Plugin Name: ApiAim of wp
 * Description: 同步 WooCommerce 订单到 ApiAim 主站
 * Version: 1.0.7
 * Author: ApiAim
 * Text Domain: apiaim-wp
 */

if (!defined('ABSPATH')) exit;

define('APIAIM_WP_VERSION', '1.0.7');
define('APIAIM_WP_PLUGIN_DIR', plugin_dir_path(__FILE__));

$puc_file = APIAIM_WP_PLUGIN_DIR . 'lib/plugin-update-checker.php';
if (file_exists($puc_file)) {
    require_once $puc_file;
    add_action('init', function() {
        try {
            $updateChecker = YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
                'https://github.com/szyijiu/apiaim-of-wp',
                __FILE__
            );
            $updateChecker->getVcsApi()->enableReleaseAssets('/\.zip$/i');
        } catch (Exception $e) {
            error_log('[ApiAim WP] PUC init error: ' . $e->getMessage());
        }
    });
}

function apiaim_wp_check_dependencies() {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', function() {
            echo '<div class="notice notice-warning"><p>ApiAim of wp 需要先安装并激活 WooCommerce。</p></div>';
        });
        return false;
    }
    return true;
}

add_filter('cron_schedules', function($schedules) {
    $schedules['five_minutes'] = [
        'interval' => 300,
        'display'  => '每5分钟'
    ];
    return $schedules;
});

$inc_files = ['class-api-client.php', 'class-order-handler.php', 'class-admin-settings.php', 'class-sync-queue.php'];
foreach ($inc_files as $f) {
    $path = APIAIM_WP_PLUGIN_DIR . 'includes/' . $f;
    if (file_exists($path)) require_once $path;
}

register_activation_hook(__FILE__, ['Apiaim_Wp_Order_Handler', 'activate']);
register_deactivation_hook(__FILE__, ['Apiaim_Wp_Order_Handler', 'deactivate']);

add_action('admin_menu', ['Apiaim_Wp_Admin_Settings', 'add_menu']);
add_action('admin_init', ['Apiaim_Wp_Admin_Settings', 'register_settings']);

add_action('wp_ajax_apiaim_ping_test', 'apiaim_wp_ajax_ping');

add_action('plugins_loaded', function() {
    if (!apiaim_wp_check_dependencies()) return;

    add_action('woocommerce_order_status_completed', ['Apiaim_Wp_Order_Handler', 'on_order_completed'], 10, 1);
    add_action('woocommerce_admin_order_data_after_billing_address', ['Apiaim_Wp_Order_Handler', 'show_sync_status']);

    add_action('apiaim_wp_retry_sync', ['Apiaim_Wp_Sync_Queue', 'retry_failed_orders']);

    if (!wp_next_scheduled('apiaim_wp_retry_sync')) {
        wp_schedule_event(time(), 'five_minutes', 'apiaim_wp_retry_sync');
    }
});

function apiaim_wp_ajax_ping() {
    try {
        if (!class_exists('Apiaim_Wp_Client')) {
            wp_send_json(['success' => false, 'code' => 50000, 'message' => 'API 客户端类未加载']);
            return;
        }
        $client = new Apiaim_Wp_Client();
        $result = $client->ping();
        wp_send_json($result);
    } catch (Exception $e) {
        error_log('[ApiAim WP] Ping AJAX error: ' . $e->getMessage());
        wp_send_json(['success' => false, 'code' => 50000, 'message' => '服务器内部错误: ' . $e->getMessage()]);
    }
}

add_filter('auto_update_plugin', function($update, $item) {
    if (isset($item->plugin) && $item->plugin === plugin_basename(__FILE__)) {
        return true;
    }
    return $update;
}, 10, 2);

add_action('upgrader_process_complete', function($upgrader, $options) {
    if (isset($options['type']) && $options['type'] === 'plugin' && isset($options['plugins'])) {
        $basename = plugin_basename(__FILE__);
        if (in_array($basename, $options['plugins'])) {
            delete_transient('update_plugins');
        }
    }
}, 10, 2);
