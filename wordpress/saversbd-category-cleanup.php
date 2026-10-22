<?php
/**
 * Plugin Name: SaversBD Category Cleanup
 * Description: Merges duplicate product categories, fixes typos and removes empty categories.
 * Version:     1.0.0
 *
 * INSTALL
 *   1. Copy to wp-content/mu-plugins/saversbd-category-cleanup.php
 *   2. Dry run:  wp saversbd cleanup categories --dry-run
 *   3. Apply:    wp saversbd cleanup categories --apply
 *
 * SAFE BY DEFAULT — nothing is written unless --apply is passed.
 * Products are never deleted: a merge moves the products of the source
 * category to the target category and only then removes the empty source.
 *
 * @package SaversBD
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Categories to merge: source slug => target slug.
 */
function saversbd_cleanup_merges(): array {
	return array(
		// Duplicate labels
		'creams'                 => 'cream',
		'cream-moisturizers'     => 'cream',
		'face-wash'              => 'facewash',
		'face-cleansers'         => 'facewash',
		'hair-care-2'            => 'hair-care',
		'hair-care-3'            => 'hair-care',
		'shampoo-2'              => 'shampoo',
		'masks-peels'            => 'face-mask',
		'mask-peels'             => 'face-mask',
		'moisturizing-cream'     => 'moisturising-cream',
		'moisturising-care'      => 'moisturising-cream',
		'daily-moisturizing'     => 'moisturizer',

		// Over-specific or near-empty duplicates
		'gel'                    => 'moisturizer-gel',
		'foaming-gel'            => 'cleansing-gel',
		'scrubs'                 => 'scrubs-exfoliants',
		'facial-scrub'           => 'scrubs-exfoliants',
		'body'                   => 'body-care',
		'body-bath'              => 'body-care',
		'loofahs-sponges'        => 'body-care',
		'body-spray'             => 'body-mist-spray',
		'shower-gels-body-wash'  => 'body-wash',
		'bath-shower'            => 'bath-time',
		'bath-skin'              => 'bath-time',
		'skin'                   => 'skin-care',
		'oil-contro'             => 'oil-control',
		'men-care'               => 'personal-care',
		'baby'                   => 'baby-care',
		'baby-wash-shampoo'      => 'baby-shampoo',
		'imported-diapers'       => 'baby-diapers',
		'bioderma'               => 'skin-care',
	);
}

/**
 * Categories to rename: slug => new name (the slug stays the same).
 */
function saversbd_cleanup_renames(): array {
	return array(
		'acne-treament'                => 'Acne Treatment',
		'repairing-and-protective-cream' => 'Repairing & Protective Cream',
		'foaming-oil'                  => 'Foaming Oil',
		'3-year-6-year'                => '3-6 Years',
		'oil-control'                  => 'Oil Control',
		'acne-treatment'               => 'Acne Treatment',
	);
}

/**
 * Finds a product_cat term by slug.
 *
 * @param string $slug Term slug.
 * @return WP_Term|null
 */
function saversbd_cleanup_term( string $slug ): ?WP_Term {
	$term = get_term_by( 'slug', $slug, 'product_cat' );
	return $term instanceof WP_Term ? $term : null;
}

/**
 * Moves every product from one category to another.
 *
 * @param WP_Term $source Source term.
 * @param WP_Term $target Target term.
 * @param bool    $apply  Whether to write.
 * @return int Number of products moved.
 */
function saversbd_cleanup_move_products( WP_Term $source, WP_Term $target, bool $apply ): int {
	$ids = get_posts(
		array(
			'post_type'      => 'product',
			'posts_per_page' => -1,
			'fields'         => 'ids',
			'tax_query'      => array(
				array(
					'taxonomy' => 'product_cat',
					'field'    => 'term_id',
					'terms'    => (int) $source->term_id,
				),
			),
		)
	);

	if ( $apply ) {
		foreach ( $ids as $product_id ) {
			wp_set_object_terms( $product_id, array( (int) $target->term_id ), 'product_cat', true );
		}
	}

	return count( $ids );
}

/**
 * Runs the cleanup.
 *
 * @param bool $apply Write changes.
 * @return string[] Report lines.
 */
