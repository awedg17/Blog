"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-css";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-yaml";
import type { Block, BlockType } from "@/lib/blocks";
import { emptyBlock } from "@/lib/blocks";
import { detectLanguage, languageFromFilename, suggestFilename } from "@/lib/detectLanguage";
import { renderInline } from "@/lib/markdown";
import {
  PlusIcon,
  DragHandleIcon,
  HeadingIcon,
  NumberedListIcon,
  CodeBlockIcon,
  ImageBlockIcon,
  VideoBlockIcon,
  CopyIcon,
  CheckIcon,
  PencilIcon,
  LinkIcon,
  CloseIcon,
} from "./icons";

type PrimaryItem =
  | { key: "heading-group"; label: string; icon: JSX.Element; submenu: true }
  | { key: BlockType; label: string; icon: JSX.Element; submenu?: false };

const PRIMARY_ITEMS: PrimaryItem[] = [
  { key: "heading-group", label: "Heading", icon: <HeadingIcon className="h-4 w-4" />, submenu: true },
  { key: "numbered-list", label: "Numbered List", icon: <NumberedListIcon className="h-4 w-4" /> },
  { key: "code", label: "Code", icon: <CodeBlockIcon className="h-4 w-4" /> },
  { key: "image", label: "Image", icon: <ImageBlockIcon className="h-4 w-4" /> },
  { key: "video", label: "Video", icon: <VideoBlockIcon className="h-4 w-4" /> },
];

const HEADING_SUBMENU: { key: BlockType; label: string; prefix: string }[] = [
  { key: "heading1", label: "Heading 1", prefix: "H1" },
  { key: "heading2", label: "Heading 2", prefix: "H2" },
  { key: "heading3", label: "Heading 3", prefix: "H3" },
];

const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  sh: "bash",
  shell: "bash",
  html: "markup",
  yml: "yaml",
  "c++": "cpp",
  "c#": "csharp",
};

function highlightCode(code: string, language: string) {
  const trimmed = language.trim().toLowerCase();
  const key = LANGUAGE_ALIASES[trimmed] || trimmed;
  // No language typed yet, or an unrecognized one — fall back to a generic
  // JS/TS-like grammar instead of showing plain unhighlighted text, since
  // most code snippets on this blog are JS/TS/JSX.
  const grammar = Prism.languages[key] || Prism.languages.tsx || Prism.languages.clike;
  const resolvedName = Prism.languages[key] ? key : "tsx";
  return Prism.highlight(code, grammar, resolvedName);
}

type MenuSelection = { stage: "primary" | "submenu"; primaryIndex: number; submenuIndex: number };

function textSizeClass(type: BlockType): string {
  if (type === "heading1") return "text-3xl font-extrabold text-ink";
  if (type === "heading2") return "text-2xl font-bold text-ink";
  if (type === "heading3") return "text-xl font-bold text-ink";
  return "text-sm text-ink";
}

