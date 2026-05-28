<?php
if (!defined('ABSPATH')) exit;

class Apiaim_Wp_Sync_Queue {

    public static function add($order_id, $error_code = 0) {
        $queue = get_option('apiaim_sync_queue', []);

        if (isset($queue[$order_id])) return;

        $queue[$order_id] = [
            'order_id' => $order_id,
            'error_code' => $error_code,
            'attempts' => 0,
            'last_attempt' => time(),
            'next_retry' => time() + (int) get_option('apiaim_retry_interval', 60),
        ];

        update_option('apiaim_sync_queue', $queue);
    }

    public static function remove($order_id) {
        $queue = get_option('apiaim_sync_queue', []);
        unset($queue[$order_id]);
        update_option('apiaim_sync_queue', $queue);
    }

    public static function retry_failed_orders() {
        $queue = get_option('apiaim_sync_queue', []);
        $max_attempts = (int) get_option('apiaim_retry_attempts', 5);
        $now = time();
        $modified = false;

        foreach ($queue as $order_id => &$item) {
            if ($item['next_retry'] > $now) continue;

            if ($item['attempts'] >= $max_attempts) {
                self::notify_admin_final_failure($order_id, $item);
                unset($queue[$order_id]);
                $modified = true;
                continue;
            }

            $order = wc_get_order($order_id);
            if (!$order) {
                unset($queue[$order_id]);
                $modified = true;
                continue;
            }

            $sku = get_post_meta($order_id, '_apiaim_package_sku', true);
            if (empty($sku)) {
                unset($queue[$order_id]);
                $modified = true;
                continue;
            }

            $client = new Apiaim_Wp_Client();
            $result = $client->topup([
                'email' => $order->get_billing_email(),
                'order_id' => 'WC-' . $order_id,
                'package_sku' => $sku,
                'amount' => (float) $order->get_total(),
                'currency' => 'CNY',
            ]);

            $item['attempts']++;
            $item['last_attempt'] = $now;

            if ($result['success']) {
                update_post_meta($order_id, '_apiaim_sync_status', 'success');
                update_post_meta($order_id, '_apiaim_transaction_id', $result['data']['transaction_id'] ?? '');
                update_post_meta($order_id, '_apiaim_user_id', $result['data']['apiaim_user_id'] ?? '');
                update_post_meta($order_id, '_apiaim_sync_time', current_time('mysql'));

                if (!empty($result['data']['redemption_code'])) {
                    update_post_meta($order_id, '_apiaim_redemption_code', $result['data']['redemption_code']);
                }

                unset($queue[$order_id]);
            } else {
                $item['next_retry'] = $now + (int) get_option('apiaim_retry_interval', 60) * pow(2, $item['attempts']);
                update_post_meta($order_id, '_apiaim_sync_error', $result['message'] ?? '未知错误');
            }

            $modified = true;
        }

        if ($modified) {
            update_option('apiaim_sync_queue', $queue);
        }
    }

    private static function notify_admin_final_failure($order_id, $item) {
        $admin_email = get_option('admin_email');
        $subject = '[ApiAim WP] 订单同步最终失败 #' . $order_id;
        $message = "订单 #" . $order_id . " 同步到 ApiAim 失败，已达到最大重试次数。\n\n";
        $message .= "错误代码: " . ($item['error_code'] ?? '未知') . "\n";
        $message .= "重试次数: " . ($item['attempts'] ?? 0) . "\n\n";
        $message .= "请手动检查并处理。";

        wp_mail($admin_email, $subject, $message);
    }
}
