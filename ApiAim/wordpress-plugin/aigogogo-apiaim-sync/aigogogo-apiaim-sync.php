<?php
/**
 * Plugin Name: ApiAim of wp
 * Description: 同步 WooCommerce 订单到 ApiAim 主站
 * Version: 1.0.2
 * Author: ApiAim
 * Text Domain: aigogogo-apiaim-sync
 */

if (!defined('ABSPATH')) exit;

// 常量定义
define('AIGOGOGO_APIAIM_VERSION', '1.0.2');
define('AIGOGOGO_APIAIM_PLUGIN_DIR', plugin_dir_path(__FILE__));

// 加载 GitHub 自动更新库
require_once AIGOGOGO_APIAIM_PLUGIN_DIR . 'lib/plugin-update-checker.php';
add_action('init', function() {
    $updateChecker = YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
        'https://github.com/szyijiu/apiaim-of-wp',
        __FILE__,
        'aigogogo-apiaim-sync'
    );
});

// 检查 WooCommerce 是否激活
function aigogogo_apiaim_check_dependencies() {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', function() {
            echo '<div class="notice notice-warning"><p>Aigogogo ApiAim Sync 需要先安装并激活 WooCommerce。</p></div>';
        });
        return false;
    }
    return true;
}

// 注册 WP-Cron 每5分钟间隔
add_filter('cron_schedules', function($schedules) {
    $schedules['five_minutes'] = [
        'interval' => 300,
        'display'  => '每5分钟'
    ];
    return $schedules;
});

// 加载依赖
require_once AIGOGOGO_APIAIM_PLUGIN_DIR . 'includes/class-api-client.php';
require_once AIGOGOGO_APIAIM_PLUGIN_DIR . 'includes/class-order-handler.php';
require_once AIGOGOGO_APIAIM_PLUGIN_DIR . 'includes/class-admin-settings.php';
require_once AIGOGOGO_APIAIM_PLUGIN_DIR . 'includes/class-sync-queue.php';

// 初始化
register_activation_hook(__FILE__, ['Aigogogo_Apiaim_Order_Handler', 'activate']);
register_deactivation_hook(__FILE__, ['Aigogogo_Apiaim_Order_Handler', 'deactivate']);

// 后台设置
add_action('admin_menu', ['Aigogogo_Apiaim_Admin_Settings', 'add_menu']);
add_action('admin_init', ['Aigogogo_Apiaim_Admin_Settings', 'register_settings']);

// AJAX 处理 Ping 测试
add_action('wp_ajax_apiaim_ping_test', 'aigogogo_apiaim_ajax_ping');

// WooCommerce 订单状态变更钩子（仅在 WooCommerce 激活时生效）
add_action('plugins_loaded', function() {
    if (!aigogogo_apiaim_check_dependencies()) return;

    add_action('woocommerce_order_status_completed', ['Aigogogo_Apiaim_Order_Handler', 'on_order_completed'], 10, 1);
    add_action('woocommerce_admin_order_data_after_billing_address', ['Aigogogo_Apiaim_Order_Handler', 'show_sync_status']);

    // WP-Cron 定时重试
    add_action('aigogogo_apiaim_retry_sync', ['Aigogogo_Apiaim_Sync_Queue', 'retry_failed_orders']);

    if (!wp_next_scheduled('aigogogo_apiaim_retry_sync')) {
        wp_schedule_event(time(), 'five_minutes', 'aigogogo_apiaim_retry_sync');
    }
});

/**
 * AJAX 处理连通性测试
 */
function aigogogo_apiaim_ajax_ping() {
    try {
        if (!class_exists('Aigogogo_Apiaim_Client')) {
            wp_send_json(['success' => false, 'code' => 50000, 'message' => 'API 客户端类未加载']);
            return;
        }
        $client = new Aigogogo_Apiaim_Client();
        $result = $client->ping();
        wp_send_json($result);
    } catch (Exception $e) {
        error_log('[Aigogogo ApiAim] Ping AJAX error: ' . $e->getMessage());
        wp_send_json(['success' => false, 'code' => 50000, 'message' => '服务器内部错误: ' . $e->getMessage()]);
    }
}
