import { listPosts } from "@/lib/posts";
import { getProfile } from "@/lib/profile";
import { requireSession } from "@/lib/session";
import { realUrl } from "@/lib/slug";
import AdminPostList from "@/components/AdminPostList";

export default function AdminPostsPage() {
  requireSession();
  const posts = listPosts();
  const profile = getProfile();
  const githubUrl = realUrl(profile.github_url, "https://github.com/awedg17/");
  return <AdminPostList initialPosts={posts} githubUrl={githubUrl} />;
}
