<?php
if (!defined('ABSPATH')) exit;

if (!class_exists('Apiaim_Wp_Admin_Settings')):

class Apiaim_Wp_Admin_Settings {

    public static function add_menu() {
        if (!class_exists('WooCommerce')) return;
        add_submenu_page(
            'woocommerce',
            'ApiAim 同步设置',
            'ApiAim 同步',
            'manage_woocommerce',
            'apiaim-wp-settings',
            [__CLASS__, 'render_settings_page']
        );
    }

    public static function register_settings() {
        register_setting('apiaim_wp_settings', 'apiaim_api_url');
        register_setting('apiaim_wp_settings', 'apiaim_api_key');
        register_setting('apiaim_wp_settings', 'apiaim_timeout');
        register_setting('apiaim_wp_settings', 'apiaim_retry_attempts');
        register_setting('apiaim_wp_settings', 'apiaim_retry_interval');
    }

    public static function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>ApiAim 同步设置</h1>
            <?php $api_key_const = defined('APIAIM_API_KEY'); ?>

            <form method="post" action="options.php">
                <?php settings_fields('apiaim_wp_settings'); ?>

                <table class="form-table">
                    <tr>
                        <th scope="row">API 地址</th>
                        <td>
                            <input type="url" name="apiaim_api_url" value="<?php echo esc_attr(get_option('apiaim_api_url', 'https://apiaim.com')); ?>" class="regular-text" />
                            <p class="description">主站 ApiAim 的基础 URL</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">API 密钥</th>
                        <td>
                            <input type="password" name="apiaim_api_key" value="<?php echo $api_key_const ? '' : esc_attr(get_option('apiaim_api_key', '')); ?>" class="regular-text" <?php echo $api_key_const ? 'disabled' : ''; ?> />
                            <?php if ($api_key_const): ?>
                                <p class="description" style="color: green;">已在 wp-config.php 中设置 APIAIM_API_KEY 常量</p>
                            <?php else: ?>
                                <p class="description">从 ApiAim 主站获取的 API 密钥（也可在 wp-config.php 中定义 APIAIM_API_KEY 常量）</p>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">超时时间（秒）</th>
                        <td>
                            <input type="number" name="apiaim_timeout" value="<?php echo esc_attr(get_option('apiaim_timeout', 30)); ?>" min="5" max="120" />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">重试次数</th>
                        <td>
                            <input type="number" name="apiaim_retry_attempts" value="<?php echo esc_attr(get_option('apiaim_retry_attempts', 5)); ?>" min="0" max="20" />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">重试间隔（秒）</th>
                        <td>
                            <input type="number" name="apiaim_retry_interval" value="<?php echo esc_attr(get_option('apiaim_retry_interval', 60)); ?>" min="10" max="3600" />
                        </td>
                    </tr>
                </table>

                <?php submit_button('保存设置'); ?>
            </form>

            <hr>

            <h2>连通性测试</h2>
            <p>点击按钮测试与 ApiAim 主站的连接</p>
            <button id="apiaim-ping-btn" class="button button-secondary">测试连接</button>
            <span id="apiaim-ping-result"></span>

            <script>
            jQuery('#apiaim-ping-btn').click(function() {
                var btn = jQuery(this);
                var result = jQuery('#apiaim-ping-result');
                btn.prop('disabled', true);
                result.text('测试中...');

                jQuery.ajax({
                    url: '<?php echo admin_url('admin-ajax.php', 'https'); ?>',
                    type: 'POST',
                    data: {
                        action: 'apiaim_ping_test'
                    },
                    success: function(response) {
                        if (response.success) {
                            result.html('<span style="color: green;">连接成功: ' + response.message + '</span>');
                        } else {
                            result.html('<span style="color: red;">连接失败: ' + response.message + '</span>');
                        }
                    },
                    error: function() {
                        result.html('<span style="color: red;">请求失败</span>');
                    },
                    complete: function() {
                        btn.prop('disabled', false);
                    }
                });
            });
            </script>
        </div>
        <?php
    }
}

endif;
