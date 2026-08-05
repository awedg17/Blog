import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/posts";
import { renderPostContent } from "@/lib/markdown";
import { formatDate } from "@/lib/slug";
import TableOfContents from "@/components/TableOfContents";

// Same reasoning as the homepage: avoid a stale build-time snapshot of a
// post that can be published/edited at any time via the admin UI.
export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post || post.status !== "published") notFound();

  const { html, toc } = renderPostContent(post.content);

  return (
    <main className="min-h-screen bg-cream px-6 py-10 sm:px-16 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-ink hover:text-olive transition-colors">
          ← Home
        </Link>

        <div className="mt-6 grid grid-cols-1 gap-12 md:grid-cols-[1fr_240px]">
          <article>
            <h1 className="text-4xl font-extrabold text-ink">{post.title}</h1>
            <p className="mt-2 text-xs text-muted">Published {formatDate(post.published_at)}</p>

            <div
              id="introduction"
              className="prose-post mt-8 scroll-mt-8"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            <div className="mt-10 border-t border-border pt-6">
              <p className="text-sm font-bold text-ink">Enjoyed this article?</p>
              <Link href="/" className="mt-1 inline-block text-sm font-bold text-ink hover:text-olive transition-colors">
                Explore more posts →
              </Link>
            </div>
          </article>

          <aside className="hidden md:block">
            <TableOfContents items={toc} />
          </aside>
        </div>
      </div>
    </main>
  );
}
