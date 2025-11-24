<?php
/**
 * WooCommerce Integration for MK Atendimento Pro
 * 
 * Handles automatic chat session creation after purchase
 * and redirects customer to chat interface
 * 
 * @package MK_Atendimento_Pro
 * @version 2.0.0
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class MK_Atendimento_WooCommerce_Integration {
    
    private static $instance = null;
    
    /**
     * Get singleton instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor - Register hooks
     */
    private function __construct() {
        // Hook into WooCommerce order completion
        add_action('woocommerce_thankyou', array($this, 'create_chat_session_on_purchase'), 10, 1);
        
        // Hook to redirect after purchase
        add_action('woocommerce_thankyou', array($this, 'redirect_to_chat'), 20, 1);
        
        // Add admin settings
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        
        // Add product metabox
        add_action('add_meta_boxes', array($this, 'add_product_meta_box'));
        add_action('save_post', array($this, 'save_product_meta'));
        
        // Elementor integration
        add_action('elementor/widgets/widgets_registered', array($this, 'register_elementor_widgets'));
        
        // Add shortcode
        add_shortcode('mk_chat_atendimento', array($this, 'chat_shortcode'));
    }
    
    /**
     * Create chat session automatically after purchase
     * 
     * @param int $order_id WooCommerce order ID
     * @return array|null Session data or null on failure
     */
    public function create_chat_session_on_purchase($order_id) {
        if (!$order_id) {
            return null;
        }
        
        // Get the order
        $order = wc_get_order($order_id);
        if (!$order) {
            return null;
        }
        
        // Accept both processing and completed status
        $allowed_statuses = array('processing', 'completed', 'on-hold');
        
        if (!in_array($order->get_status(), $allowed_statuses)) {
            return null;
        }
        
        // Avoid duplication
        $session_created = get_post_meta($order_id, '_mk_chat_session_created', true);
        if ($session_created) {
            return null;
        }
        
        // Customer data
        $customer_email = $order->get_billing_email();
        $customer_name = trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name());
        $customer_id = $order->get_customer_id();
        
        // Create session via API
        $session_data = $this->create_session_via_api(array(
            'orderId' => $order_id,
            'customerEmail' => $customer_email,
            'customerName' => $customer_name,
            'customerId' => $customer_id
        ));
        
        if ($session_data && isset($session_data['token'])) {
            // Save token in order metadata
            update_post_meta($order_id, '_mk_chat_token', $session_data['token']);
            update_post_meta($order_id, '_mk_chat_session_id', $session_data['sessionId']);
            update_post_meta($order_id, '_mk_chat_session_created', true);
            update_post_meta($order_id, '_mk_chat_created_at', current_time('mysql'));
            
            // Add order note
            $order->add_order_note(
                sprintf(
                    __('Sessão de chat criada automaticamente. ID: %s', 'mk-atendimento'),
                    $session_data['sessionId']
                )
            );
            
            return $session_data;
        }
        
        return null;
    }
    
    /**
     * Redirect to chat after purchase
     * 
     * @param int $order_id WooCommerce order ID
     */
    public function redirect_to_chat($order_id) {
        if (!$order_id) {
            return;
        }
        
        $order = wc_get_order($order_id);
        if (!$order) {
            return;
        }
        
        // Check if redirect is enabled
        $redirect_enabled = get_option('mk_atendimento_redirect_enabled', 'yes');
        if ($redirect_enabled !== 'yes') {
            return;
        }
        
        // Accept processing status
        $allowed_statuses = array('processing', 'completed', 'on-hold');
        if (!in_array($order->get_status(), $allowed_statuses)) {
            return;
        }
        
        // Get session token
        $token = get_post_meta($order_id, '_mk_chat_token', true);
        if (!$token) {
            // Try to create session if not exists
            $session_data = $this->create_chat_session_on_purchase($order_id);
            if ($session_data && isset($session_data['token'])) {
                $token = $session_data['token'];
            }
        }
        
        if (!$token) {
            return; // Cannot redirect without token
        }
        
        // Redirect type (redirect, button, or popup)
        $redirect_type = get_option('mk_atendimento_redirect_type', 'redirect');
        
        // Chat page URL
        $chat_page_id = get_option('mk_atendimento_chat_page_id');
        
        if ($chat_page_id) {
            $chat_url = get_permalink($chat_page_id);
            $chat_url = add_query_arg('token', $token, $chat_url);
            $chat_url = add_query_arg('order_id', $order_id, $chat_url);
        } else {
            // Default URL if not configured
            $chat_url = home_url('/chat/?token=' . $token . '&order_id=' . $order_id);
        }
        
        if ($redirect_type === 'redirect') {
            // Direct redirect
            if (!headers_sent()) {
                wp_redirect($chat_url);
                exit;
            }
        } else if ($redirect_type === 'button') {
            // Add button on thank you page
            add_action('woocommerce_thankyou', function($order_id) use ($chat_url) {
                echo '<div class="mk-chat-redirect-button" style="margin: 30px 0; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">';
                echo '<h3 style="margin-top: 0; color: #21808d;">' . __('Atendimento Disponível', 'mk-atendimento') . '</h3>';
                echo '<p style="margin-bottom: 20px;">' . __('Nossa equipe está pronta para ajudar você. Inicie uma conversa agora!', 'mk-atendimento') . '</p>';
                echo '<a href="' . esc_url($chat_url) . '" class="button alt" style="background: #21808d; color: white; padding: 15px 40px; text-decoration: none; display: inline-block; border-radius: 5px; font-weight: 600; font-size: 16px; transition: all 0.3s;">';
                echo '💬 ' . __('Iniciar Chat de Atendimento', 'mk-atendimento');
                echo '</a>';
                echo '</div>';
            }, 30);
        } else if ($redirect_type === 'popup') {
            // Add automatic popup
            add_action('wp_footer', function() use ($chat_url, $order_id) {
                ?>
                <script type="text/javascript">
                jQuery(document).ready(function($) {
                    // Only execute on thank you page
                    if ($('.woocommerce-thankyou-order-received').length > 0 || $('body').hasClass('woocommerce-order-received')) {
                        setTimeout(function() {
                            var message = '<?php echo esc_js(__('Sua compra foi recebida! Deseja iniciar uma conversa com nosso atendimento agora?', 'mk-atendimento')); ?>';
                            if (confirm(message)) {
                                window.location.href = '<?php echo esc_js($chat_url); ?>';
                            }
                        }, 2000); // 2 seconds delay
                    }
                });
                </script>
                <?php
            });
        }
    }
    
    /**
     * Create session via tRPC API
     * 
     * @param array $data Session data
     * @return array|null API response or null on failure
     */
    private function create_session_via_api($data) {
        // tRPC API URL
        $api_url = home_url('/wp-json/mk-atendimento/v1/trpc/chat.startSession');
        
        $response = wp_remote_post($api_url, array(
            'body' => json_encode($data),
            'headers' => array(
                'Content-Type' => 'application/json'
            ),
            'timeout' => 15
        ));
        
        if (is_wp_error($response)) {
            error_log('MK Atendimento: Erro ao criar sessão - ' . $response->get_error_message());
            return null;
        }
        
        $body = wp_remote_retrieve_body($response);
        $result = json_decode($body, true);
        
        return $result;
    }
    
    /**
     * Register admin settings
     */
    public function register_settings() {
        // Register settings
        register_setting('mk_atendimento_settings', 'mk_atendimento_redirect_enabled');
        register_setting('mk_atendimento_settings', 'mk_atendimento_redirect_type');
        register_setting('mk_atendimento_settings', 'mk_atendimento_chat_page_id');
        register_setting('mk_atendimento_settings', 'mk_atendimento_accept_processing');
        
        // Add settings section
        add_settings_section(
            'mk_atendimento_woocommerce_section',
            __('Integração WooCommerce', 'mk-atendimento'),
            array($this, 'render_section_description'),
            'mk-atendimento-settings'
        );
        
        // Enable redirect
        add_settings_field(
            'mk_atendimento_redirect_enabled',
            __('Habilitar Redirecionamento', 'mk-atendimento'),
            array($this, 'render_checkbox_field'),
            'mk-atendimento-settings',
            'mk_atendimento_woocommerce_section',
            array('option_name' => 'mk_atendimento_redirect_enabled')
        );
        
        // Redirect type
        add_settings_field(
            'mk_atendimento_redirect_type',
            __('Tipo de Redirecionamento', 'mk-atendimento'),
            array($this, 'render_redirect_type_field'),
            'mk-atendimento-settings',
            'mk_atendimento_woocommerce_section'
        );
        
        // Chat page
        add_settings_field(
            'mk_atendimento_chat_page_id',
            __('Página de Chat', 'mk-atendimento'),
            array($this, 'render_page_select_field'),
            'mk-atendimento-settings',
            'mk_atendimento_woocommerce_section'
        );
        
        // Accept processing status
        add_settings_field(
            'mk_atendimento_accept_processing',
            __('Aceitar Status "Processing"', 'mk-atendimento'),
            array($this, 'render_checkbox_field'),
            'mk-atendimento-settings',
            'mk_atendimento_woocommerce_section',
            array(
                'option_name' => 'mk_atendimento_accept_processing',
                'description' => __('Criar chat mesmo quando pedido está em "Processando"', 'mk-atendimento')
            )
        );
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_menu_page(
            __('MK Atendimento', 'mk-atendimento'),
            __('MK Atendimento', 'mk-atendimento'),
            'manage_options',
            'mk-atendimento',
            array($this, 'render_admin_page'),
            'dashicons-format-chat',
            56
        );
        
        add_submenu_page(
            'mk-atendimento',
            __('Configurações', 'mk-atendimento'),
            __('Configurações', 'mk-atendimento'),
            'manage_options',
            'mk-atendimento-settings',
            array($this, 'render_settings_page')
        );
    }
    
    /**
     * Render admin page
     */
    public function render_admin_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <p><?php _e('Bem-vindo ao MK Atendimento Pro - Sistema de chat integrado ao WooCommerce.', 'mk-atendimento'); ?></p>
        </div>
        <?php
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <form method="post" action="options.php">
                <?php
                settings_fields('mk_atendimento_settings');
                do_settings_sections('mk-atendimento-settings');
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }
    
    /**
     * Render section description
     */
    public function render_section_description() {
        echo '<p>' . __('Configure como o chat será iniciado após a compra no WooCommerce.', 'mk-atendimento') . '</p>';
    }
    
    /**
     * Render checkbox field
     */
    public function render_checkbox_field($args) {
        $option_name = $args['option_name'];
        $value = get_option($option_name, 'yes');
        $description = isset($args['description']) ? $args['description'] : '';
        ?>
        <label>
            <input type="checkbox" name="<?php echo esc_attr($option_name); ?>" value="yes" <?php checked($value, 'yes'); ?>>
            <?php echo esc_html($description); ?>
        </label>
        <?php
    }
    
    /**
     * Render redirect type field
     */
    public function render_redirect_type_field() {
        $value = get_option('mk_atendimento_redirect_type', 'redirect');
        ?>
        <select name="mk_atendimento_redirect_type">
            <option value="redirect" <?php selected($value, 'redirect'); ?>><?php _e('Redirecionamento Automático', 'mk-atendimento'); ?></option>
            <option value="button" <?php selected($value, 'button'); ?>><?php _e('Botão na Página de Obrigado', 'mk-atendimento'); ?></option>
            <option value="popup" <?php selected($value, 'popup'); ?>><?php _e('Popup Automático', 'mk-atendimento'); ?></option>
        </select>
        <p class="description">
            <?php _e('Como o cliente será direcionado ao chat após a compra.', 'mk-atendimento'); ?>
        </p>
        <?php
    }
    
    /**
     * Render page select field
     */
    public function render_page_select_field() {
        $value = get_option('mk_atendimento_chat_page_id');
        wp_dropdown_pages(array(
            'name' => 'mk_atendimento_chat_page_id',
            'selected' => $value,
            'show_option_none' => __('— Selecione uma página —', 'mk-atendimento'),
            'option_none_value' => ''
        ));
        ?>
        <p class="description">
            <?php _e('Página onde o chat será exibido. Deixe em branco para usar URL padrão.', 'mk-atendimento'); ?>
        </p>
        <?php
    }
    
    /**
     * Add product metabox
     */
    public function add_product_meta_box() {
        add_meta_box(
            'mk_atendimento_product_settings',
            __('Configurações de Chat', 'mk-atendimento'),
            array($this, 'render_product_meta_box'),
            'product',
            'side',
            'default'
        );
    }
    
    /**
     * Render product metabox
     */
    public function render_product_meta_box($post) {
        $enable_chat = get_post_meta($post->ID, '_mk_enable_chat', true);
        ?>
        <p>
            <label>
                <input type="checkbox" name="mk_enable_chat" value="yes" <?php checked($enable_chat, 'yes'); ?>>
                <?php _e('Habilitar chat para este produto', 'mk-atendimento'); ?>
            </label>
        </p>
        <?php
    }
    
    /**
     * Save product meta
     */
    public function save_product_meta($post_id) {
        if (isset($_POST['mk_enable_chat'])) {
            update_post_meta($post_id, '_mk_enable_chat', 'yes');
        } else {
            delete_post_meta($post_id, '_mk_enable_chat');
        }
    }
    
    /**
     * Register Elementor widgets
     */
    public function register_elementor_widgets() {
        if (defined('ELEMENTOR_VERSION')) {
            $widget_file = plugin_dir_path(__FILE__) . 'elementor-widgets/chat-widget.php';
            if (file_exists($widget_file)) {
                require_once $widget_file;
                \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new \MK_Atendimento_Chat_Widget());
            }
        }
    }
    
    /**
     * Chat shortcode
     */
    public function chat_shortcode($atts) {
        $atts = shortcode_atts(array(
            'title' => __('Atendimento ao Cliente', 'mk-atendimento'),
            'show_if_no_token' => 'no'
        ), $atts);
        
        // Get token from URL
        $token = isset($_GET['token']) ? sanitize_text_field($_GET['token']) : '';
        
        if (empty($token) && $atts['show_if_no_token'] === 'no') {
            return '<div class="mk-chat-notice"><p>' . __('Nenhuma sessão de chat ativa.', 'mk-atendimento') . '</p></div>';
        }
        
        ob_start();
        ?>
        <div class="mk-chat-shortcode-container">
            <h3><?php echo esc_html($atts['title']); ?></h3>
            <div id="mk-chat-root" data-token="<?php echo esc_attr($token); ?>"></div>
        </div>
        
        <script>
            window.mkChatConfig = {
                token: '<?php echo esc_js($token); ?>',
                apiUrl: '<?php echo esc_js(home_url('/wp-json/mk-atendimento/v1/trpc')); ?>'
            };
        </script>
        <?php
        return ob_get_clean();
    }
}

// Initialize integration
MK_Atendimento_WooCommerce_Integration::get_instance();
