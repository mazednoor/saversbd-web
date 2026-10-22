import Image from "next/image";
import Link from "next/link";
import { decodeEntities, excerptFrom, formatDate } from "@/lib/format";
import { prepareContent } from "@/lib/html";
import type { WPPost } from "@/lib/wp";

function featuredImage(post: WPPost) {
  return post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null;
}

function categoryName(post: WPPost) {
  return post._embedded?.["wp:term"]?.[0]?.[0]?.name ?? null;
}

export function PostCard({ post, priority = false }: { post: WPPost; priority?: boolean }) {
  const image = featuredImage(post);
  const category = categoryName(post);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-[0_14px_40px_-24px_rgba(4,0,55,0.4)]">
      <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-haze">
        {image ? (
          <Image
            src={image}
            alt={decodeEntities(post.title.rendered)}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full items-center justify-center bg-mist font-display text-lg text-muted">
            {decodeEntities(post.title.rendered).slice(0, 24)}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted">
          {category ? <span className="font-semibold text-brand">{category}</span> : null}
          <span aria-hidden="true">·</span>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </div>

        <h3 className="text-lg font-semibold leading-snug text-ink">
          <Link href={`/blog/${post.slug}`} className="hover:text-brand">
            {decodeEntities(post.title.rendered)}
          </Link>
        </h3>

        <p className="text-sm leading-relaxed text-muted">
          {excerptFrom(post.excerpt?.rendered || prepareContent(post.content.rendered), 130)}
        </p>

        <Link href={`/blog/${post.slug}`} className="mt-auto pt-2 text-sm font-semibold text-brand hover:underline">
          Read article →
        </Link>
      </div>
    </article>
  );
}
