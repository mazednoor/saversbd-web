# SaversBD — Next.js frontend on a WordPress + WooCommerce backend

A production-ready headless setup for **saversbd.com**: WordPress stays the CMS and the store,
Next.js renders the public storefront. No plugins required on WordPress, no API keys needed for
reading data (the Store API is public), and cart/checkout/payments keep running inside WooCommerce.

```
Browser ──▶ Next.js 16 (App Router, ISR) ──▶ WordPress REST API  /wp/v2/*
                                        └─▶ WooCommerce Store API /wc/store/v1/*
                                                     │
Cart / checkout / my-account ────────────────────────┘  (native WooCommerce pages)
```

## What runs where

| Area | Handled by | Notes |
| --- | --- | --- |
| Home, shop, categories, search, product pages | Next.js | Server-rendered, cached with ISR |
| Blog + WordPress pages (FAQ, Contact …) | Next.js | Content authored in WP, rendered here |
| Product data, prices, stock, images | WooCommerce Store API | Public, no auth |
| Cart, checkout, coupons, shipping, COD | WooCommerce | "Add to cart" hands off to WP |
| Customer accounts, orders, emails | WooCommerce | Untouched |
| Payments / gateways | WooCommerce | Untouched |

This is why checkout was left in WordPress: rebuilding the cart and COD flow would mean
re-testing every gateway, shipping rule and tax setting for no customer-visible gain.

## Routes

| Route | Source |
| --- | --- |
| `/` | Purpose-built storefront homepage (hero, departments, deals, best sellers, blog) |
| `/shop` | All 956 products · `?page=`, `?category=slug`, `?q=`, `?orderby=`, `?on_sale=1` |
| `/product/[slug]` | Product detail + JSON-LD Product schema |
| `/product-category/[...slug]` | Category listing (nested paths supported) |
| `/categories` | Taxonomy index |
| `/search?q=` | Product search + matching articles (`noindex`) |
| `/blog`, `/blog/[slug]` | WordPress posts |
| `/[page]` | Any WordPress page (e.g. `/faq`, `/contact`, `/shop-by-department`) |
| `/cart`, `/checkout`, `/my-account` | 308 → WooCommerce |
| `/api/cart/add?id=…&quantity=…` | Adds to the WooCommerce cart, then redirects to it |
| `/api/revalidate` | POST, called by WordPress after saving content |
| `/sitemap.xml`, `/robots.txt` | Generated from products, categories, posts, pages |

## Run it locally

```bash
npm install
cp .env.example .env.local     # then edit if needed
npm run dev                    # http://localhost:3000
```

`npm run build && npm start` for a production build, `npm run typecheck` for types.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `WORDPRESS_URL` | yes | Backend origin, e.g. `https://saversbd.com` (or `https://cms.saversbd.com`) |
| `NEXT_PUBLIC_SITE_URL` | yes | Public origin of this frontend — canonical URLs + sitemap |
| `NEXT_PUBLIC_REVALIDATE` | no | ISR seconds (default `600`) |
| `NEXT_PUBLIC_HERO_IMAGE` | no | Absolute URL for the homepage hero photo |
| `NEXT_PUBLIC_UNOPTIMIZED_IMAGES` | no | Set `1` only if the WP host blocks the image optimizer |
| `REVALIDATE_SECRET` | no | Shared secret for `/api/revalidate` |
| `BUILD_STANDALONE` | no | Set `1` to emit `.next/standalone` for cPanel/PM2/Docker |

## WordPress side

1. **Nothing to install for reading.** `/wp-json/wc/store/v1/products` and `/wp-json/wp/v2/*` already
   respond publicly on saversbd.com (verified). If a security plugin later blocks REST, allow
   `GET` on `/wp-json/` for anonymous users.
2. **Keep permalinks** as they are. Product URLs (`/product/slug/`) and category URLs
   (`/product-category/path/`) are identical on the new frontend, so no redirects are needed for
   the catalogue.
3. **Instant cache refresh** — copy `wordpress/saversbd-headless.php` to
   `wp-content/mu-plugins/` and add to `wp-config.php`:

   ```php
   define('SAVERSBD_FRONTEND_URL', 'https://saversbd.com');
   define('SAVERSBD_REVALIDATE_SECRET', 'the-same-value-as-REVALIDATE_SECRET');
   ```

   Publishing a product/post/page now clears the matching Next.js cache immediately. Without it,
   content refreshes within `NEXT_PUBLIC_REVALIDATE` seconds.
