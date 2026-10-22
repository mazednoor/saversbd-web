import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/ui";
import { decodeEntities } from "@/lib/format";
import { getCategories, getCategoriesWithImages, getProducts, getTopCategories } from "@/lib/woo";
import { WP, WP_URL } from "@/lib/site";

export const revalidate = 600;

const HERO_IMAGE =
  process.env.NEXT_PUBLIC_HERO_IMAGE ?? `${WP_URL}/wp-content/uploads/2025/01/slider-1-scaled.webp`;

export default async function HomePage() {
  const [{ products: popular, total }, { products: saleProducts }, categoryTiles, categories, menuCategories] =
    await Promise.all([
      getProducts({ perPage: 24, orderby: "popularity" }),
      getProducts({ perPage: 12, onSale: true, orderby: "popularity" }),
      getCategoriesWithImages(8),
      getCategories(),
      getTopCategories(10),
    ]);

  // A handful of catalogue entries are "contact for price" — keep the
  // storefront sections shoppable and let the shop page show everything.
  const priced = (list: typeof popular) => list.filter((product) => Number(product.prices.price) > 0);
  const bestSellers = priced(popular).slice(0, 8);
  const deals = priced(saleProducts).slice(0, 4);

  // One product row per department listed in the main menu.
  const categorySections = await Promise.all(
    menuCategories.map(async (category) => {
      const { products } = await getProducts({
        category: category.id,
        perPage: 8,
        orderby: "popularity",
      });
      return { category, products: priced(products).slice(0, 8) };
    }),
  );

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute -right-32 -top-40 size-[32rem] rounded-full bg-brand/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 size-[28rem] rounded-full bg-royal/25 blur-3xl" />

        <div className="container-page relative grid items-center gap-10 py-14 md:py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
              <span className="size-1.5 rounded-full bg-brand" />
              Authentic products · Bangladesh
            </p>

            <h1 className="mt-5 max-w-xl text-4xl font-bold leading-[1.08] text-white sm:text-5xl lg:text-[56px]">
              Everyday essentials,{" "}
              <span className="text-brand-soft underline decoration-brand/70 decoration-4 underline-offset-8">
                honest prices
              </span>
              .
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75">
              Baby care, skincare, toys and household products — imported and verified, delivered anywhere in
              Bangladesh with cash on delivery.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-primary h-12 px-7 text-base">
                Shop all products
              </Link>
              <Link
                href="/shop?on_sale=1"
                className="btn h-12 border border-white/25 px-6 text-base text-white hover:bg-white/10"
              >
                Today&apos;s deals
              </Link>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-white/50">Products</dt>
                <dd className="mt-1 text-xl font-bold">{total.toLocaleString("en-US")}+</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-white/50">Categories</dt>
                <dd className="mt-1 text-xl font-bold">{categories.length}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-white/50">Dhaka delivery</dt>
                <dd className="mt-1 text-xl font-bold">24–48h</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              <Image
                src={HERO_IMAGE}
                alt="SaversBD featured collection"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-ink shadow-xl">
              <span className="grid size-9 place-items-center rounded-full bg-brand-soft text-brand">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 7h13v9H3zM16 10h3l2 3v3h-5" strokeLinejoin="round" />
                  <circle cx="7" cy="18" r="1.6" />
                  <circle cx="18" cy="18" r="1.6" />
                </svg>
              </span>
              <div>
                <p className="text-xs font-bold">Cash on delivery</p>
                <p className="text-[11px] text-muted">Pay when your order arrives</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-line bg-white">
        <div className="container-page grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {[
            { title: "100% authentic", body: "Sourced from verified suppliers" },
            { title: "Cash on delivery", body: "Available across Bangladesh" },
            { title: "Fast dispatch", body: "Inside Dhaka in 24–48 hours" },
            { title: "Real support", body: "Help with orders and products" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="text-xs text-muted">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="container-page">
          <SectionHeading
            eyebrow="Shop by department"
            title="Find what your family needs"
            href="/categories"
            linkLabel="All categories"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categoryTiles.map((category, index) => (
              <Link
                key={category.id}
                href={`/product-category/${category.slug}`}
                className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-line bg-white p-3 transition hover:border-ink/20 hover:shadow-[0_14px_40px_-28px_rgba(4,0,55,0.5)]"
              >
                <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-haze">
                  {category.productImage ? (
                    <Image
                      src={category.productImage}
                      alt=""
                      fill
                      sizes="64px"
                      priority={index < 4}
                      className="object-contain p-1.5 transition duration-300 group-hover:scale-105"
                    />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 block text-sm font-semibold leading-snug text-ink">
                    {decodeEntities(category.name)}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">{category.count} products</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Deals */}
      {deals.length ? (
        <section className="section bg-haze">
          <div className="container-page">
            <SectionHeading eyebrow="Limited prices" title="Deals worth checking today" href="/shop?on_sale=1" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {deals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Best sellers */}
      <section className="section">
        <div className="container-page">
          <SectionHeading eyebrow="Most loved" title="Best sellers" href="/shop?orderby=popularity" linkLabel="Shop best sellers" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {bestSellers.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>
        </div>
      </section>

      {/* One product row per main-menu category */}
      {categorySections.map(
        ({ category, products }, index) =>
          products.length > 0 && (
            <section key={category.id} className={`section ${index % 2 === 0 ? "bg-haze" : ""}`}>
              <div className="container-page">
                <SectionHeading
                  title={decodeEntities(category.name)}
                  href={`/product-category/${category.slug}`}
                  linkLabel={`View all ${category.count} products`}
                />
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            </section>
          ),
      )}

      {/* Hand-off CTA */}
      <section className="section">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-12 text-center text-white md:px-12">
            <div className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-brand/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 size-72 rounded-full bg-royal/30 blur-3xl" />
            <h2 className="relative text-3xl font-bold md:text-4xl">Ready to order?</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-sm text-white/75">
              Browse the full catalogue here, then check out securely on saversbd.com — same products, same
              cash-on-delivery terms.
            </p>
            <div className="relative mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/shop" className="btn btn-primary h-12 px-7">
                Start shopping
              </Link>
              <a href={WP.shop} className="btn h-12 border border-white/25 px-6 text-white hover:bg-white/10">
                Open the original store
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
