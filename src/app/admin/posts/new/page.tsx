import { requireSession } from "@/lib/session";
import PostEditor from "@/components/PostEditor";

export default function NewPostPage() {
  requireSession();
  return <PostEditor />;
}
