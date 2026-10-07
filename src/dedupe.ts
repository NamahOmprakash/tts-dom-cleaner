import type { CheerioAPI } from "cheerio";
import type { CleanOptions } from "./types.js";
import { BLOCK_TAGS, isAsciiDivider } from "./extractText.js";

/**
 * Deduplicates immediately consecutive paragraphs with identical normalized content.
 * Preserves non-consecutive duplicates (e.g. repeated dialogue like "No." separated by other lines).
 */
export function dedupeParagraphsList(paragraphs: string[]): string[] {
  const result: string[] = [];
  let lastNormalized = "";

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const normalized = trimmed.replace(/\s+/g, " ");
    if (normalized === lastNormalized) {
      continue;
    }

    result.push(trimmed);
    lastNormalized = normalized;
  }

  return result;
}

/**
 * Formats an array of paragraphs into the final output string based on preserveLineBreaks.
 */
export function formatTextOutput(paragraphs: string[], preserveLineBreaks = true): string {
  if (paragraphs.length === 0) {
    return "";
  }

  return preserveLineBreaks ? paragraphs.join("\n\n") : paragraphs.join(" ");
}

/**
 * Ensures consistent behavior in HTML output mode by removing consecutive duplicate
 * leaf blocks, ASCII dividers, and pattern matches directly from the Cheerio DOM.
 */
export function sanitizeDomBlocks($: CheerioAPI, options: CleanOptions = {}): void {
  const { dedupeParagraphs = true, stripAsciiDividers = true, removePatterns = [] } = options;

  let lastNormalized = "";
  const blockSelectorList = Array.from(BLOCK_TAGS).join(", ");

  $(blockSelectorList).each((_, el) => {
    const $el = $(el);

    // Skip container blocks that have nested block children so we don't accidentally
    // strip parent wrappers containing distinct children
    if ($el.find(blockSelectorList).length > 0) {
      return;
    }

    const text = $el.text().trim();
    if (!text) {
      return;
    }

    const normalized = text.replace(/\s+/g, " ");

    if (stripAsciiDividers && isAsciiDivider(normalized)) {
      $el.remove();
      return;
    }

    if (removePatterns.length > 0 && removePatterns.some((p) => p.test(normalized))) {
      $el.remove();
      return;
    }

    if (dedupeParagraphs) {
      if (normalized === lastNormalized) {
        $el.remove();
        return;
      }
      lastNormalized = normalized;
    }
  });
}
