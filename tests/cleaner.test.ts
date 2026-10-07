import { describe, it, expect } from "vitest";
import { cleanHtml } from "../src/index.js";

describe("cleanHtml Integration", () => {
  it("Test 1: Prunes elements with display: none, visibility: hidden, font-size: 0, and opacity: 0", () => {
    const html = `
      <p>Visible line one.</p>
      <div style="display: none">Hidden by display: none</div>
      <p style="visibility: hidden">Hidden by visibility: hidden</p>
      <span style="font-size: 0px">Hidden by font-size: 0px</span>
      <span style="opacity: 0.0 !important">Hidden by opacity: 0</span>
      <p>Visible line two.</p>
    `;
    const result = cleanHtml(html);
    expect(result).toBe("Visible line one.\n\nVisible line two.");
  });

  it("Test 2: Ignores script and style content even if text is present", () => {
    const html = `
      <div>
        <script>const secret = "should not be in output"; document.write(secret);</script>
        <p>Actual readable story text.</p>
        <style>body { font-family: sans-serif; } /* css comment */</style>
      </div>
    `;
    const result = cleanHtml(html);
    expect(result).toBe("Actual readable story text.");
    expect(result).not.toContain("secret");
    expect(result).not.toContain("font-family");
  });

  it("Test 3: Handles duplicate consecutive paragraphs correctly", () => {
    const html = `
      <p>Paragraph A</p>
      <p>Paragraph A</p>
      <p>Paragraph B</p>
      <p>Paragraph B</p>
      <p>Paragraph A</p>
    `;
    const result = cleanHtml(html);
    expect(result).toBe("Paragraph A\n\nParagraph B\n\nParagraph A");
  });

  it("Test 4: Honors removeSelectors (.watermark, .ad-box)", () => {
    const html = `
      <p>The dragon soared through the sky.</p>
      <div class="watermark">Read on pirate-novel-site.org</div>
      <div class="ad-box">Buy gold coins now!</div>
      <p>Smoke billowed from its nostrils.</p>
    `;
    const result = cleanHtml(html, {
      removeSelectors: [".watermark", ".ad-box"],
    });
    expect(result).toBe("The dragon soared through the sky.\n\nSmoke billowed from its nostrils.");
  });

  it("Test 5: Gracefully handles empty strings, malformed HTML, and nested tags without throwing", () => {
    expect(cleanHtml("")).toBe("");
    expect(cleanHtml("   \n\t  ")).toBe("");
    expect(cleanHtml(null as unknown as string)).toBe("");
    expect(cleanHtml(undefined as unknown as string)).toBe("");

    // Malformed HTML
    const malformed = "<p>Unclosed paragraph <div>badly nested</p></div><span>Lone span";
    expect(() => cleanHtml(malformed)).not.toThrow();
    expect(cleanHtml(malformed)).toContain("Unclosed paragraph");
    expect(cleanHtml(malformed)).toContain("badly nested");
    expect(cleanHtml(malformed)).toContain("Lone span");
  });

  it("reproduces realistic web novel scenario from Inreader PR", () => {
    const messyChapter = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Chapter 105 - The Dragon's Lair</title>
          <style>.hidden { display: none; } p { margin: 10px; }</style>
        </head>
        <body>
          <header>
            <h1>Chapter 105: The Dragon's Lair</h1>
          </header>
          <div class="novel-content">
            <p>The cold mountain air bit into Arthur's skin as he climbed the jagged rocks.</p>
            <p style="display:none !important">Scraped from BoxNovel - watermarking paragraph</p>
            <p>The cold mountain air bit into Arthur's skin as he climbed the jagged rocks.</p>
            <p>He held the hilt of his sword tightly, feeling the ancient runes pulse with blue warmth.</p>
            <div style="font-size: 0px">anti scraper decoy sentence that ruins TTS</div>
            <p>***</p>
            <p>Inside the cave, two massive amber eyes opened in the darkness.</p>
            <p>Inside the cave, two massive amber eyes opened in the darkness.</p>
            <div class="patreon-notice">Support the translator on Patreon!</div>
            <footer style="opacity: 0">Hidden footer text</footer>
          </div>
        </body>
      </html>
    `;

    const result = cleanHtml(messyChapter, {
      removeSelectors: [".patreon-notice"],
    });

    const expected = [
      "Chapter 105: The Dragon's Lair",
      "The cold mountain air bit into Arthur's skin as he climbed the jagged rocks.",
      "He held the hilt of his sword tightly, feeling the ancient runes pulse with blue warmth.",
      "Inside the cave, two massive amber eyes opened in the darkness.",
    ].join("\n\n");

    expect(result).toBe(expected);
  });

  it("produces clean HTML output when output: 'html' is specified for fragments", () => {
    const html = `
      <div class="chapter">
        <p>First paragraph.</p>
        <p>First paragraph.</p>
        <div style="display: none;">Hidden text</div>
        <p>***</p>
        <p>Second paragraph.</p>
      </div>
    `;

    const cleanedHtml = cleanHtml(html, { output: "html" });
    expect(cleanedHtml).not.toContain("Hidden text");
    expect(cleanedHtml).not.toContain("***");
    expect(cleanedHtml).toContain("<p>First paragraph.</p>");
    expect(cleanedHtml).toContain("<p>Second paragraph.</p>");
    // Verify deduplication in HTML
    const matches = cleanedHtml.match(/First paragraph\./g);
    expect(matches?.length).toBe(1);
  });

  it("produces clean full HTML document when output: 'html' is specified on a full document", () => {
    const fullHtml = `<!DOCTYPE html><html><head><title>Chapter Title</title></head><body><p>Story</p><p>Story</p></body></html>`;
    const result = cleanHtml(fullHtml, { output: "html" });
    expect(result.toLowerCase()).toContain("<!doctype html>");
    expect(result).toContain("<p>Story</p>");
  });

  it("respects preserveLineBreaks: false by joining paragraphs with spaces", () => {
    const html = "<p>First paragraph.</p><p>Second paragraph.</p>";
    const result = cleanHtml(html, { preserveLineBreaks: false });
    expect(result).toBe("First paragraph. Second paragraph.");
  });

  it("respects removeHidden: false by retaining inline-hidden elements", () => {
    const html = "<p>Visible.</p><p style='display: none;'>Kept because removeHidden is false.</p>";
    const result = cleanHtml(html, { removeHidden: false });
    expect(result).toBe("Visible.\n\nKept because removeHidden is false.");
  });
});
