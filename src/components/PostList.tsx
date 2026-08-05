"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { extractFirstImage } from "@/lib/blocks";
import { formatDate } from "@/lib/slug";
import type { Post } from "@/lib/posts";
import { SearchIcon, SortIcon, FilterIcon, CloseIcon, StarIcon } from "./icons";

type SortKey = "recent" | "title";
type FilterKey = "all" | "pinned";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Terbaru" },
  { key: "title", label: "Judul A-Z" },
];

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "pinned", label: "Pinned" },
];

const PAGE_SIZE = 5;

export default function PostList({ initialPosts }: { initialPosts: Post[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [filterKey, setFilterKey] = useState<FilterKey>("all");
  const [page, setPage] = useState(1);

  const [searchOpen, setSearchOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<"sort" | "filter" | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  function openSearch() {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
    setPage(1);
  }

  const visiblePosts = useMemo(() => {
    let list = initialPosts;
    if (filterKey === "pinned") list = list.filter((p) => p.pinned);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q)
      );
    }
    // Pinned always float to the top regardless of sort choice.
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sortKey === "title") return a.title.localeCompare(b.title);
      return new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime();
    });
  }, [initialPosts, query, sortKey, filterKey]);

  const totalPages = Math.max(1, Math.ceil(visiblePosts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedPosts = visiblePosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const iconButtonClass =
    "rounded-md border border-transparent p-2 text-ink hover:bg-[#E7E2D9] hover:border-[#E7E2D9] transition-colors";

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-ink">Articles</h2>

        <div ref={toolbarRef} className="flex items-center gap-1">
          <div
            className={`flex items-center overflow-hidden rounded-md border transition-all duration-300 ease-out ${
              searchOpen ? "w-52 border-border bg-white sm:w-64" : "w-9 border-transparent"
            }`}
          >
            <button
              type="button"
              onClick={() => (searchOpen ? closeSearch() : openSearch())}
              aria-label="Search articles"
              className={`shrink-0 p-2 text-ink transition-colors ${searchOpen ? "" : "rounded-md hover:bg-[#E7E2D9]"}`}
            >
              <SearchIcon className="h-4 w-4" />
            </button>
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              onKeyDown={(e) => e.key === "Escape" && closeSearch()}
              placeholder="Cari judul atau isi artikel..."
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
                      setPage(1);
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
                      setPage(1);
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
        <p className="mt-4 text-sm text-muted">
          {initialPosts.length === 0 ? "No article published yet." : "No articles match."}
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-5">
            {paginatedPosts.map((post) => {
              const thumb = extractFirstImage(post.content);
              return (
                <Link key={post.id} href={`/post/${post.slug}`} className="group flex items-start gap-4">
                  {thumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="h-24 w-24 shrink-0 rounded-lg object-cover sm:h-28 sm:w-28" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-muted">{formatDate(post.published_at)}</p>
                    <h3 className="flex items-center gap-1.5 text-base font-bold text-ink group-hover:text-olive transition-colors">
                      {Boolean(post.pinned) && (
                        <StarIcon className="h-3.5 w-3.5 shrink-0 fill-current text-olive" />
                      )}
                      {post.title}
                    </h3>
                    {post.excerpt.trim() && (
                      <p className="mt-0.5 text-sm text-muted line-clamp-2">{post.excerpt}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                    p === currentPage ? "bg-ink text-cream" : "text-ink hover:bg-[#E7E2D9]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
