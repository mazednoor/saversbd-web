<?php
/**
 * Plugin Name: SaversBD Contact Form
 * Description: Accepts contact form messages from the SaversBD frontend and emails the store owner.
 * Version: 1.0.0
 */
defined( 'ABSPATH' ) || exit;

add_action( 'rest_api_init', function () {
    register_rest_route( 'saversbd/v1', '/contact', array(
        'methods'             => 'POST',
        'permission_callback' => function ( $request ) {
            $origin = $request->get_header( 'origin' );
            $allowed = apply_filters( 'saversbd_contact_allowed_origins', array( 'https://saversbd-web.vercel.app', 'https://saversbd.com', 'https://www.saversbd.com' ) );
            return is_string( $origin ) && in_array( rtrim( $origin, '/' ), $allowed, true );
        },
        'callback'            => function ( $request ) {
            $data = $request->get_json_params();
            if ( ! is_array( $data ) ) {
                return new WP_Error( 'invalid_request', 'Please check your message and try again.', array( 'status' => 400 ) );
            }
            if ( ! empty( $data['website'] ) ) {
                return rest_ensure_response( array( 'success' => true ) );
            }
            $name = sanitize_text_field( is_string( $data['name'] ?? null ) ? $data['name'] : '' );
            $email = sanitize_email( is_string( $data['email'] ?? null ) ? $data['email'] : '' );
            $order = sanitize_text_field( is_string( $data['order'] ?? null ) ? $data['order'] : '' );
            $message = sanitize_textarea_field( is_string( $data['message'] ?? null ) ? $data['message'] : '' );
            if ( ! $name || ! is_email( $email ) || strlen( $name ) > 120 || strlen( $email ) > 254 || strlen( $order ) > 80 || strlen( $message ) < 10 || strlen( $message ) > 5000 ) {
                return new WP_Error( 'invalid_fields', 'Please provide a valid name, email and message.', array( 'status' => 400 ) );
            }
            $address = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
            $rate_key = 'saversbd_contact_' . hash_hmac( 'sha256', $address, wp_salt( 'nonce' ) );
            if ( get_transient( $rate_key ) ) {
                return new WP_Error( 'rate_limit', 'Please wait a minute before sending another message.', array( 'status' => 429 ) );
            }
            set_transient( $rate_key, 1, MINUTE_IN_SECONDS );
            $body = "Name: {$name}\nEmail: {$email}\nOrder: {$order}\n\nMessage:\n{$message}";
            $recipient = defined( 'SAVERSBD_CONTACT_EMAIL' ) ? sanitize_email( SAVERSBD_CONTACT_EMAIL ) : '';
            if ( ! is_email( $recipient ) ) {
                return new WP_Error( 'mail_not_configured', 'Sorry, the contact form is temporarily unavailable.', array( 'status' => 503 ) );
            }
            $sent = wp_mail( $recipient, 'SaversBD contact form', $body, array( 'Reply-To: ' . $email ) );
            if ( ! $sent ) {
                delete_transient( $rate_key );
                return new WP_Error( 'mail_unavailable', 'Sorry, we could not send your message. Please try again later.', array( 'status' => 503 ) );
            }
            return rest_ensure_response( array( 'success' => true ) );
        },
    ) );
} );