// ponytail: regex-based HTML->markdown for exactly what execCommand can
// produce here (bold/italic/underline/links + stray <div>/<br> from typing).
// Not a general HTML->markdown converter — good enough for this editor's
// closed set of inline formatting.
function htmlToMarkdownInline(html: string): string {
  let s = html;
  s = s.replace(/<br\s*\/?>/gi, "");
  s = s.replace(/<\/?div>/gi, "");
  s = s.replace(/<a\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, inner: string) => {
    return `[${inner.replace(/<[^>]+>/g, "")}](${href})`;
  });
  // CommonMark won't treat "** text **" as bold (delimiter can't be
  // adjacent to whitespace) — execCommand often includes a trailing/leading
  // space inside the tag, so move it outside the markers before wrapping.
  const wrap = (marker: string) => (_m: string, inner: string) => {
    const lead = inner.match(/^\s*/)![0];
    const trail = inner.match(/\s*$/)![0];
    const core = inner.slice(lead.length, inner.length - trail.length);
    return core ? `${lead}${marker}${core}${marker}${trail}` : inner;
  };
  s = s.replace(/<(?:b|strong)>([\s\S]*?)<\/(?:b|strong)>/gi, wrap("**"));
  s = s.replace(/<(?:i|em)>([\s\S]*?)<\/(?:i|em)>/gi, wrap("*"));
  // Strip every remaining tag except <u>/</u>, which is already our storage format.
  s = s.replace(/<(?!\/?u(?:\s|>))[^>]+>/gi, "");
  s = s.replace(/&nbsp;/gi, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  return s;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Ctrl+K: turn the current selection into a real, visibly-blue, clickable
// link right in the editor — no paste-and-hope, no publish-then-check.
// Pasting a plain URL does NOT auto-link (explicit ask: paste should stay
// plain text until the user deliberately marks it as a link).
function insertLink(el: HTMLDivElement): string {
  const selection = window.getSelection();
  const selectedText = selection && !selection.isCollapsed ? selection.toString().trim() : "";
  // Selection already looks like a pasted URL — use it directly instead of
  // asking the user to retype what they just selected.
  const isUrl = /^https?:\/\/\S+$/i.test(selectedText);
  const url = isUrl ? selectedText : window.prompt("Link URL:");
  if (!url) return el.innerHTML;
  const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const label = selectedText || url;
  const html = `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-700">${escapeHtml(label)}</a>`;
  document.execCommand("insertHTML", false, html);
  return el.innerHTML;
}

/**
 * Rich-text block for paragraph/heading/list text: real bold/italic/underline
 * rendered live via the browser's own contentEditable + execCommand (no raw
 * markdown syntax characters ever shown), instead of inserting them into a
 * plain textarea. Uncontrolled by design — the DOM is the source of truth
 * while typing (avoids cursor jumps), and syncs out to block.text on input.
 */
function RichTextBlock({
  block,
  className,
  placeholder,
  onTextChange,
  onKeyDown,
  onLinkClick,
}: {
  block: Block;
  className: string;
  placeholder?: string;
  onTextChange: (text: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onLinkClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);
  // The text this component itself last wrote into the DOM (via typing or
  // the ref-seed below). If `block.text` ever differs from this on render,
  // the change came from outside — e.g. our undo stack — and the DOM needs
  // to be repainted to match, since this element is otherwise uncontrolled
  // while the user types (to avoid cursor jumps on every keystroke).
  const domTextRef = useRef<string | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el || domTextRef.current === block.text) return;
    el.innerHTML = block.text ? renderInline(block.text) : "";
    domTextRef.current = block.text;
  }, [block.text]);

  return (
    <div
      ref={elRef}
      data-block-id={block.id}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder ?? ""}
      onInput={(e) => {
        const el = e.target as HTMLDivElement;
        const markdownText = htmlToMarkdownInline(el.innerHTML);
        domTextRef.current = markdownText;
        onTextChange(markdownText);
      }}
      onClick={onLinkClick}
      onKeyDown={onKeyDown}
      className={`empty:before:content-[attr(data-placeholder)] empty:before:text-muted outline-none ${className}`}
    />
  );
}

