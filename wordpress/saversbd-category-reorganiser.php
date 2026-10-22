<?php
/**
 * Plugin Name: SaversBD Category Reorganiser
 * Description: Rebuilds the WooCommerce product category tree so the WordPress admin matches the curated storefront taxonomy (7 departments → groups → categories).
 * Version:     1.0.0
 *
 * INSTALL
 *   1. Copy to wp-content/mu-plugins/saversbd-category-reorganiser.php
 *   2. Dry run first:  wp saversbd categories reorganise --dry-run
 *   3. Apply:         wp saversbd categories reorganise --apply
 *
 * The script only ever changes the PARENT of a category and creates the
 * department / group containers. It never deletes a category and never
 * touches product assignments, so it is safe to re-run.
 *
 * @package SaversBD
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The curated taxonomy. Keys are department slugs, values are groups.
 * Category slugs match the ones already in the store.
 */
function saversbd_taxonomy_map(): array {
	return array(
		'skincare-beauty'        => array(
			'name'   => 'Skincare & Beauty',
			'groups' => array(
				'Skin Care'             => array( 'skin-care', 'serums', 'sensitive-skin', 'skin-lightening', 'acne-treament', 'dry-skin', 'skin', 'natural', 'pore-care', 'oil-control', 'oil-contro', 'skin-relief', 'soothing' ),
				'Face Care'             => array( 'face', 'facewash', 'face-wash', 'face-cleansers', 'cleanser', 'cleanser-water', 'cleansing-gel', 'cleansing-milk', 'cleansing-oil-cleanser', 'micellar-water', 'foaming-gel', 'foaming-oil', 'facial-scrub', 'scrubs', 'makeup', 'bioderma', 'eye-care', 'eye-repair', 'mask-peels', 'masks-peels', 'face-mask', 'face-serum', 'facial-oil' ),
				'Creams & Moisturisers'  => array( 'cream', 'creams', 'cream-moisturizers', 'lotion', 'lotions-creams', 'face-cream', 'day-night-cream', 'day-cream', 'night-cream', 'moisturizer', 'moisturizing-cream', 'moisturising-care', 'moisturising-cream', 'moisturizer-gel', 'nourishing-cream', 'daily-moisturizing', 'repairing-and-protective-cream', 'ultra-nourishing-balm', 'ultra-nourishing-cream', 'ultra-soothing-balm', 'gel', 'body-cream', 'body-lotion' ),
				'Body Care & Bath'      => array( 'body', 'body-bath', 'body-care', 'body-wash', 'body-spray', 'body-mist-spray', 'bath-shower', 'bath-time', 'bath-skin', 'shower-cream', 'shower-gels-body-wash', 'loofahs-sponges', 'scrubs-exfoliants' ),
				'Sun Protection'         => array( 'sun-care', 'sun-protection', 'sunscreen', 'cold-protection' ),
				'Personal Care'          => array( 'personal-care', 'men-care' ),
			),
		),
		'hair-care'               => array(
			'name'   => 'Hair Care',
			'groups' => array(
				'Shampoo'            => array( 'shampoo', 'shampoo-2' ),
				'Conditioner'        => array( 'conditioner' ),
				'Styling & Treatment' => array( 'hair-oil', 'hair-mask', 'hair-color', 'hair-care-2', 'hair-care-3' ),
			),
		),
		'baby-mother'             => array(
			'name'   => 'Baby & Mother',
			'groups' => array(
				'Baby Essentials' => array( 'baby', 'baby-care', 'baby-products', 'baby-body-care', 'baby-skin', 'mom-baby' ),
				'Diapers'         => array( 'baby-diapers', 'imported-diapers' ),
				'Bath & Skin'     => array( 'baby-bath-wash', 'baby-oil', 'baby-shampoo', 'baby-wash-shampoo', 'baby-lotion' ),
			),
		),
		'deodorants-fragrance'     => array(
			'name'   => 'Deodorants & Fragrance',
			'groups' => array(
				'Deodorants' => array( 'deodorant', 'deodorant-stick', 'deodorants-roll-ons' ),
				'Fragrance'  => array( 'perfume', 'for-her', 'for-him', 'body-spray', 'body-mist-spray' ),
			),
		),
		'toys-play'               => array(
			'name'   => 'Toys & Play',
			'groups' => array(
				'By Age'  => array( '0-12m', '12-month-36-month', '3-year-6-year', '6-year-plus' ),
				'By Type' => array( 'board-games', 'home-play-activities', 'kitchen-sets', 'learning-educational-toys', 'musical-toys', 'piano-keyboards', 'best-multifunctional-toys' ),
			),
		),
		'health-grooming'         => array(
			'name'   => 'Health & Grooming',
			'groups' => array(
				'Health Support' => array( 'health-support', 'baby-health' ),
				'Grooming'       => array( 'trimmer', 'relaxing-oil' ),
			),
		),
		'food-snacks'             => array(
			'name'   => 'Food & Snacks',
			'groups' => array(
				'Snacks' => array( 'chocolate' ),
			),
		),
	);
}

/**
 * Finds a product_cat term by slug.
 *
 * @param string $slug Term slug.
 * @return WP_Term|null
 */
