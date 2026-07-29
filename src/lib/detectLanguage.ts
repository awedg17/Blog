/**
 * Heuristic language detection for pasted code, plus filename <-> language
 * mapping so the code block header can show/derive a real filename
 * (e.g. "App.tsx") instead of a raw Prism grammar key.
 */

const EXTENSION_LANGUAGES: Record<string, string> = {
  tsx: "typescriptreact",
  ts: "typescript",
  jsx: "javascriptreact",
  js: "javascript",
  py: "python",
  json: "json",
  css: "css",
  sh: "bash",
  bash: "bash",
  html: "markup",
  htm: "markup",
  sql: "sql",
  go: "go",
  rs: "rust",
  java: "java",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  hpp: "cpp",
  cs: "csharp",
  yaml: "yaml",
  yml: "yaml",
};

const DEFAULT_FILENAMES: Record<string, string> = {
  typescriptreact: "App.tsx",
  typescript: "index.ts",
  javascriptreact: "App.jsx",
  javascript: "index.js",
  python: "script.py",
  json: "data.json",
  css: "styles.css",
  bash: "script.sh",
  markup: "index.html",
  sql: "query.sql",
  go: "main.go",
  rust: "main.rs",
  java: "Main.java",
  c: "main.c",
  cpp: "main.cpp",
  csharp: "Program.cs",
  yaml: "config.yaml",
};

/** Derive a Prism language key from a filename's extension, e.g. "App.tsx" -> "typescriptreact". */
export function languageFromFilename(filename: string): string {
  const ext = filename.trim().split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_LANGUAGES[ext] ?? "";
}

/** Suggest a default filename for a detected language, e.g. "typescriptreact" -> "App.tsx". */
export function suggestFilename(language: string): string {
  return DEFAULT_FILENAMES[language] ?? "snippet.txt";
}

/**
 * Best-effort language detection from pasted code content. Returns "" when
 * nothing matches confidently, so callers can fall back to existing
 * behavior instead of forcing a wrong guess.
 */
export function detectLanguage(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return "";

  const hasJsxTags = /<[A-Za-z][\w.]*[\s/>][\s\S]*<\/[A-Za-z]/.test(trimmed) || /<>[\s\S]*<\/>/.test(trimmed);
  const hasTsSyntax =
    /interface\s+\w+|type\s+\w+\s*=|:\s*(string|number|boolean|void|any|React\.\w+)\b/.test(trimmed) ||
    /"use client"|"use server"/.test(trimmed);

  if (hasJsxTags) {
    return hasTsSyntax ? "typescriptreact" : "javascriptreact";
  }
  if (/^\s*(import|export)\s.+from\s+["']/.test(trimmed) && hasTsSyntax) {
    return "typescript";
  }
  if (/^\s*(def|class)\s+\w+.*:\s*$/m.test(trimmed) || /^\s*(import|from)\s+\w+/.test(trimmed) || /\bprint\(/.test(trimmed)) {
    return "python";
  }
  if (/^\s*[{[]/.test(trimmed) && /"[\w-]+"\s*:/.test(trimmed)) {
    return "json";
  }
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE\s+TABLE)\b/i.test(trimmed)) {
    return "sql";
  }
  if (/^\s*#!.*\b(bash|sh)\b/.test(trimmed) || /^\s*(sudo|npm|cd|export|echo)\s/m.test(trimmed)) {
    return "bash";
  }
  if (/^\s*<!DOCTYPE html>|<\/?(html|head|body|div)\b/i.test(trimmed)) {
    return "markup";
  }
  if (/^\s*package\s+\w+/m.test(trimmed) && /\bfunc\s+\w+\(/.test(trimmed)) {
    return "go";
  }
  if (/\bfn\s+\w+\(/.test(trimmed) && (/->/.test(trimmed) || /\blet\s+mut\b/.test(trimmed))) {
    return "rust";
  }
  if (/public\s+(class|static)/.test(trimmed) && /System\.out/.test(trimmed)) {
    return "java";
  }
  if (/^\s*(import|export|const|let|var|function)\s/.test(trimmed) || /=>\s*\{/.test(trimmed)) {
    return "javascript";
  }
  return "";
}
