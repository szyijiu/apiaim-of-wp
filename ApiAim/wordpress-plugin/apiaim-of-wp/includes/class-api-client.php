<?php
if (!defined('ABSPATH')) exit;

if (!class_exists('Apiaim_Wp_Client')):

class Apiaim_Wp_Client {
    private $base_url;
    private $api_key;
    private $timeout;

    public function __construct() {
        $this->base_url = get_option('apiaim_api_url', 'https://apiaim.com');
        $this->api_key = defined('APIAIM_API_KEY') ? APIAIM_API_KEY : get_option('apiaim_api_key', '');
        $this->timeout = (int) get_option('apiaim_timeout', 30);
    }

    public function topup($params) {
        return $this->request('POST', '/api/v1/proxy/topup', $params);
    }

    public function query_user($email) {
        return $this->request('GET', '/api/v1/proxy/user/query?email=' . urlencode($email));
    }

    public function get_packages() {
        return $this->request('GET', '/api/v1/proxy/package/list');
    }

    public function get_order_status($order_id) {
        return $this->request('GET', '/api/v1/proxy/order/status?order_id=' . urlencode($order_id));
    }

    public function ping() {
        return $this->request('GET', '/api/v1/proxy/ping', null, false);
    }

    private function request($method, $endpoint, $data = null, $require_auth = true) {
        if ($require_auth && empty($this->api_key)) {
            return ['success' => false, 'code' => 40100, 'message' => 'API密钥未配置'];
        }

        $url = rtrim($this->base_url, '/') . $endpoint;
        $timestamp = time();

        $args = [
            'method' => $method,
            'timeout' => $this->timeout,
            'headers' => [
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $this->api_key,
                'X-Timestamp' => (string) $timestamp,
            ],
        ];

        if ($data && $method === 'POST') {
            $args['body'] = wp_json_encode($data);
        }

        if (!$require_auth) {
            unset($args['headers']['Authorization']);
        }

        $response = wp_remote_request($url, $args);

        if (is_wp_error($response)) {
            error_log('[ApiAim WP] Request failed: ' . $response->get_error_message());
            return ['success' => false, 'code' => 50000, 'message' => '请求失败: ' . $response->get_error_message()];
        }

        $body = wp_remote_retrieve_body($response);
        $result = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('[ApiAim WP] Invalid JSON response');
            return ['success' => false, 'code' => 50000, 'message' => '响应格式错误'];
        }

        return $result;
    }
}

endif;
