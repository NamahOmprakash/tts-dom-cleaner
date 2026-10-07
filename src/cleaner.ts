import * as cheerio from "cheerio";
import type { CleanOptions } from "./types.js";
import { removeHiddenElements } from "./removeHidden.js";
import { extractTextBlocks } from "./extractText.js";
import { dedupeParagraphsList, formatTextOutput, sanitizeDomBlocks } from "./dedupe.js";

/**
 * Pre-sanitizes HTML strings by stripping visually hidden elements, inline style hacks,
 * junk tags, scraper artifacts, and duplicate paragraphs.
 *
 * @param html The raw HTML string to clean.
 * @param options Configuration options for cleaning and output formatting.
 * @returns Clean, normalized text or sanitized HTML.
 */
export function cleanHtml(html: string, options: CleanOptions = {}): string {
  if (!html || typeof html !== "string" || !html.trim()) {
    return "";
  }

  const {
    output = "text",
    dedupeParagraphs = true,
    preserveLineBreaks = true,
  } = options;

  const $ = cheerio.load(html);

  // 1. Remove junk tags, opt-in tags, selectors, and hidden elements
  removeHiddenElements($, options);

  // 2. Output mode: HTML
  if (output === "html") {
    sanitizeDomBlocks($, options);

    const isFullDocument =
      html.toLowerCase().includes("<!doctype") || html.toLowerCase().includes("<html");

    if (isFullDocument) {
      return $.html().trim();
    }

    return ($("body").html() ?? "").trim();
  }

  // 3. Output mode: Text
  let blocks = extractTextBlocks($, options);

  if (dedupeParagraphs) {
    blocks = dedupeParagraphsList(blocks);
  }

  return formatTextOutput(blocks, preserveLineBreaks);
}
