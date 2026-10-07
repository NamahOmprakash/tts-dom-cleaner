export interface CleanOptions {
  /**
   * Strip elements visually hidden via inline style (display:none, visibility:hidden,
   * opacity:0, font-size:0), `hidden` attribute, or `aria-hidden="true"`.
   * @default true
   */
  removeHidden?: boolean;

  /**
   * Prune immediately consecutive duplicate paragraphs.
   * @default true
   */
  dedupeParagraphs?: boolean;

  /**
   * Custom CSS selectors to prune before text extraction (e.g. ['.watermark', '.ad-box']).
   * @default []
   */
  removeSelectors?: string[];

  /**
   * User-supplied regex patterns; matching text blocks/paragraphs will be dropped.
   * @default []
   */
  removePatterns?: RegExp[];

  /**
   * Opt-in list of HTML tag names to remove (e.g. ['nav', 'footer']).
   * Note: junk tags ('script', 'style', 'noscript', 'template', 'svg', 'iframe', 'canvas')
   * are always removed regardless of this option.
   * @default []
   */
  removeTags?: string[];

  /**
   * Output format: "text" (default) or "html" (cleaned DOM markup).
   * @default "text"
   */
  output?: "text" | "html";

  /**
   * Preserve double newlines between blocks instead of single spaces/newlines.
   * @default true
   */
  preserveLineBreaks?: boolean;

  /**
   * Strip ASCII art divider lines such as ***, ---, ___, === (requires >=3 divider characters).
   * @default true
   */
  stripAsciiDividers?: boolean;
}
