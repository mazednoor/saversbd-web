# SaversBD — Next.js frontend on a WordPress + WooCommerce backend

WordPress remains the CMS and order system for **saversbd.com**. Next.js renders
the storefront, cart and guest checkout. The frontend server connects to the
public WooCommerce Store API; API keys and a custom WordPress plugin are not required.
Customers place cash-on-delivery orders on the frontend while WooCommerce calculates
prices, discounts, stock, delivery rates and taxes.

## What runs where

| Area | Handled by | Notes |
| --- | --- | --- |
| Home, shop, categories, search, product pages | Next.js | Server-rendered, cached with ISR |
| Blog + WordPress pages (FAQ, Contact …) | Next.js | Content authored in WP, rendered here |
| Product data, prices, stock, images | WooCommerce Store API | Public, no auth |
| Cart, checkout, coupons, shipping, COD | Next.js UI + WooCommerce Store API | Customer stays on saversbd.com |
| Order creation, stock changes, emails | WooCommerce | Existing WooCommerce rules and notifications |
| Customer accounts | WordPress | Separate native account page; checkout is guest checkout |
| Online payment gateways | WordPress | Not exposed by this COD-only frontend integration |

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
| `/cart`, `/checkout` | Next.js cart and guest COD checkout |
| `/order-confirmation` | Last order from this browser's encrypted receipt |
| `/my-account` | Redirects to WordPress account management |
| `/api/commerce/cart` | Private GET cart / same-origin POST cart actions |
| `/api/commerce/checkout` | Private order status / prepare / submit |
| `/api/cart/add?id=…&quantity=…` | Legacy links redirect to cart without mutating it |
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
| `COMMERCE_SESSION_SECRET` | yes for shopping | Stable random server-only secret of at least 32 characters; encrypts session and receipt cookies |
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
4. **Category tree cleanup** (optional but recommended) — the WooCommerce taxonomy shipped with
   ~299 terms, 174 of them empty, plus ~32 near-duplicate categories (*Creams/Cream*,
   *Hair Care/Hair care*, *Face Wash/Facewash*…). Two MU plugins fix that:
   - `wordpress/saversbd-category-cleanup.php` — merges duplicates, fixes typos, deletes empty
     categories. `wp saversbd cleanup categories --dry-run` first, then `--apply`.
   - `wordpress/saversbd-category-reorganiser.php` — re-parents everything into the same
     7-department structure the storefront uses. `wp saversbd categories reorganise --apply`.

   Both are safe by default (dry run) and never delete products — they move them.
   Old category URLs keep working: the frontend 308-redirects merged slugs to their new home
   (`src/lib/category-aliases.ts`).
5. **LiteSpeed Cache**: never page-cache `/wp-json/wc/store/v1/cart*`,
   `/wp-json/wc/store/v1/checkout*` or `/wp-json/wc/store/v1/order/*`.
   Read-only product endpoints can be cached with an appropriate stock refresh policy.
6. **Recommended domain layout**:
   - `saversbd.com` → Next.js
   - `cms.saversbd.com` (or `wp.saversbd.com`) → WordPress admin + APIs
   - Set `WORDPRESS_URL=https://cms.saversbd.com`
   - Add `noindex` to the WP theme (`wp_robots` filter) so the backend never competes with the frontend.

   If WordPress must stay on `saversbd.com`, put the frontend on `www.saversbd.com` and 301 the
   apex domain to it, or run Next.js in front of WP with a reverse proxy.

## Deploying

### Cart and checkout requirements

- Set `WORDPRESS_URL=https://cms.saversbd.com` and
  `NEXT_PUBLIC_SITE_URL=https://saversbd.com` at build time **and** runtime.
- Generate `COMMERCE_SESSION_SECRET` with `openssl rand -hex 32` and set it only
  in the Node service environment. Keep it stable across releases. Rotating it
  expires frontend carts and receipts. Do not commit it or prefix it with `NEXT_PUBLIC_`.
- The runtime must reach the Store API with `Cart-Token` headers on GET and POST.
  Do not disable WooCommerce nonce validation: cart tokens are the supported
  headless authentication method. No admin password is needed.
- The guest checkout currently serves Bangladesh and COD. Configure WooCommerce
  shipping zones, methods and COD eligibility there. Never hardcode delivery fees
  in the frontend. Unknown gateway integrations and custom checkout extensions
  need their own implementation and tests before being enabled.
- Variable products with explicit published attribute combinations are supported.
  If options cannot be loaded or represented safely (for example wildcard
  variations), purchasing is blocked with a retry/contact message. Do not create
  an arbitrary variation or silently redirect into a different cart session.
- Frontend carts use an encrypted HttpOnly host-only cookie. Existing native CMS
  carts and WordPress logins are not automatically imported into this guest session.
- The service serializes mutations per cart within one Node process. This matches
  the current single-process VPS deployment; use a distributed lock before scaling
  commerce across processes/replicas. Prepared WooCommerce order IDs and receipts
  also protect against submitting the same completed order after a lost response.
- Private APIs return `Cache-Control: private, no-store`. Keep Cloudflare and any
  reverse proxy from overriding this for `/api/commerce/*`. Never log Cart-Token,
  session/receipt cookies, billing emails or order keys.
- Keep a rollback copy of the currently serving build and systemd unit. Install,
  build, copy static assets and set cache permissions in a separate release folder;
  test on a localhost port before switching the service path.

### Verify shopping

`npm run test:commerce` starts a local WooCommerce fixture and Next.js development
server. It tests two-customer session isolation, encrypted cookies, CSRF rejection,
variation attributes, quantity/coupon/shipping updates, total confirmation,
order receipts, duplicate submissions, and a lost order response. It never creates
a real order or sends email. `COMMERCE_TEST_PORT` overrides the test port (3215).
To test an existing production build, set `COMMERCE_TEST_PRODUCTION=1` and set
`COMMERCE_TEST_ORIGIN` to the `NEXT_PUBLIC_SITE_URL` used for that build.

After deploying, use an incognito browser on desktop and mobile to add a simple
and variable product, refresh the cart, change quantity, remove an item, apply a
valid/invalid coupon, update a Bangladesh address, select a delivery method, and
verify the total. Finally place **one deliberately marked test COD order** and
confirm it in WooCommerce before opening the new checkout to customers. Verify
that refreshing the confirmation page or double-clicking does not create another
order. Confirm delivery rules, plugin checkout-field requirements and stock
changes with the real WordPress installation. Do not use a real payment gateway
for this acceptance test.

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