function saversbd_cleanup_run( bool $apply = false ): array {
	$lines   = array();
	$lines[] = $apply ? 'MODE: APPLY' : 'MODE: DRY RUN (nothing will be written)';
	$lines[] = '';

	// 1. Renames -------------------------------------------------------------
	$lines[] = '== Renames ==';
	foreach ( saversbd_cleanup_renames() as $slug => $new_name ) {
		$term = saversbd_cleanup_term( $slug );
		if ( ! $term ) {
			continue;
		}
		if ( $term->name === $new_name ) {
			continue;
		}
		if ( $apply ) {
			wp_update_term( (int) $term->term_id, 'product_cat', array( 'name' => $new_name ) );
		}
		$lines[] = sprintf( '  %s: "%s" -> "%s"', $slug, $term->name, $new_name );
	}
	$lines[] = '';

	// 2. Merges -------------------------------------------------------------
	$lines[] = '== Merges ==';
	$merged  = 0;
	foreach ( saversbd_cleanup_merges() as $source_slug => $target_slug ) {
		$source = saversbd_cleanup_term( $source_slug );
		$target = saversbd_cleanup_term( $target_slug );
		if ( ! $source || ! $target ) {
			$lines[] = sprintf( '  SKIP %s -> %s (term missing)', $source_slug, $target_slug );
			continue;
		}

		$moved = saversbd_cleanup_move_products( $source, $target, $apply );

		// Re-parent any child categories of the source to the target.
		$children = get_terms(
			array(
				'taxonomy'   => 'product_cat',
				'parent'     => (int) $source->term_id,
				'hide_empty' => false,
			)
		);
		if ( ! is_wp_error( $children ) && $children ) {
			foreach ( $children as $child ) {
				if ( $apply ) {
					wp_update_term( (int) $child->term_id, 'product_cat', array( 'parent' => (int) $target->term_id ) );
				}
				$lines[] = sprintf( '      re-parented child: %s', $child->name );
			}
		}

		// Only remove the source once it no longer holds products.
		$remaining = (int) (int) $source->count;
		if ( $apply && $remaining === 0 ) {
			wp_delete_term( (int) $source->term_id, 'product_cat' );
		}
		$merged++;
		$lines[] = sprintf( '  %s (%d products) -> %s', $source_slug, $moved, $target_slug );
	}
	$lines[] = sprintf( '  merged %d categories', $merged );
	$lines[] = '';

	// 3. Empty categories ---------------------------------------------------
	$lines[] = '== Empty categories (no products) ==';
	$empty   = get_terms(
		array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => true,
			'parent'     => 0,
		)
	);
	$deleted = 0;
	if ( ! is_wp_error( $empty ) && $empty ) {
		// Delete deepest first so parents never block.
		usort(
			$empty,
			static function ( $a, $b ) {
				return count( get_term_children( (int) $b->term_id, 'product_cat' ) )
					<=> count( get_term_children( (int) $a->term_id, 'product_cat' ) );
			}
		);
		foreach ( $empty as $term ) {
			if ( 'uncategorized' === $term->slug ) {
				continue;
			}
			if ( $apply ) {
				wp_delete_term( (int) $term->term_id, 'product_cat' );
			}
			$deleted++;
		}
	}
	$lines[] = sprintf( '  %d empty categories removed', $deleted );

	return $lines;
}

/**
 * WP-CLI: wp saversbd cleanup categories [--apply]
 */
if ( defined( 'WP_CLI' ) && WP_CLI ) {
	WP_CLI::add_command(
		'saversbd cleanup',
		function ( $args, $assoc ) {
			$apply = isset( $assoc['apply'] );
			foreach ( saversbd_cleanup_run( $apply ) as $line ) {
				WP_CLI::log( $line );
			}
		}
	);
}

/**
 * Admin tool: Tools → Clean up categories.
 */
add_action( 'admin_menu', function () {
	add_management_page(
		'Clean up categories',
		'Clean up categories',
		'manage_woocommerce',
		'saversbd-category-cleanup',
		function () {
			$apply  = isset( $_POST['saversbd_cleanup_apply'] ) && check_admin_referer( 'saversbd_cleanup' );
			$report = saversbd_cleanup_run( $apply );
			echo '<div class="wrap"><h1>Clean up product categories</h1>';
			echo '<p>Merges duplicate categories, fixes typos and removes empty categories. ' .
				'Products are moved, never deleted. Nothing is written until you press the button.</p>';
			echo '<form method="post">';
			wp_nonce_field( 'saversbd_cleanup' );
			echo '<p><button class="button button-primary" name="saversbd_cleanup_apply" value="1">Apply changes</button></p>';
			echo '</form><pre style="background:#fff;padding:12px;border:1px solid #ccc;overflow:auto">' .
				esc_html( implode( "\n", $report ) ) . '</pre></div>';
		}
	);
}
