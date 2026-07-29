import { marked } from "marked";
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

export type TocItem = { id: string; text: string; level: number };

const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  typescriptreact: "tsx",
  javascriptreact: "jsx",
  sh: "bash",
  shell: "bash",
  html: "markup",
  yml: "yaml",
  "c++": "cpp",
  "c#": "csharp",
};

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ponytail: curated TLD allow-list, not a full URL grammar. Catches common
// bare domains (youtube.com, github.io) typed without http(s)://, while
// skipping tech names that also contain a dot (Next.js, tailwind.config.js —
// "js"/"json" aren't in the list). marked's own GFM autolink already handles
// explicit http(s):// and www. URLs, so this only needs the leftover case.
// Widen TLDS if a real domain gets missed.
const TLDS = "com|net|org|io|dev|app|co|id|ai|edu|gov|info|tv|me|xyz";
const BARE_DOMAIN_RE = new RegExp(
  `\\b((?:https?:\\/\\/)?(?:www\\.)?[a-z0-9][a-z0-9-]*(?:\\.[a-z0-9-]+)*\\.(?:${TLDS})(?![a-z0-9-])(?:\\/[^\\s<>"')\\]]*)?)`,
  "gi"
);

function linkHtml(url: string): string {
  const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-700">${escapeHtml(url)}</a>`;
}

/** Escapes plain text for HTML output, wrapping any bare domain found in it. */
function autolinkText(raw: string): string {
  let out = "";
  let last = 0;
  BARE_DOMAIN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = BARE_DOMAIN_RE.exec(raw))) {
    out += escapeHtml(raw.slice(last, m.index)) + linkHtml(m[0]);
    last = BARE_DOMAIN_RE.lastIndex;
  }
  return out + escapeHtml(raw.slice(last));
}

/** Shared link + plain-text renderers: blue/target=_blank links, bare-domain autolink. */
function attachLinkRenderers(renderer: InstanceType<typeof marked.Renderer>) {
  renderer.text = (tok: any) => autolinkText(tok.raw ?? tok.text ?? "");
  renderer.link = ({ href, tokens }: any) => {
    const text = tokens.map((t: any) => t.raw ?? t.text ?? "").join("");
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-700">${text}</a>`;
  };
}

// CommonMark won't render "** text **" as bold (delimiter can't be adjacent
// to whitespace) — the block editor used to save bold/italic that way, so
// posts saved before that fix still have the broken spacing on disk. Move
// the whitespace outside the markers before handing the string to marked,
// so both old and new content render correctly.
function normalizeEmphasisSpacing(markdown: string): string {
  const wrap = (marker: string) => (m: string, inner: string) => {
    const lead = inner.match(/^\s*/)![0];
    const trail = inner.match(/\s*$/)![0];
    const core = inner.slice(lead.length, inner.length - trail.length);
    return core ? `${lead}${marker}${core}${marker}${trail}` : m;
  };
  let s = markdown.replace(/\*\*([\s\S]*?)\*\*/g, wrap("**"));
  s = s.replace(/\*([^*]*?)\*/g, wrap("*"));
  return s;
}

/**
 * Renders inline markdown only (bold/italic/underline/links, no headings or
 * code fences) — used for the editor's live formatting preview under each
 * text block.
 */
export function renderInline(markdown: string): string {
  if (!markdown.trim()) return "";
  const renderer = new marked.Renderer();
  attachLinkRenderers(renderer);
  return marked.parseInline(normalizeEmphasisSpacing(markdown), { renderer, async: false }) as string;
}

/**
 * Renders markdown to HTML and extracts a table of contents from H2 headings,
 * matching the "Table of Contents" sidebar shown in the post detail design.
 *
 * Code fences support the editor's `language:filename` info string, rendered
 * as a dark block with a filename header and Prism syntax highlighting.
 */
export function renderPostContent(markdown: string): {
  html: string;
  toc: TocItem[];
} {
  const toc: TocItem[] = [];

  const renderer = new marked.Renderer();
  // Must be a regular function (not arrow) — `this.parser` is only bound on
  // regular methods, and it's what actually renders links/bold/italic inside
  // the heading text. The previous version joined raw token text directly,
  // which skipped inline rendering entirely (links inside H1/H2/H3 stayed
  // as plain unlinked text).
  renderer.heading = function ({ tokens, depth }) {
    const plainText = tokens.map((t: any) => t.raw ?? t.text ?? "").join("");
    const id = slugifyHeading(plainText);
    if (depth === 2) toc.push({ id, text: plainText, level: depth });
    const html = this.parser.parseInline(tokens);
    return `<h${depth} id="${id}">${html}</h${depth}>`;
  };

  attachLinkRenderers(renderer);

  renderer.code = ({ text, lang }) => {
    // Info string may be "language" or "language:filename" (editor format).
    const [rawLang, filename] = (lang ?? "").split(":");
    const key = LANGUAGE_ALIASES[rawLang?.toLowerCase() ?? ""] || rawLang?.toLowerCase() || "";
    const grammar = Prism.languages[key];
    const body = grammar ? Prism.highlight(text, grammar, key) : escapeHtml(text);
    const header = filename
      ? `<div class="code-block-header">${escapeHtml(filename)}</div>`
      : "";
    return `<div class="code-block">${header}<pre><code>${body}</code></pre></div>`;
  };

  marked.setOptions({ renderer });
  const html = marked.parse(normalizeEmphasisSpacing(markdown || ""), { async: false }) as string;

  return { html, toc: [{ id: "introduction", text: "Introduction", level: 2 }, ...toc] };
}
