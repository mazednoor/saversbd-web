import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { absoluteUrl, decodeEntities, excerptFrom } from "@/lib/format";
import { prepareContent } from "@/lib/html";
import { getPostBySlug, resolvePageByPath } from "@/lib/wp";
import { WP } from "@/lib/site";

export const revalidate = 600;

type PageProps = { params: Promise<{ slug: string[] }> };

/**
 * Catch-all for WordPress pages (/faq, /contact, /shop-by-department …).
 * Routes defined elsewhere in the app always win, so /shop, /blog and
 * /product stay on the Next.js implementations.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await resolvePageByPath(slug);
  if (!page) return { title: "Page not found" };

  const title = decodeEntities(page.title.rendered);
  const description = excerptFrom(page.content.rendered, 158);

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/${slug.join("/")}`) },
    openGraph: { title, description, url: absoluteUrl(`/${slug.join("/")}`) },
  };
}

export default async function WordPressPage({ params }: PageProps) {
  const { slug } = await params;

  // Transactional pages stay in WooCommerce — send visitors to the real thing
  // instead of rendering an empty page.
  const handOff: Record<string, string> = {
    "my-account": WP.account,
  };
  if (slug.length === 1 && handOff[slug[0]]) {
    permanentRedirect(handOff[slug[0]]);
  }

  const page = await resolvePageByPath(slug);

  // Old WordPress posts live at /post-slug/. Keep those links working by
  // sending them to the new /blog/post-slug route with a permanent redirect.
  if (!page) {
    const post = slug.length === 1 ? await getPostBySlug(slug[0]) : null;
    if (post) permanentRedirect(`/blog/${post.slug}`);
  }

  if (!page) notFound();

  const title = decodeEntities(page.title.rendered);
  const content = prepareContent(page.content.rendered);
  const isBare = content.replace(/<[^>]+>/g, "").trim().length < 40;

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: title }]} />

      <article className="mx-auto mt-4 max-w-3xl">
        <h1 className="text-3xl font-bold leading-tight text-ink md:text-[40px]">{title}</h1>

        {isBare ? (
          <div className="mt-6 rounded-2xl border border-line bg-haze p-5 text-sm text-muted">
            <p>This page is still being moved to the new frontend.</p>
            <a href={page.link} className="mt-2 inline-block font-semibold text-brand hover:underline">
              View it on the original site →
            </a>
          </div>
        ) : (
          <div
            className="prose prose-lg mt-6 max-w-none text-ink prose-headings:font-display prose-a:text-brand"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}

        <div className="mt-10 border-t border-line pt-6 text-sm text-muted">
          <p>
            Can&apos;t find what you need?{" "}
            <a href={WP.shop} className="font-semibold text-brand hover:underline">
              Browse the shop
            </a>{" "}
            or{" "}
            <a href={WP.cart} className="font-semibold text-brand hover:underline">
              open your cart
            </a>
            .
          </p>
        </div>
      </article>
    </div>
  );
}
