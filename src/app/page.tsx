import { listPublishedPosts } from "@/lib/posts";
import { getProfile } from "@/lib/profile";
import { realUrl } from "@/lib/slug";
import SocialLinks from "@/components/SocialLinks";
import PostList from "@/components/PostList";

export default async function HomePage() {
  const posts = await listPublishedPosts();
  const profile = await getProfile();

  return (
    <main className="min-h-screen bg-cream px-6 py-10 sm:px-16 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-extrabold text-ink">Blog Dewa</h1>

        <div className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-[1fr_280px]">
          <PostList initialPosts={posts} />

          <aside>
            <h2 className="text-2xl font-bold text-ink">About me</h2>
            <div className="mt-3 border-b border-border" />

            <div className="mt-4 h-14 w-14 overflow-hidden rounded-full bg-border">
              {profile.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={profile.name} className="h-full w-full scale-125 object-cover object-top" />
              )}
            </div>

            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink">{profile.bio}</p>

            <div className="mt-4 border-b border-border" />

            <div className="mt-4">
              <SocialLinks
                links={[
                  { label: "LinkedIn", href: profile.linkedin_url || "#" },
                  { label: "YouTube", href: profile.youtube_url || "#" },
                  { label: "GitHub", href: realUrl(profile.github_url, "https://github.com/awedg17/") },
                  { label: "X", href: profile.x_url || "#" },
                ]}
              />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
