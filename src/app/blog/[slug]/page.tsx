import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PostCard } from "@/components/post-card";
import { absoluteUrl, decodeEntities, excerptFrom, formatDate } from "@/lib/format";
import { prepareContent } from "@/lib/html";
import { getPostBySlug, getPosts } from "@/lib/wp";
import { SITE } from "@/lib/site";

export const revalidate = 300;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Article not found" };

  const title = decodeEntities(post.title.rendered);
  const description = excerptFrom(post.excerpt?.rendered || post.content.rendered, 158);
  const image = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/blog/${post.slug}`) },
    openGraph: {
      type: "article",
      title,
      description,
      url: absoluteUrl(`/blog/${post.slug}`),
      publishedTime: post.date,
      modifiedTime: post.modified,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const { posts: latest } = await getPosts({ perPage: 4 });
  const related = latest.filter((item) => item.id !== post.id).slice(0, 3);

  const title = decodeEntities(post.title.rendered);
  const content = prepareContent(post.content.rendered);
  const image = post._embedded?.["wp:featuredmedia"]?.[0];
  const category = post._embedded?.["wp:term"]?.[0]?.[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    datePublished: post.date,
    dateModified: post.modified,
    image: image?.source_url ? [image.source_url] : undefined,
    description: excerptFrom(post.excerpt?.rendered || content, 250),
    publisher: { "@type": "Organization", name: SITE.name },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  };

  return (
    <div className="container-page py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: title }]} />

      <article className="mx-auto mt-6 max-w-3xl">
        <header>
          <div className="flex flex-wrap items-center gap-2 text-[13px] uppercase tracking-wide text-muted">
            {category ? <span className="font-semibold text-brand">{decodeEntities(category.name)}</span> : null}
            <span aria-hidden="true">·</span>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden="true">·</span>
            <span>{Math.max(1, Math.round(content.replace(/<[^>]+>/g, " ").split(/\s+/).length / 220))} min read</span>
          </div>

          <h1 className="mt-3 text-3xl font-bold leading-tight text-ink md:text-[42px]">{title}</h1>
        </header>

        {image?.source_url ? (
          <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-haze">
            <Image
              src={image.source_url}
              alt={image.alt_text || title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        ) : null}

        <div
          className="prose prose-lg mt-8 max-w-none text-ink prose-headings:font-display prose-headings:text-ink prose-a:text-brand prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        <footer className="mt-10 rounded-2xl border border-line bg-haze p-5">
          <p className="text-sm font-semibold text-ink">Need help choosing a product?</p>
          <p className="mt-1 text-sm text-muted">
            Browse the shop or message us and we will recommend something that fits your budget.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/shop" className="btn btn-primary">
              Shop products
            </Link>
            <Link href="/contact" className="btn btn-outline">
              Contact us
            </Link>
          </div>
        </footer>
      </article>

      {related.length ? (
        <section className="mt-16">
          <h2 className="mb-5 text-2xl font-bold text-ink">More from the blog</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {related.map((item) => (
              <PostCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