function saversbd_get_term( string $slug ): ?WP_Term {
	$term = get_term_by( 'slug', $slug, 'product_cat' );
	return $term instanceof WP_Term ? $term : null;
}

/**
 * Creates (or returns) a product_cat term.
 *
 * @param string $name   Term name.
 * @param int    $parent Parent term id.
 * @param string $slug   Term slug.
 * @return int Term id.
 */
function saversbd_ensure_term( string $name, int $parent, string $slug, bool $apply ): int {
	$existing = saversbd_get_term( $slug );
	if ( $existing ) {
		return (int) $existing->term_id;
	}

	if ( ! $apply ) {
		return 0;
	}

	$created = wp_insert_term(
		$name,
		'product_cat',
		array(
			'slug'   => $slug,
			'parent' => $parent,
		)
	);

	return is_wp_error( $created ) ? 0 : (int) $created['term_id'];
}

/**
 * Re-parents a category.
 *
 * @param int  $term_id Term id.
 * @param int  $parent  New parent id.
 * @param bool $apply   Whether to write the change.
 * @return string Action taken.
 */
function saversbd_reparent( int $term_id, int $parent, bool $apply ): string {
	$term = get_term( $term_id, 'product_cat' );
	if ( ! $term instanceof WP_Term ) {
		return 'missing';
	}
	if ( (int) $term->parent === $parent ) {
		return 'unchanged';
	}
	if ( $parent && $parent === $term_id ) {
		return 'skip-self';
	}

	if ( $apply ) {
		wp_update_term( $term_id, 'product_cat', array( 'parent' => $parent ) );
	}

	return 'moved';
}

/**
 * Runs the reorganisation.
 *
 * @param bool $apply Write changes (false = dry run).
 * @return array Report lines.
 */
function saversbd_reorganise( bool $apply = false ): array {
	$lines    = array();
	$lines[]  = $apply ? 'MODE: APPLY' : 'MODE: DRY RUN (nothing will be written)';
	$map      = saversbd_taxonomy_map();
	$summary  = array( 'moved' => 0, 'unchanged' => 0, 'missing' => 0, 'created' => 0 );

	foreach ( $map as $dept_slug => $dept ) {
		$dept_id = saversbd_ensure_term( $dept['name'], 0, $dept_slug, $apply );
		if ( $dept_id && ! saversbd_get_term( $dept_slug ) ) {
			$summary['created']++;
		}
		$lines[] = sprintf( 'Department: %s (id %d)', $dept['name'], $dept_id );

		foreach ( $dept['groups'] as $group_name => $slugs ) {
			$group_slug = sanitize_title( $dept_slug . '-' . $group_name );
			$group_id   = saversbd_ensure_term( $group_name, $dept_id, $group_slug, $apply );

			foreach ( $slugs as $slug ) {
				$term = saversbd_get_term( $slug );
				if ( ! $term ) {
					$summary['missing']++;
					$lines[] = sprintf( '    MISSING category: %s', $slug );
					continue;
				}
				$action = saversbd_reparent( (int) $term->term_id, $group_id, $apply );
				$summary[ $action ] = ( $summary[ $action ] ?? 0 ) + 1;
				$lines[] = sprintf(
					'    %-9s %s -> %s',
					$action,
					$slug,
					$group_name
				);
			}
		}
	}

	$lines[] = '';
	$lines[] = sprintf(
		'Moved: %d | Unchanged: %d | Missing: %d | Created: %d',
		$summary['moved'],
		$summary['unchanged'],
		$summary['missing'],
		$summary['created']
	);

	return $lines;
}

/**
 * WP-CLI command: wp saversbd categories reorganise [--apply]
 */
if ( defined( 'WP_CLI' ) && WP_CLI ) {
	WP_CLI::add_command(
		'saversbd categories',
		function ( $args, $assoc ) {
			$apply = isset( $assoc['apply'] );
			foreach ( saversbd_reorganise( $apply ) as $line ) {
				WP_CLI::log( $line );
			}
		}
	);
}

/**
 * Admin tool: Tools → Reorganise categories.
 */
add_action( 'admin_menu', function () {
	add_management_page(
		'Reorganise categories',
		'Reorganise categories',
		'manage_woocommerce',
		'saversbd-categories',
		function () {
			$apply    = isset( $_POST['saversbd_apply'] ) && check_admin_referer( 'saversbd_reorganise' );
			$report   = saversbd_reorganise( $apply );
			echo '<div class="wrap"><h1>Reorganise product categories</h1>';
			echo '<p>Rebuilds the category tree to match the storefront taxonomy: 7 departments → groups → categories. ' .
				'Only the parent of each category is changed — nothing is deleted and no product assignments are touched.</p>';
			echo '<form method="post">';
			wp_nonce_field( 'saversbd_reorganise' );
			echo '<p><button class="button button-primary" name="saversbd_apply" value="1">Apply changes</button></p>';
			echo '</form><pre style="background:#fff;padding:12px;border:1px solid #ccc;overflow:auto">' .
				esc_html( implode( "\n", $report ) ) . '</pre></div>';
		}
	);
}
