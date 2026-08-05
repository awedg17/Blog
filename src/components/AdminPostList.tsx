"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/slug";
import HoverActionButton from "./HoverActionButton";
import {
  PencilIcon,
  TrashIcon,
  PublishIcon,
  SearchIcon,
  SortIcon,
  FilterIcon,
  CloseIcon,
  StarIcon,
  GitHubIcon,
} from "./icons";
import DeleteModal from "./DeleteModal";
import PublishModal from "./PublishModal";
import type { Post } from "@/lib/posts";

type SortKey = "recent" | "title";
type FilterKey = "all" | "published" | "draft";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Last edited" },
  { key: "title", label: "Title A–Z" },
];

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Drafts" },
];

export default function AdminPostList({
  initialPosts,
  githubUrl,
}: {
  initialPosts: Post[];
  githubUrl?: string;
}) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [publishTarget, setPublishTarget] = useState<Post | null>(null);
  const [busy, setBusy] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [filterKey, setFilterKey] = useState<FilterKey>("all");
  const [openMenu, setOpenMenu] = useState<"sort" | "filter" | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Server component passes fresh data after router.refresh(); adopt it.
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  // Close dropdowns when clicking anywhere outside the toolbar.
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function openSearch() {
    setSearchOpen(true);
    // Wait for the expand transition to start before focusing.
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  const visiblePosts = useMemo(() => {
    let list = posts;
    if (filterKey !== "all") list = list.filter((p) => p.status === filterKey);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q)
      );
    }
    // Pinned always float to the top regardless of sort choice.
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sortKey === "title") return a.title.localeCompare(b.title);
      return b.updated_at.localeCompare(a.updated_at);
    });
  }, [posts, query, sortKey, filterKey]);

  async function refresh() {
    const res = await fetch("/api/posts");
    if (res.ok) {
      const data = await res.json();
      setPosts(data.posts);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    await fetch(`/api/posts/${deleteTarget.id}`, { method: "DELETE" });
    setBusy(false);
    setDeleteTarget(null);
    refresh();
  }

  async function handlePublish(action: "publish" | "unpublish") {
    if (!publishTarget) return;
    setBusy(true);
    await fetch(`/api/posts/${publishTarget.id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    setPublishTarget(null);
    refresh();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const iconButtonClass =
    "rounded-md border border-transparent p-2 text-ink hover:bg-[#E7E2D9] hover:border-[#E7E2D9] transition-colors";

  return (
    <main className="min-h-screen bg-cream px-6 py-10 sm:px-16 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-extrabold text-ink">Blog Posts</h1>
          <div className="flex items-center gap-3">
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="My GitHub"
                title="My GitHub"
                className="rounded p-1.5 text-muted hover:bg-[#E7E2D9] hover:text-ink transition-colors"
              >
                <GitHubIcon className="h-5 w-5" />
              </a>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-muted hover:text-danger transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <Link
            href="/admin/posts/new"
            className="inline-block shrink-0 rounded-md bg-ink px-4 py-2 text-sm font-medium text-cream hover:bg-[#3A3A3A] transition-colors"
          >
            Create New
          </Link>

          <div ref={toolbarRef} className="flex items-center gap-1">
            {/* Search: icon only when idle; expands into an input when clicked */}
            <div
              className={`flex items-center overflow-hidden rounded-md border transition-all duration-300 ease-out ${
                searchOpen
                  ? "w-52 border-border bg-white sm:w-64"
                  : "w-9 border-transparent"
              }`}
            >
              <button
                type="button"
                onClick={() => (searchOpen ? closeSearch() : openSearch())}
                aria-label="Search articles"
                className={`shrink-0 p-2 text-ink transition-colors ${
                  searchOpen ? "" : "rounded-md hover:bg-[#E7E2D9]"
                }`}
              >
                <SearchIcon className="h-4 w-4" />
              </button>
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && closeSearch()}
                placeholder="Search articles..."
                className={`min-w-0 flex-1 bg-transparent py-2 pr-1 text-sm text-ink outline-none placeholder:text-muted ${
                  searchOpen ? "" : "pointer-events-none"
                }`}
                tabIndex={searchOpen ? 0 : -1}
              />
              {searchOpen && (
                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label="Close search"
                  className="shrink-0 p-2 text-muted hover:text-ink transition-colors"
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort: icon only */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu((m) => (m === "sort" ? null : "sort"))}
                aria-label="Sort"
                title="Sort"
                className={`${iconButtonClass} ${sortKey !== "recent" ? "text-olive" : ""}`}
              >
                <SortIcon className="h-4 w-4" />
              </button>
              {openMenu === "sort" && (
                <div className="absolute right-0 z-10 mt-1 w-36 rounded-md border border-border bg-white py-1 shadow-lg">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setSortKey(opt.key);
                        setOpenMenu(null);
                      }}
                      className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[#E7E2D9] ${
                        sortKey === opt.key ? "font-semibold text-ink" : "text-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter: icon only */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu((m) => (m === "filter" ? null : "filter"))}
                aria-label="Filter"
                title="Filter"
                className={`${iconButtonClass} ${filterKey !== "all" ? "text-olive" : ""}`}
              >
                <FilterIcon className="h-4 w-4" />
              </button>
              {openMenu === "filter" && (
                <div className="absolute right-0 z-10 mt-1 w-36 rounded-md border border-border bg-white py-1 shadow-lg">
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setFilterKey(opt.key);
                        setOpenMenu(null);
                      }}
                      className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[#E7E2D9] ${
                        filterKey === opt.key ? "font-semibold text-ink" : "text-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {visiblePosts.length === 0 ? (
          <div className="mt-10">
            <p className="text-sm text-muted">
              {posts.length === 0 ? "No posts yet." : "No articles match."}
            </p>
          </div>
        ) : (
          <div className="mt-8 flex flex-col">
            {visiblePosts.map((post) => (
              <div key={post.id} className="border-b border-border py-5">
                <h3 className="flex items-center gap-1.5 text-base font-bold text-ink">
                  {Boolean(post.pinned) && (
                    <StarIcon className="h-3.5 w-3.5 shrink-0 fill-current text-olive" />
                  )}
                  {post.title}
                </h3>
                <p className="mt-1 text-xs text-muted" suppressHydrationWarning>
                  {post.status === "published" ? "Published" : "Draft"}
                  {" · Edited "}
                  <span className="text-ink">{timeAgo(post.updated_at)}</span>
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <Link href={`/admin/posts/${post.id}/edit`}>
                    <HoverActionButton icon={<PencilIcon />} label="Edit" />
                  </Link>
                  <HoverActionButton
                    icon={<TrashIcon />}
                    label="Delete"
                    variant="danger"
                    onClick={() => setDeleteTarget(post)}
                  />
                  {post.status === "draft" && (
                    <HoverActionButton
                      icon={<PublishIcon />}
                      label="Publish"
                      onClick={() => setPublishTarget(post)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DeleteModal
        open={!!deleteTarget}
        postTitle={deleteTarget?.title ?? ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={busy}
      />
      <PublishModal
        open={!!publishTarget}
        onCancel={() => setPublishTarget(null)}
        onSaveDraft={() => setPublishTarget(null)}
        onPublish={() => handlePublish("publish")}
        loading={busy}
      />
    </main>
  );
}
