<?php
/**
 * Plugin Name: SaversBD Headless Revalidation
 * Description: Clears the Next.js cache as soon as WordPress content changes.
 * Version:     1.0.0
 *
 * Install: copy to wp-content/mu-plugins/ (create the folder if needed).
 * Then add these constants to wp-config.php:
 *
 *   define('SAVERSBD_FRONTEND_URL', 'https://saversbd.com');
 *   define('SAVERSBD_REVALIDATE_SECRET', 'same-value-as-REVALIDATE_SECRET');
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Fire-and-forget POST to the frontend revalidation endpoint.
 *
 * @param string[] $paths Frontend paths to refresh.
 */
function saversbd_revalidate(array $paths): void
{
    $endpoint = defined('SAVERSBD_FRONTEND_URL') ? rtrim(SAVERSBD_FRONTEND_URL, '/') : '';
    $secret   = defined('SAVERSBD_REVALIDATE_SECRET') ? SAVERSBD_REVALIDATE_SECRET : '';

    if (!$endpoint || !$secret) {
        return;
    }

    foreach (array_unique($paths) as $path) {
        wp_remote_post(
            add_query_arg(
                array('secret' => $secret, 'path' => $path),
                $endpoint . '/api/revalidate'
            ),
            array(
                'timeout'  => 5,
                'blocking' => false,
                'headers'  => array('Content-Type' => 'application/json'),
            )
        );
    }
}

/**
 * "Buy now" support for the headless storefront.
 *
 * The Next.js frontend links to
 *   /?add-to-cart=123&quantity=1&buy_now=1
 * WooCommerce adds the product, then this filter sends the shopper straight
 * to checkout instead of the cart page.
 */
add_filter(
	'woocommerce_add_to_cart_redirect',
	function ( $redirect_url ) {
		if ( ! empty( $_GET['buy_now'] ) && function_exists( 'wc_get_checkout_url' ) ) {
			return wc_get_checkout_url();
		}
		return $redirect_url;
	},
	20
);

/**
 * Content changes.
 */
add_action('save_post', function ($post_id, $post) {
    if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
        return;
    }
    if ($post->post_status !== 'publish') {
        return;
    }

    $paths = array('/', '/shop', '/blog');

    if ($post->post_type === 'product') {
        $paths[] = '/product/' . $post->post_name;
        $paths[] = '/categories';
    } elseif ($post->post_type === 'post') {
        $paths[] = '/blog/' . $post->post_name;
    } elseif ($post->post_type === 'page') {
        $paths[] = '/' . $post->post_name;
    }

    saversbd_revalidate($paths);
}, 10, 2);

/**
 * Trash / delete.
 */
add_action('trashed_post', function ($post_id) {
    $post = get_post($post_id);
    if ($post && $post->post_type === 'product') {
        saversbd_revalidate(array('/shop', '/categories'));
    }
});

/**
 * Stock and price edits made from the WooCommerce product screen.
 */
add_action('woocommerce_update_product', function ($product_id) {
    $slug = get_post_field('post_name', $product_id);
    saversbd_revalidate(array('/shop', '/product/' . $slug));
}, 20);
