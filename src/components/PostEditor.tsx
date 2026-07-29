"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Post } from "@/lib/posts";
import { markdownToBlocks, blocksToMarkdown } from "@/lib/blocks";
import { timeAgo } from "@/lib/slug";
import BlockEditor from "./BlockEditor";
import UnsavedChangesModal from "./UnsavedChangesModal";
import { LinkIcon, StarIcon, ChevronDownIcon, CheckIcon } from "./icons";

export default function PostEditor({ post }: { post?: Post }) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [blocks, setBlocks] = useState(() => markdownToBlocks(post?.content ?? ""));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [starred, setStarred] = useState(Boolean(post?.pinned));
  const [linkCopied, setLinkCopied] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const initialSnapshot = useRef(
    JSON.stringify({ title: post?.title ?? "", excerpt: post?.excerpt ?? "", content: post?.content ?? "" })
  );
  const isDirty =
    JSON.stringify({ title, excerpt, content: blocksToMarkdown(blocks) }) !== initialSnapshot.current;

  // Warn on tab close / refresh if there are unsaved changes.
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  // Keep a ref in sync so the popstate listener below (attached once) always
  // sees the latest dirty state instead of a stale value from mount time.
  const isDirtyRef = useRef(isDirty);
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // Intercept the browser Back/Forward buttons: push a duplicate history
  // entry up front, then if the user tries to go back while there are
  // unsaved changes, cancel that navigation (push the entry right back) and
  // show the same confirmation modal used for the in-app back button.
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    function onPopState() {
      if (isDirtyRef.current) {
        window.history.pushState(null, "", window.location.href);
        setConfirmLeave(true);
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  async function save(): Promise<number | null> {
    setError("");
    if (!title.trim()) {
      setError("Title is required.");
      return null;
    }
    setSaving(true);
    const content = blocksToMarkdown(blocks);
    const url = post ? `/api/posts/${post.id}` : "/api/posts";
    const method = post ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, excerpt, content }),
    });
    setSaving(false);
    if (res.status === 401) {
      // Session died mid-edit — no point retrying save, and staying here
      // just leaves the "unsaved changes" modal stuck with no way out.
      router.push("/login");
      return null;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not save.");
      return null;
    }
    const data = await res.json();
    return data.post.id as number;
  }

  function goToList() {
    router.push("/admin/posts");
    // Invalidate the client-side router cache so the list page re-fetches
    // from the server and reflects this save (order, titles, status).
    router.refresh();
  }

  async function handleSaveDraft() {
    setMenuOpen(false);
    const id = await save();
    if (id) goToList();
  }

  async function handlePublish() {
    setMenuOpen(false);
    // Always save first — even for existing posts — so title/content edits
    // are persisted before the publish action runs.
    const id = await save();
    if (!id) return;
    await fetch(`/api/posts/${id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish" }),
    });
    goToList();
  }

  async function handleCopyLink() {
    if (!post?.slug) return;
    const url = `${window.location.origin}/post/${post.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch {}
  }

  // Star = pin: pinned posts sort to the top of the article list.
  // Persisted immediately (no save needed) for existing posts.
  async function handleToggleStar() {
    if (!post) return;
    const next = !starred;
    setStarred(next); // optimistic
    const res = await fetch(`/api/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: next }),
    });
    if (!res.ok) setStarred(!next); // roll back on failure
  }

  function handleBack() {
    if (isDirty) {
      setConfirmLeave(true);
    } else {
      goToList();
    }
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto flex max-w-2xl flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-3 sm:px-0">
          <button
            onClick={handleBack}
            className="max-w-xs truncate text-sm text-muted hover:text-olive transition-colors"
          >
            {title.trim() || (post ? "Edit Post" : "New Post")}
          </button>

          <div className="flex items-center gap-3">
            {post && <span className="text-sm text-muted">Edited {timeAgo(post.updated_at)}</span>}

            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                disabled={saving}
                className="flex items-center gap-1 rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-cream hover:bg-[#3A3A3A] transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Publish"}
                <ChevronDownIcon className="h-3.5 w-3.5" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 z-10 mt-1 w-40 rounded-md border border-border bg-white py-1 shadow-lg">
                  <button
                    onClick={handlePublish}
                    className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-[#E7E2D9] transition-colors"
                  >
                    Publish
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-[#E7E2D9] transition-colors"
                  >
                    Save as Draft
                  </button>
                </div>
              )}
            </div>

            {post && (
              <>
                <button
                  onClick={handleCopyLink}
                  aria-label="Copy link"
                  title="Copy public link"
                  className="rounded p-1.5 text-muted hover:bg-[#E7E2D9] hover:text-ink transition-colors"
                >
                  {linkCopied ? <CheckIcon className="h-4 w-4 text-olive" /> : <LinkIcon className="h-4 w-4" />}
                </button>
                <button
                  onClick={handleToggleStar}
                  aria-label="Pin to top"
                  title="Pin article to top of list"
                  className={`rounded p-1.5 transition-colors hover:bg-[#E7E2D9] ${
                    starred ? "text-olive" : "text-muted hover:text-ink"
                  }`}
                >
                  <StarIcon className={`h-4 w-4 ${starred ? "fill-current" : ""}`} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 px-6 pt-8 sm:px-0">
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            placeholder="New page"
            rows={1}
            className="w-full resize-none overflow-hidden bg-transparent text-4xl font-extrabold text-ink outline-none placeholder:text-muted"
          />
          <input
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Add a description..."
            className="w-full bg-transparent text-sm text-muted outline-none placeholder:text-muted"
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="mt-6">
            <BlockEditor blocks={blocks} onChange={setBlocks} />
          </div>
        </div>

        <div className="h-24" />
      </div>

      <UnsavedChangesModal
        open={confirmLeave}
        saving={saving}
        onCancel={() => setConfirmLeave(false)}
        onDiscard={() => {
          setConfirmLeave(false);
          goToList();
        }}
        onSave={async () => {
          const id = await save();
          if (id) {
            setConfirmLeave(false);
            goToList();
          }
        }}
      />
    </main>
  );
}
