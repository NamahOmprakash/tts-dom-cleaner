import type { CheerioAPI } from "cheerio";
import type { CleanOptions } from "./types.js";

const DEFAULT_JUNK_TAGS = ["script", "style", "noscript", "template", "svg", "iframe", "canvas"];

/**
 * Evaluates whether an inline CSS style string contains rules that visually hide the element.
 * Tolerates mixed casing, extra spaces, !important flags, and multi-property strings.
 */
export function isStyleHidden(styleStr: string): boolean {
  if (!styleStr || typeof styleStr !== "string") {
    return false;
  }

  const decls = styleStr.split(";");
  for (const decl of decls) {
    const colonIdx = decl.indexOf(":");
    if (colonIdx === -1) continue;

    const prop = decl.slice(0, colonIdx).trim().toLowerCase();
    let val = decl
      .slice(colonIdx + 1)
      .trim()
      .toLowerCase();
    if (!prop || !val) continue;

    val = val.replace(/!important/g, "").trim();

    if (prop === "display" && val === "none") {
      return true;
    }

    if (prop === "visibility" && val === "hidden") {
      return true;
    }

    if (prop === "opacity") {
      const num = Number(val);
      if (val !== "" && !isNaN(num) && num === 0) {
        return true;
      }
    }

    if (prop === "font-size") {
      const numPart = val.replace(/(?:px|rem|em|pt|%|vh|vw)$/, "").trim();
      const num = Number(numPart);
      if (numPart !== "" && !isNaN(num) && num === 0) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Prunes junk tags, opt-in tags, targeted selectors, and hidden elements from the DOM tree.
 */
export function removeHiddenElements($: CheerioAPI, options: CleanOptions = {}): void {
  const { removeHidden = true, removeSelectors = [], removeTags = [] } = options;

  // 1. Always remove non-content/junk elements regardless of removeHidden
  $(DEFAULT_JUNK_TAGS.join(", ")).remove();

  // 2. Opt-in structural/custom tags removal (e.g. ['nav', 'footer'])
  if (removeTags.length > 0) {
    const tagSelector = removeTags
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .join(", ");
    if (tagSelector) {
      $(tagSelector).remove();
    }
  }

  // 3. User-supplied CSS selectors to drop (e.g. ['.watermark', '.ad-box'])
  if (removeSelectors.length > 0) {
    const customSelector = removeSelectors
      .map((s) => s.trim())
      .filter(Boolean)
      .join(", ");
    if (customSelector) {
      $(customSelector).remove();
    }
  }

  // 4. Hidden element pruning (inline styles & a11y attributes)
  if (removeHidden) {
    // HTML hidden attribute
    $("[hidden]").remove();

    // aria-hidden="true" (case-insensitive)
    $("[aria-hidden]").each((_, el) => {
      const ariaHiddenVal = $(el).attr("aria-hidden");
      if (ariaHiddenVal && ariaHiddenVal.trim().toLowerCase() === "true") {
        $(el).remove();
      }
    });

    // Inline style scanning
    $("[style]").each((_, el) => {
      const styleAttr = $(el).attr("style");
      if (styleAttr && isStyleHidden(styleAttr)) {
        $(el).remove();
      }
    });
  }
}
