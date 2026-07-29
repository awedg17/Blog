export type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "code"
  | "image"
  | "video"
  | "numbered-list";

export type Block = {
  id: string;
  type: BlockType;
  text: string;
  language?: string;
  /** Display filename for code blocks, e.g. "App.tsx". Drives syntax highlighting via its extension. */
  filename?: string;
};

/** First image URL in stored markdown, used as the post's small featured thumbnail. */
export function extractFirstImage(markdown: string): string | null {
  const m = markdown.match(/!\[[^\]]*\]\(([^)]+)\)/);
  return m ? m[1] : null;
}

let counter = 0;
export function newBlockId(): string {
  counter += 1;
  return `b${Date.now()}${counter}`;
}

export function emptyBlock(type: BlockType = "paragraph"): Block {
  return { id: newBlockId(), type, text: "", language: type === "code" ? "" : undefined };
}

/** Parse a markdown string (as stored in the DB) into editable blocks. */
export function markdownToBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    // Fenced code block. Info string is `language` or `language:filename`
    // (filename is our own extension so the editor can round-trip it).
    const fenceMatch = line.match(/^```([\w-]*)(?::(\S+))?\s*$/);
    if (fenceMatch) {
      const language = fenceMatch[1] || "";
      const filename = fenceMatch[2];
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1; // skip closing fence
      blocks.push({ id: newBlockId(), type: "code", text: codeLines.join("\n"), language, filename });
      continue;
    }

    // Headings
    const h3 = line.match(/^###\s+(.*)/);
    const h2 = line.match(/^##\s+(.*)/);
    const h1 = line.match(/^#\s+(.*)/);
    if (h3) {
      blocks.push({ id: newBlockId(), type: "heading3", text: h3[1] });
      i += 1;
      continue;
    }
    if (h2) {
      blocks.push({ id: newBlockId(), type: "heading2", text: h2[1] });
      i += 1;
      continue;
    }
    if (h1) {
      blocks.push({ id: newBlockId(), type: "heading1", text: h1[1] });
      i += 1;
      continue;
    }

    // Numbered list item
    const li = line.match(/^\d+\.\s+(.*)/);
    if (li) {
      blocks.push({ id: newBlockId(), type: "numbered-list", text: li[1] });
      i += 1;
      continue;
    }

    // Image
    const img = line.match(/^!\[[^\]]*\]\(([^)]*)\)/);
    if (img) {
      blocks.push({ id: newBlockId(), type: "image", text: img[1] });
      i += 1;
      continue;
    }

    // Plain paragraph line
    blocks.push({ id: newBlockId(), type: "paragraph", text: line });
    i += 1;
  }

  return blocks.length > 0 ? blocks : [emptyBlock()];
}

/** Serialize editable blocks back into a markdown string for storage/rendering. */
export function blocksToMarkdown(blocks: Block[]): string {
  const lines: string[] = [];

  blocks.forEach((block, idx) => {
    const isListItem = block.type === "numbered-list";
    const prevIsListItem = idx > 0 && blocks[idx - 1].type === "numbered-list";

    // Blank line separator before this block, unless it continues a list group.
    if (idx > 0 && !(isListItem && prevIsListItem)) {
      lines.push("");
    }

    switch (block.type) {
      case "heading1":
        lines.push(`# ${block.text}`);
        break;
      case "heading2":
        lines.push(`## ${block.text}`);
        break;
      case "heading3":
        lines.push(`### ${block.text}`);
        break;
      case "code": {
        const info = block.filename ? `${block.language ?? ""}:${block.filename}` : block.language ?? "";
        lines.push(`\`\`\`${info}`, block.text, `\`\`\``);
        break;
      }
      case "image":
        lines.push(`![](${block.text})`);
        break;
      case "video":
        lines.push(`[video](${block.text})`);
        break;
      case "numbered-list": {
        let n = 1;
        for (let j = idx - 1; j >= 0 && blocks[j].type === "numbered-list"; j -= 1) n += 1;
        lines.push(`${n}. ${block.text}`);
        break;
      }
      default:
        lines.push(block.text);
    }
  });

  return lines.join("\n");
}
