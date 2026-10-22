import Link from "next/link";
import { SITE, WP } from "@/lib/site";
import { decodeEntities } from "@/lib/format";
import { getTopCategories } from "@/lib/woo";

export async function SiteFooter() {
  const categories = await getTopCategories(6);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-line bg-haze">
      <div className="container-page grid grid-cols-2 gap-8 py-10 pb-24 md:gap-10 md:py-12 lg:grid-cols-4">
        <div className="col-span-2 lg:col-span-1">
          <Link href="/" className="font-display text-2xl font-bold text-ink">
            Savers<span className="text-brand">BD</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">{SITE.tagline}</p>
          <p className="mt-4 text-sm text-muted">
            Cash on delivery available across Bangladesh. Delivery inside Dhaka in 24–48 hours.
          </p>
        </div>

        <div>
          <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-ink">Shop</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>
              <Link href="/shop" className="hover:text-brand">
                All products
              </Link>
            </li>
            <li>
              <Link href="/shop?on_sale=1" className="hover:text-brand">
                Deals & offers
              </Link>
            </li>
            <li>
              <Link href="/categories" className="hover:text-brand">
                All categories
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={`/product-category/${category.slug}`} className="hover:text-brand">
                  {decodeEntities(category.name)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-ink">Help</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>
              <Link href="/faq" className="hover:text-brand">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-brand">
                Contact us
              </Link>
            </li>
            <li>
              <a href={WP.account} className="hover:text-brand">
                My account
              </a>
            </li>
            <li>
              <a href={WP.cart} className="hover:text-brand">
                Cart
              </a>
            </li>
            <li>
              <a href={WP.checkout} className="hover:text-brand">
                Checkout
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-ink">Order support</h2>
          <p className="mt-4 text-sm text-muted">
            Questions about an order, delivery or a product? Our team replies during business hours.
          </p>
          <Link href="/contact" className="btn btn-primary mt-4">
            Contact us
          </Link>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.name}. All rights reserved.
          </p>
          <p>
            Store powered by WordPress + WooCommerce · Frontend by Next.js
          </p>
        </div>
      </div>
    </footer>
  );
}
