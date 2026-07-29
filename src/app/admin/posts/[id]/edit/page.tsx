import { notFound } from "next/navigation";
import { getPostById } from "@/lib/posts";
import { requireSession } from "@/lib/session";
import PostEditor from "@/components/PostEditor";

export default function EditPostPage({ params }: { params: { id: string } }) {
  requireSession();
  const post = getPostById(Number(params.id));
  if (!post) notFound();
  return <PostEditor post={post} />;
}
