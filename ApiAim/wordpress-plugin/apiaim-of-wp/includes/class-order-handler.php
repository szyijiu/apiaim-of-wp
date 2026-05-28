<?php
if (!defined('ABSPATH')) exit;

if (!class_exists('Apiaim_Wp_Order_Handler')):

class Apiaim_Wp_Order_Handler {

    public static function activate() {
    }

    public static function deactivate() {
        wp_clear_scheduled_hook('apiaim_wp_retry_sync');
    }

    public static function on_order_completed($order_id) {
        $order = wc_get_order($order_id);
        if (!$order) return;

        $sync_status = get_post_meta($order_id, '_apiaim_sync_status', true);
        if ($sync_status === 'success') return;

        $sku = get_post_meta($order_id, '_apiaim_package_sku', true);
        if (empty($sku)) {
            $sku = self::get_sku_from_order($order);
        }

        if (empty($sku)) {
            error_log('[ApiAim WP] Order #' . $order_id . ' has no SKU');
            return;
        }

        $email = $order->get_billing_email();
        $amount = (float) $order->get_total();
        $order_id_str = 'WC-' . $order_id;

        $client = new Apiaim_Wp_Client();
        $result = $client->topup([
            'email' => $email,
            'order_id' => $order_id_str,
            'package_sku' => $sku,
            'amount' => $amount,
            'currency' => 'CNY',
        ]);

        if ($result['success']) {
            update_post_meta($order_id, '_apiaim_sync_status', 'success');
            update_post_meta($order_id, '_apiaim_transaction_id', $result['data']['transaction_id'] ?? '');
            update_post_meta($order_id, '_apiaim_user_id', $result['data']['apiaim_user_id'] ?? '');
            update_post_meta($order_id, '_apiaim_sync_time', current_time('mysql'));

            if (!empty($result['data']['redemption_code'])) {
                update_post_meta($order_id, '_apiaim_redemption_code', $result['data']['redemption_code']);
            }

            Apiaim_Wp_Sync_Queue::remove($order_id);
        } else {
            update_post_meta($order_id, '_apiaim_sync_status', 'failed');
            update_post_meta($order_id, '_apiaim_sync_error', $result['message'] ?? '未知错误');
            update_post_meta($order_id, '_apiaim_sync_code', $result['code'] ?? 0);

            Apiaim_Wp_Sync_Queue::add($order_id, $result['code'] ?? 0);
        }
    }

    private static function get_sku_from_order($order) {
        foreach ($order->get_items() as $item) {
            $product = $item->get_product();
            if ($product) {
                $sku = $product->get_sku();
                if (!empty($sku)) {
                    return $sku;
                }
            }
        }
        return '';
    }

    public static function show_sync_status($order) {
        $order_id = $order->get_id();
        $sync_status = get_post_meta($order_id, '_apiaim_sync_status', true);
        $transaction_id = get_post_meta($order_id, '_apiaim_transaction_id', true);
        $apiaim_user_id = get_post_meta($order_id, '_apiaim_user_id', true);
        $sync_time = get_post_meta($order_id, '_apiaim_sync_time', true);
        $sync_error = get_post_meta($order_id, '_apiaim_sync_error', true);

        if (empty($sync_status)) return;

        echo '<div class="woocommerce_order_data_thumbnail">';
        echo '<h3>ApiAim 同步状态</h3>';

        if ($sync_status === 'success') {
            echo '<p><strong>状态:</strong> <span style="color: green;">已同步</span></p>';
            echo '<p><strong>主站交易号:</strong> ' . esc_html($transaction_id) . '</p>';
            echo '<p><strong>主站用户ID:</strong> ' . esc_html($apiaim_user_id) . '</p>';
            echo '<p><strong>同步时间:</strong> ' . esc_html($sync_time) . '</p>';
        } else {
            echo '<p><strong>状态:</strong> <span style="color: red;">同步失败</span></p>';
            echo '<p><strong>错误信息:</strong> ' . esc_html($sync_error) . '</p>';
        }

        echo '</div>';
    }
}

endif;
