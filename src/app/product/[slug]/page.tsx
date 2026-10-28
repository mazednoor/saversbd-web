import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { SectionHeading } from "@/components/ui";
import {
  absoluteUrl,
  decodeEntities,
  discountPercent,
  excerptFrom,
  formatMoney,
  productPrice,
} from "@/lib/format";
import { categoryHref } from "@/lib/taxonomy";
import { prepareContent } from "@/lib/html";
import { getProductBySlug, getProductVariations, getRelatedProducts } from "@/lib/woo";
import { WP_URL } from "@/lib/site";

export const revalidate = 600;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  const name = decodeEntities(product.name);
  const description = excerptFrom(product.short_description || product.description, 158);
  const image = product.images?.[0]?.src;

  return {
    title: name,
    description,
    alternates: { canonical: absoluteUrl(`/product/${product.slug}`) },
    openGraph: {
      type: "website",
      title: name,
      description,
      url: absoluteUrl(`/product/${product.slug}`),
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, variations] = await Promise.all([
    getRelatedProducts(product),
    product.type === "variable" ? getProductVariations(product.id) : Promise.resolve([]),
  ]);
  const storeProductUrl = new URL(product.permalink);
  const backendProductUrl = new URL(storeProductUrl.pathname + storeProductUrl.search, WP_URL).toString();
  const name = decodeEntities(product.name);
  const description = prepareContent(product.description || product.short_description);
  const shortDescription = prepareContent(product.short_description);
  const price = productPrice(product);
  const discount = discountPercent(product.prices);
  const primaryCategory = product.categories?.[0];
  const isFree = Number(product.prices.price) === 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    image: product.images?.map((image) => image.src),
    description: excerptFrom(product.short_description || product.description, 400),
    sku: product.sku || undefined,
    brand: { "@type": "Brand", name: "SaversBD" },
    offers: {
      "@type": "Offer",
      price: (Number(product.prices.price) / 10 ** product.prices.currency_minor_unit).toFixed(2),
      priceCurrency: product.prices.currency_code,
      availability: product.is_in_stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: absoluteUrl(`/product/${product.slug}`),
    },
  };

  return (
    <div className="container-page py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Breadcrumbs
        items={[
          { label: "Shop", href: "/shop" },
          ...(primaryCategory
            ? [{ label: decodeEntities(primaryCategory.name), href: categoryHref(primaryCategory.slug) }]
            : []),
          { label: name },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} name={name} />

        <div>
          {primaryCategory ? (
            <Link
              href={categoryHref(primaryCategory.slug)}
              className="text-[13px] font-bold uppercase tracking-[0.14em] text-brand hover:underline"
            >
              {decodeEntities(primaryCategory.name)}
            </Link>
          ) : null}

          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink md:text-4xl">{name}</h1>

          {product.sku ? <p className="mt-2 text-xs text-muted">SKU: {product.sku}</p> : null}

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <span className="text-[30px] font-bold leading-none text-ink">{product.type === "variable" ? "From " : ""}{price}</span>
            {discount ? (
              <>
                <span className="text-base text-muted line-through">
                  {formatMoney(product.prices.regular_price, product.prices)}
                </span>
                <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">
                  Save {discount}%
                </span>
              </>
            ) : null}
          </div>

          <p className="mt-2 text-sm text-muted">
            {product.is_in_stock ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-600" />
                In stock — ready to ship
              </span>
            ) : (
              <span className="text-brand">Out of stock</span>
            )}
          </p>

          <div className="mt-6">
            {isFree ? (
              <div className="rounded-2xl border border-line bg-haze p-4">
                <p className="text-sm font-medium text-ink">Price on request</p>
                <p className="mt-1 text-sm text-muted">
                  This item is not sold online right now. Message us and we will confirm availability and price.
                </p>
                <Link href="/contact" className="btn btn-primary mt-3">
                  Ask about this product
                </Link>
              </div>
            ) : (
              <AddToCart
                productId={product.id}
                permalink={backendProductUrl}
                inStock={product.is_in_stock}
                hasOptions={product.has_options}
                priceLabel={price}
                variations={variations}
              />
            )}
          </div>

          {shortDescription ? (
            <div
              className="mt-6 rounded-2xl bg-haze p-4 text-sm leading-relaxed text-muted [&_p]:mb-2 last:[&_p]:mb-0"
              dangerouslySetInnerHTML={{ __html: shortDescription }}
            />
          ) : null}

          <div className="mt-6 divide-y divide-line rounded-2xl border border-line">
            <details className="group px-4 py-3" open>
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink">
                Delivery & payment
                <span className="text-muted transition group-open:rotate-180">▾</span>
              </summary>
              <div className="mt-2 space-y-1 text-sm text-muted">
                <p>Inside Dhaka home delivery: ৳60 · 24–48 hours</p>
                <p>Outside Dhaka courier: ৳130 · 24–48 hours</p>
                <p>Outside Dhaka home delivery: ৳150 · 3–4 days</p>
                <p className="pt-1 text-xs">Cash on delivery available. Additional ৳20 per kg after the first kg.</p>
              </div>
            </details>
            <details className="group px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink">
                Authenticity & returns
                <span className="text-muted transition group-open:rotate-180">▾</span>
              </summary>
              <div className="mt-2 space-y-1 text-sm text-muted">
                <p>Every product is sourced from verified suppliers and checked before dispatch.</p>
                <p>Received a damaged or wrong item? Contact us with your order number and we will resolve it.</p>
              </div>
            </details>
          </div>
        </div>
      </div>

      {description ? (
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-ink">Product details</h2>
          <div
            className="prose prose-sm mt-4 max-w-none product-description text-ink prose-headings:font-display prose-a:text-brand"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </section>
      ) : null}

      {related.length ? (
        <section className="mt-16">
          <SectionHeading title="You may also like" href={primaryCategory ? categoryHref(primaryCategory.slug) : "/shop"} />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