export default function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}) {
  const [slashMenuFor, setSlashMenuFor] = useState<string | null>(null);
  const [selection, setSelection] = useState<MenuSelection>({ stage: "primary", primaryIndex: 0, submenuIndex: 0 });
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [linkPopover, setLinkPopover] = useState<{ link: HTMLAnchorElement; top: number; left: number } | null>(
    null
  );
  const [linkEditing, setLinkEditing] = useState(false);
  const [linkEditValue, setLinkEditValue] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const dragIndex = useRef<number | null>(null);
  // Full undo history for every change to `blocks` (typing, formatting,
  // insert/remove/convert/reorder). We own Ctrl+Z entirely instead of
  // relying on native browser undo, which is shared across every
  // contentEditable on the page and can't be scoped to one block.
  const historyRef = useRef<Block[][]>([]);

  useEffect(() => {
    if (!pendingFocusId) return;
    const direct = document.querySelector<HTMLElement>(`[data-block-id="${pendingFocusId}"]`);
    const inCodeBlock = document.querySelector<HTMLElement>(
      `[data-block-container="${pendingFocusId}"] textarea`
    );
    (direct ?? inCodeBlock)?.focus();
    setPendingFocusId(null);
  }, [pendingFocusId, blocks]);

  // Close the slash menu if the triggering block no longer starts with "/".
  useEffect(() => {
    if (!slashMenuFor) return;
    const block = blocks.find((b) => b.id === slashMenuFor);
    if (!block || !block.text.startsWith("/")) {
      setSlashMenuFor(null);
    }
  }, [blocks, slashMenuFor]);

  // Close the link popover on an outside click or scroll (its position is
  // computed once from the link's rect and would otherwise go stale).
  useEffect(() => {
    if (!linkPopover) return;
    function closeOnOutsideClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setLinkPopover(null);
      }
    }
    function closeOnScroll() {
      setLinkPopover(null);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [linkPopover]);

  function handleLinkClick(e: React.MouseEvent<HTMLDivElement>) {
    const link = (e.target as HTMLElement).closest("a");
    if (!link) return;
    e.preventDefault();
    const rect = link.getBoundingClientRect();
    setLinkPopover({ link: link as HTMLAnchorElement, top: rect.bottom + 6, left: rect.left });
    setLinkEditing(false);
    setLinkCopied(false);
  }

  // The link's own contentEditable ancestor owns the block's text state via
  // its onInput handler — dispatch a real input event there after mutating
  // the <a> directly, so this reuses that existing DOM->markdown->state sync
  // (and undo history) instead of duplicating it.
  function syncLinkContainer(link: HTMLAnchorElement) {
    link.closest("[data-block-id]")?.dispatchEvent(new Event("input", { bubbles: true }));
  }

  async function handleCopyLinkUrl() {
    if (!linkPopover) return;
    try {
      await navigator.clipboard.writeText(linkPopover.link.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch {}
  }

  function startEditLink() {
    if (!linkPopover) return;
    setLinkEditValue(linkPopover.link.getAttribute("href") ?? "");
    setLinkEditing(true);
  }

  function saveEditLink() {
    if (!linkPopover) return;
    const value = linkEditValue.trim();
    if (!value) return;
    const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    linkPopover.link.setAttribute("href", href);
    syncLinkContainer(linkPopover.link);
    setLinkPopover(null);
  }

  function unlinkCurrent() {
    if (!linkPopover) return;
    const link = linkPopover.link;
    link.replaceWith(document.createTextNode(link.textContent ?? ""));
    syncLinkContainer(link);
    setLinkPopover(null);
  }

  function updateBlock(id: string, patch: Partial<Block>) {
    pushHistory();
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function pushHistory() {
    historyRef.current.push(blocks);
  }

  function insertAfter(id: string, type: BlockType = "paragraph") {
    pushHistory();
    const idx = blocks.findIndex((b) => b.id === id);
    const nb = emptyBlock(type);
    const next = [...blocks];
    next.splice(idx + 1, 0, nb);
    onChange(next);
    setPendingFocusId(nb.id);
  }

  function removeBlock(id: string) {
    if (blocks.length === 1) return;
    pushHistory();
    const idx = blocks.findIndex((b) => b.id === id);
    const prev = blocks[idx - 1];
    const next = blocks.filter((b) => b.id !== id);
    onChange(next);
    if (prev) setPendingFocusId(prev.id);
  }

  function openSlashMenu(id: string) {
    setSlashMenuFor(id);
    setSelection({ stage: "primary", primaryIndex: 0, submenuIndex: 0 });
  }

  function closeSlashMenu() {
    setSlashMenuFor(null);
  }

  function convertBlock(id: string, type: BlockType) {
    updateBlock(id, { type, text: "", language: type === "code" ? "" : undefined });
    closeSlashMenu();
    setPendingFocusId(id);
  }

  function handleMenuKeyDown(e: React.KeyboardEvent, block: Block, filteredPrimary: PrimaryItem[]) {
    if (filteredPrimary.length === 0) return;
    const isHeadingHighlighted = filteredPrimary[selection.primaryIndex]?.key === "heading-group";

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (selection.stage === "submenu") {
        setSelection((s) => ({ ...s, submenuIndex: (s.submenuIndex + 1) % HEADING_SUBMENU.length }));
      } else {
        setSelection((s) => ({
          ...s,
          primaryIndex: (s.primaryIndex + 1) % filteredPrimary.length,
        }));
      }
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (selection.stage === "submenu") {
        setSelection((s) => ({
          ...s,
          submenuIndex: (s.submenuIndex - 1 + HEADING_SUBMENU.length) % HEADING_SUBMENU.length,
        }));
      } else {
        setSelection((s) => ({
          ...s,
          primaryIndex: (s.primaryIndex - 1 + filteredPrimary.length) % filteredPrimary.length,
        }));
      }
      return;
    }
    if (e.key === "ArrowRight" && selection.stage === "primary" && isHeadingHighlighted) {
      e.preventDefault();
      setSelection((s) => ({ ...s, stage: "submenu", submenuIndex: 0 }));
      return;
    }
    if (e.key === "ArrowLeft" && selection.stage === "submenu") {
      e.preventDefault();
      setSelection((s) => ({ ...s, stage: "primary" }));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (selection.stage === "submenu") {
        convertBlock(block.id, HEADING_SUBMENU[selection.submenuIndex].key);
      } else if (isHeadingHighlighted) {
        // Enter on the "Heading" group drills into H1/H2/H3 instead of
        // committing immediately, so the user can pick the level with
        // the keyboard alone (arrows + Enter, no mouse required).
        setSelection((s) => ({ ...s, stage: "submenu", submenuIndex: 0 }));
      } else {
        convertBlock(block.id, filteredPrimary[selection.primaryIndex].key as BlockType);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      closeSlashMenu();
    }
  }

  // Ctrl/Cmd+B/I/U/K: let the browser's native contentEditable formatting
  // handle it (toggling, selection edge cases, nesting — all for free),
  // then sync block.text from the DOM it just changed.
  function handleKeyDown(e: React.KeyboardEvent, block: Block, filteredPrimary: PrimaryItem[]) {
    if ((e.ctrlKey || e.metaKey) && block.type !== "image" && block.type !== "video" && block.type !== "code") {
      const key = e.key.toLowerCase();
      if (key === "b" || key === "i" || key === "u") {
        const el = e.currentTarget as HTMLDivElement;
        e.preventDefault();
        document.execCommand(key === "b" ? "bold" : key === "i" ? "italic" : "underline");
        updateBlock(block.id, { text: htmlToMarkdownInline(el.innerHTML) });
        return;
      }
      if (key === "k") {
        e.preventDefault();
        const el = e.currentTarget as HTMLDivElement;
        updateBlock(block.id, { text: htmlToMarkdownInline(insertLink(el)) });
        return;
      }
    }
    if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      // Own undo completely — never defer to the browser. Chromium shares
      // ONE undo manager across every contentEditable on the page, so once
      // focus moves to a different block (e.g. after a block is removed),
      // native Ctrl+Z reverts that OTHER block's earlier typing instead of
      // what the user just did. Always intercept and use our own stack.
      e.preventDefault();
      const prev = historyRef.current.pop();
      if (prev) onChange(prev);
      return;
    }
    if (e.key === "/" && block.text === "" && block.type === "paragraph") {
      setTimeout(() => openSlashMenu(block.id), 0);
      return;
    }
    if (slashMenuFor === block.id) {
      handleMenuKeyDown(e, block, filteredPrimary);
      return;
    }
    if (e.key === "Enter" && block.type !== "code") {
      e.preventDefault();
      insertAfter(block.id, block.type === "numbered-list" ? "numbered-list" : "paragraph");
      return;
    }
    if (e.key === "Backspace" && block.text === "") {
      e.preventDefault();
      if (block.type !== "paragraph") {
        updateBlock(block.id, { type: "paragraph" });
      } else {
        removeBlock(block.id);
      }
      return;
    }
  }

  function listNumber(idx: number): number {
    let n = 1;
    for (let j = idx - 1; j >= 0 && blocks[j].type === "numbered-list"; j -= 1) n += 1;
    return n;
  }

  // Auto-detect language + suggest a filename the moment code is pasted into
  // a fresh block. Never overrides a filename the user already set/typed.
  function handleCodePaste(e: React.ClipboardEvent<HTMLDivElement>, block: Block) {
    if (block.filename) return;
    const pasted = e.clipboardData.getData("text");
    if (!pasted.trim()) return;
    const language = detectLanguage(pasted);
    if (!language) return;
    updateBlock(block.id, { language, filename: suggestFilename(language) });
  }

  // Renaming the filename re-derives the highlighting language from its
  // extension, e.g. typing "script.py" switches highlighting to Python.
  function handleFilenameChange(block: Block, filename: string) {
    const language = languageFromFilename(filename) || block.language;
    updateBlock(block.id, { filename, language });
  }

  async function copyCode(block: Block) {
    try {
      await navigator.clipboard.writeText(block.text);
      setCopiedId(block.id);
      setTimeout(() => setCopiedId((id) => (id === block.id ? null : id)), 1500);
    } catch {
      // Clipboard access denied — silently ignore, button just won't show feedback.
    }
  }

  function handleDrop(idx: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === idx) return;
    pushHistory();
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(idx, 0, moved);
    onChange(next);
  }

  return (
    <div className="flex flex-col">
      {blocks.map((block, idx) => {
        const query = slashMenuFor === block.id ? block.text.slice(1) : "";
        const filteredPrimary = PRIMARY_ITEMS.filter((item) =>
          item.label.toLowerCase().includes(query.toLowerCase())
        );
        const menuOpen = slashMenuFor === block.id && filteredPrimary.length > 0;
        const highlightedKey = menuOpen ? filteredPrimary[selection.primaryIndex]?.key : null;

        return (
          <div
            key={block.id}
            className="group relative flex items-start gap-1"
            // The whole row accepts drops — previously only the tiny handle
            // button did, so most of the screen showed the "no drop" cursor.
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(idx);
            }}
          >
            <div
              className="mt-1 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
              contentEditable={false}
            >
              <button
                type="button"
                onClick={() => insertAfter(block.id)}
                aria-label="Add block below"
                className="rounded p-0.5 text-muted hover:bg-[#E7E2D9] hover:text-ink transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                draggable
                onDragStart={(e) => {
                  dragIndex.current = idx;
                  // Some browsers cancel the drag unless data is set.
                  e.dataTransfer.setData("text/plain", String(idx));
                  e.dataTransfer.effectAllowed = "move";
                }}
                aria-label="Drag to reorder"
                className="cursor-grab rounded p-0.5 text-muted hover:bg-[#E7E2D9] hover:text-ink transition-colors active:cursor-grabbing"
              >
                <DragHandleIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="min-w-0 flex-1 py-1">
              {block.type === "code" ? (
                <div className="overflow-hidden rounded-lg bg-ink">
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
                    <input
                      value={block.filename ?? ""}
                      onChange={(e) => handleFilenameChange(block, e.target.value)}
                      placeholder="filename (auto-detected on paste)"
                      className="min-w-0 flex-1 bg-transparent text-sm text-white/70 outline-none placeholder:text-white/40"
                    />
                    <button
                      type="button"
                      onClick={() => copyCode(block)}
                      aria-label="Copy code"
                      className="shrink-0 rounded p-1 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {copiedId === block.id ? (
                        <CheckIcon className="h-4 w-4 text-green-400" />
                      ) : (
                        <CopyIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div data-block-container={block.id} onPaste={(e) => handleCodePaste(e, block)}>
                    <Editor
                      value={block.text}
                      onValueChange={(code) => updateBlock(block.id, { text: code })}
                      onKeyDown={(e) => handleKeyDown(e, block, filteredPrimary)}
                      highlight={(code) => highlightCode(code, block.language ?? "")}
                      padding={16}
                      textareaId={`code-${block.id}`}
                      placeholder="Write your code"
                      className="code-editor-pre"
                      style={{
                        fontFamily: '"Fira Code", Menlo, Consolas, "Courier New", monospace',
                        fontSize: 13,
                        minHeight: "5rem",
                        color: "#d4d4d4",
                      }}
                    />
                  </div>
                </div>
              ) : block.type === "image" ? (
                <div className="flex flex-col gap-2">
                  <input
                    data-block-id={block.id}
                    value={block.text}
                    onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                    onKeyDown={(e) => handleKeyDown(e, block, filteredPrimary)}
                    placeholder="Paste an image URL"
                    className="w-full rounded-md border border-dashed border-border bg-transparent px-3 py-2 text-sm text-ink outline-none focus:border-olive transition-colors"
                  />
                  {block.text && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={block.text} alt="" className="max-h-64 rounded-md object-cover" />
                  )}
                </div>
              ) : block.type === "video" ? (
                <input
                  data-block-id={block.id}
                  value={block.text}
                  onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, block, filteredPrimary)}
                  placeholder="Paste a video URL"
                  className="w-full rounded-md border border-dashed border-border bg-transparent px-3 py-2 text-sm text-ink outline-none focus:border-olive transition-colors"
                />
              ) : block.type === "numbered-list" ? (
                <div className="flex items-start gap-2">
                  <span className="pt-0.5 text-sm font-medium text-ink">{listNumber(idx)}.</span>
                  <div className="min-w-0 flex-1">
                    <RichTextBlock
                      key={block.type}
                      block={block}
                      placeholder="List item"
                      className="text-sm text-ink"
                      onTextChange={(text) => updateBlock(block.id, { text })}
                      onKeyDown={(e) => handleKeyDown(e, block, filteredPrimary)}
                      onLinkClick={handleLinkClick}
                    />
                  </div>
                </div>
              ) : (
                <RichTextBlock
                  key={block.type}
                  block={block}
                  placeholder={idx === 0 ? "Type '/' for commands" : undefined}
                  className={textSizeClass(block.type)}
                  onTextChange={(text) => updateBlock(block.id, { text })}
                  onKeyDown={(e) => handleKeyDown(e, block, filteredPrimary)}
                  onLinkClick={handleLinkClick}
                />
              )}

              {menuOpen && (
                <div className="relative">
                  <div className="absolute left-0 top-1 z-10 flex gap-2">
                    <div className="w-56 rounded-lg bg-ink py-1.5 shadow-lg">
                      {filteredPrimary.map((item, i) => (
                        <button
                          key={item.key}
                          type="button"
                          onMouseEnter={() => setSelection({ stage: "primary", primaryIndex: i, submenuIndex: 0 })}
                          onClick={() => {
                            if (item.key === "heading-group") {
                              setSelection({ stage: "submenu", primaryIndex: i, submenuIndex: 0 });
                              return;
                            }
                            convertBlock(block.id, item.key as BlockType);
                          }}
                          className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-white transition-colors ${
                            selection.primaryIndex === i ? "bg-white/10" : ""
                          }`}
                        >
                          {item.icon}
                          {item.label}
                        </button>
                      ))}
                    </div>
                    {highlightedKey === "heading-group" && (
                      <div className="w-40 rounded-lg bg-ink py-1.5 shadow-lg">
                        {HEADING_SUBMENU.map((h, i) => (
                          <button
                            key={h.key}
                            type="button"
                            onMouseEnter={() => setSelection((s) => ({ ...s, stage: "submenu", submenuIndex: i }))}
                            onClick={() => convertBlock(block.id, h.key)}
                            className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-white transition-colors ${
                              selection.stage === "submenu" && selection.submenuIndex === i ? "bg-white/10" : ""
                            }`}
                          >
                            <span className="text-xs font-semibold text-white/60">{h.prefix}</span>
                            {h.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {linkPopover && (
        <div
          ref={popoverRef}
          style={{ position: "fixed", top: linkPopover.top, left: linkPopover.left }}
          className="z-20 flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1.5 shadow-lg"
        >
          <LinkIcon className="h-4 w-4 shrink-0 text-muted" />
          {linkEditing ? (
            <input
              autoFocus
              value={linkEditValue}
              onChange={(e) => setLinkEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveEditLink();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setLinkEditing(false);
                }
              }}
              className="w-56 bg-transparent text-sm text-ink outline-none"
            />
          ) : (
            <a
              href={linkPopover.link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="max-w-[220px] truncate text-sm text-blue-600 underline"
            >
              {linkPopover.link.href}
            </a>
          )}
          {!linkEditing && (
            <>
              <button
                type="button"
                onClick={handleCopyLinkUrl}
                aria-label="Copy link"
                className="shrink-0 rounded p-1 text-muted hover:bg-[#E7E2D9] hover:text-ink transition-colors"
              >
                {linkCopied ? <CheckIcon className="h-3.5 w-3.5 text-olive" /> : <CopyIcon className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={startEditLink}
                aria-label="Edit link"
                className="shrink-0 rounded p-1 text-muted hover:bg-[#E7E2D9] hover:text-ink transition-colors"
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={unlinkCurrent}
                aria-label="Remove link"
                className="shrink-0 rounded p-1 text-muted hover:bg-[#E7E2D9] hover:text-danger transition-colors"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
