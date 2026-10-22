import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Pagination } from "@/components/pagination";
import { PostCard } from "@/components/post-card";
import { EmptyState } from "@/components/ui";
import { getPosts } from "@/lib/wp";

export const metadata: Metadata = {
  title: "Blog",
  description: "Buying guides, product tips and updates from the SaversBD team.",
};

export const revalidate = 300;

const PER_PAGE = 9;

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { posts, totalPages } = await getPosts({ page, perPage: PER_PAGE });

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Blog" }]} />

      <header className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-ink md:text-4xl">The SaversBD blog</h1>
        <p className="mt-2 text-sm text-muted">
          Practical guides on baby care, skincare and getting the most out of what you buy.
        </p>
      </header>

      <div className="mt-8">
        {posts.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <PostCard key={post.id} post={post} priority={index < 3} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No articles yet"
            message="New guides are on the way. Meanwhile, have a look at the shop."
            actionLabel="Go to shop"
          />
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} basePath="/blog" />
    </div>
  );
}