4. **LiteSpeed Cache**: exclude the Store API from *page* caching only if you notice stale stock
   (`/wp-json/wc/store/v1/cart*`). The read-only product endpoints are safe to cache.
5. **Recommended domain layout** (best for SEO):
   - `saversbd.com` → Next.js
   - `cms.saversbd.com` (or `wp.saversbd.com`) → WordPress admin + APIs
   - Set `WORDPRESS_URL=https://cms.saversbd.com`
   - Add `noindex` to the WP theme (`wp_robots` filter) so the backend never competes with the frontend.

   If WordPress must stay on `saversbd.com`, put the frontend on `www.saversbd.com` and 301 the
   apex domain to it, or run Next.js in front of WP with a reverse proxy.

## Deploying

The app is a normal Node 20.9+ server. Three tested paths:

### Vercel (fastest)
Import the repo, set the env vars, deploy. Set `NEXT_PUBLIC_SITE_URL` to the production domain.
No `BUILD_STANDALONE` needed.

### cPanel / shared Node hosting (standalone)
```bash
BUILD_STANDALONE=1 npm ci && BUILD_STANDALONE=1 npm run build
```
1. Upload `package.json`, `.next/`, `public/` to the app directory (e.g. `~/saversbd-web`).
2. In *Setup Node.js App*: application root `saversbd-web`, startup file `.next/standalone/server.js`,
   Node 20+, then **Run NPM install**.
3. Copy `.next/static` → `.next/standalone/.next/static` and `public` → `.next/standalone/public`.
4. Set env vars in the panel (`WORDPRESS_URL`, `NEXT_PUBLIC_SITE_URL`, `PORT` if required).
5. Map the domain/subdomain to the app and restart.

### VPS with PM2 + Nginx
```bash
npm ci
BUILD_STANDALONE=1 npm run build
pm2 start ecosystem.config.js
pm2 save
```
Nginx: `proxy_pass http://127.0.0.1:3000;` with `proxy_set_header Host $host;` and the usual
`X-Forwarded-*` headers, then `certbot --nginx`.

### Docker
```bash
docker build -t saversbd-web .
docker run -d -p 3000:3000 --env-file .env.local saversbd-web
```

## SEO migration checklist

- [ ] Frontend serves the same `/product/…` and `/product-category/…` URLs as WordPress.
- [ ] Old flat post URLs (`/post-slug/`) 308 to `/blog/post-slug/` — already handled in
      `src/app/[...slug]/page.tsx`.
- [ ] `/sitemap.xml` submitted in Google Search Console; keep the old sitemap until URLs are verified.
- [ ] `NEXT_PUBLIC_SITE_URL` matches the live domain (canonical tags + Open Graph depend on it).
- [ ] WordPress backend set to `noindex` if it stays publicly reachable.
- [ ] Product schema (price, currency, availability) is emitted on every product page.
- [ ] Check a handful of top-selling product URLs in the URL Inspection tool after launch.

## Customising

- **Brand colours / fonts** — `src/app/globals.css` (`@theme` block, taken from the live Kadence palette).
- **Header + footer navigation** — `src/lib/site.ts` (`NAV`, `WP` deep links) and the two components.
- **Homepage sections** — `src/app/page.tsx`; each section is a plain server component.
- **Cache lifetime** — `NEXT_PUBLIC_REVALIDATE`, or per-call `revalidate` in `src/lib/wp.ts` / `src/lib/woo.ts`.
- **WordPress content styling** — the `.wp-content` rules in `globals.css` plus Tailwind Typography.

## Known limitations / good next steps

- WooCommerce **reviews** are not shown yet (Store API exposes `review_count`/`average_rating`; the
  review list needs `/wp/v2/comments` + a client component).
- **Filters** cover category, price sort, deals and search. Facets (brand, price range, attributes)
  can be added via Store API `attributes`/`min_price`/`max_price` params already exposed in `lib/woo.ts`.
- **Navigation menus** are built from product categories because `/wp/v2/menus` requires auth.
  For editorial control, expose menus with a small plugin or hard-code them in `src/lib/site.ts`.
- **Page-builder layouts** (Kadence/Elementor rows) render as normal HTML blocks. Pages with heavy
  builder markup look better rebuilt as native Next.js sections.
- **Customers** signing in still happen on WordPress — intentionally out of scope for a
  catalogue-first frontend.
