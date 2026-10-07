import type { CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";
import type { CleanOptions } from "./types.js";

export const BLOCK_TAGS = new Set([
  "html",
  "body",
  "p",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "blockquote",
  "pre",
  "article",
  "section",
  "header",
  "footer",
  "nav",
  "aside",
  "main",
  "figure",
  "figcaption",
  "table",
  "tr",
  "td",
  "th",
  "dt",
  "dd",
  "dl",
  "ol",
  "ul",
  "address",
]);

/**
 * Regex matching ASCII art divider lines requiring at least 3 divider characters (*, -, _, =, ~).
 * Does not match whitespace-only strings.
 */
export const ASCII_DIVIDER_REGEX = /^\s*(?:[*_\-=~]\s*){3,}$/;

export function isAsciiDivider(text: string): boolean {
  return ASCII_DIVIDER_REGEX.test(text);
}

/**
 * Normalizes intra-paragraph whitespace, collapsing runs of horizontal whitespace
 * into single spaces while preserving explicit line breaks (e.g. from <br>).
 */
export function normalizeBlockWhitespace(text: string): string {
  const lines = text.split("\n");
  const normalizedLines: string[] = [];

  for (const line of lines) {
    const cleaned = line.trim().replace(/[^\S\r\n]+/g, " ");
    if (cleaned.length > 0) {
      normalizedLines.push(cleaned);
    }
  }

  return normalizedLines.join("\n").trim();
}

/**
 * Checks whether a node has any block-level descendant element.
 */
function containsBlockDescendant(node: AnyNode): boolean {
  if (node.type !== "tag") return false;
  const children = (node as unknown as { children?: AnyNode[] }).children || [];
  for (const child of children) {
    if (child.type === "tag") {
      const tagName = (child as unknown as { name?: string }).name?.toLowerCase();
      if ((tagName && BLOCK_TAGS.has(tagName)) || containsBlockDescendant(child)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Recursively extracts inline text from a node and its inline children,
 * translating <br> tags into newline characters.
 */
function extractInlineText(node: AnyNode): string {
  if (node.type === "text") {
    return (node as unknown as { data?: string }).data || "";
  }

  if (node.type === "tag") {
    const tagName = (node as unknown as { name?: string }).name?.toLowerCase();
    if (tagName === "br") {
      return "\n";
    }

    let text = "";
    const children = (node as unknown as { children?: AnyNode[] }).children || [];
    for (const child of children) {
      text += extractInlineText(child);
    }
    return text;
  }

  return "";
}

/**
 * Traverses the DOM tree and collects logical text blocks.
 * Accurately groups inline runs and handles mixed containers (e.g. bare text
 * alongside child <p> elements) without duplication or data loss.
 */
function traverseBlocks(node: AnyNode, blocks: string[]): void {
  const children = (node as unknown as { children?: AnyNode[] }).children || [];
  let inlineBuffer = "";

  const flushInline = () => {
    const trimmed = inlineBuffer.trim();
    if (trimmed.length > 0) {
      blocks.push(trimmed);
    }
    inlineBuffer = "";
  };

  for (const child of children) {
    if (child.type === "comment") {
      continue;
    }

    if (child.type === "text") {
      inlineBuffer += (child as unknown as { data?: string }).data || "";
      continue;
    }

    if (child.type === "tag") {
      const tagName = (child as unknown as { name?: string }).name?.toLowerCase();

      if (tagName === "br") {
        inlineBuffer += "\n";
        continue;
      }

      const isBlock = (tagName && BLOCK_TAGS.has(tagName)) || containsBlockDescendant(child);

      if (isBlock) {
        // Child is a block element: flush preceding inline buffer, then recurse
        flushInline();
        traverseBlocks(child, blocks);
      } else {
        // Child is an inline element: extract into current inline buffer
        inlineBuffer += extractInlineText(child);
      }
    }
  }

  flushInline();
}

/**
 * Extracts raw text blocks from the Cheerio DOM, applies whitespace normalization,
 * divider stripping, and pattern filtering.
 */
export function extractTextBlocks($: CheerioAPI, options: CleanOptions = {}): string[] {
  const { stripAsciiDividers = true, removePatterns = [] } = options;

  const rawBlocks: string[] = [];
  const targetNode = $("body").get(0) || $.root().get(0);
  if (targetNode) {
    traverseBlocks(targetNode, rawBlocks);
  }

  const processedBlocks: string[] = [];

  for (const raw of rawBlocks) {
    const normalized = normalizeBlockWhitespace(raw);
    if (!normalized) continue;

    // Filter out ASCII divider lines
    if (stripAsciiDividers && isAsciiDivider(normalized)) {
      continue;
    }

    // Filter out blocks matching any user-provided regex pattern
    if (removePatterns.length > 0 && removePatterns.some((pattern) => pattern.test(normalized))) {
      continue;
    }

    processedBlocks.push(normalized);
  }

  return processedBlocks;
}
