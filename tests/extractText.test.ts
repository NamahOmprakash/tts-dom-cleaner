import { describe, it, expect } from "vitest";
import * as cheerio from "cheerio";
import { extractTextBlocks, isAsciiDivider, normalizeBlockWhitespace } from "../src/extractText.js";

describe("ASCII divider detection", () => {
  it("matches valid dividers of 3 or more characters", () => {
    expect(isAsciiDivider("***")).toBe(true);
    expect(isAsciiDivider("* * *")).toBe(true);
    expect(isAsciiDivider("---")).toBe(true);
    expect(isAsciiDivider("- - -")).toBe(true);
    expect(isAsciiDivider("___")).toBe(true);
    expect(isAsciiDivider("===")).toBe(true);
    expect(isAsciiDivider("~~~")).toBe(true);
    expect(isAsciiDivider("----------------------------------")).toBe(true);
    expect(isAsciiDivider(" * * * * * ")).toBe(true);
  });

  it("does not match whitespace-only or strings with fewer than 3 divider characters", () => {
    expect(isAsciiDivider("")).toBe(false);
    expect(isAsciiDivider("   ")).toBe(false);
    expect(isAsciiDivider("\t\n  ")).toBe(false);
    expect(isAsciiDivider("*")).toBe(false);
    expect(isAsciiDivider("**")).toBe(false);
    expect(isAsciiDivider("--")).toBe(false);
    expect(isAsciiDivider("Chapter 1: The Beginning")).toBe(false);
    expect(isAsciiDivider("*** With Words ***")).toBe(false);
  });
});

describe("normalizeBlockWhitespace", () => {
  it("collapses intra-line spaces and trims", () => {
    expect(normalizeBlockWhitespace("   Hello    world   ")).toBe("Hello world");
    expect(normalizeBlockWhitespace("Line 1    test\nLine   2   test")).toBe(
      "Line 1 test\nLine 2 test"
    );
  });
});

describe("extractTextBlocks", () => {
  it("translates <br> into line breaks both directly and inside inline elements", () => {
    const html1 = "<p>Line one<br>Line two<br/>Line three</p>";
    const $1 = cheerio.load(html1);
    expect(extractTextBlocks($1)).toEqual(["Line one\nLine two\nLine three"]);

    const html2 = "<p><span>Line one<br>Line two</span></p>";
    const $2 = cheerio.load(html2);
    expect(extractTextBlocks($2)).toEqual(["Line one\nLine two"]);

    const html3 = "<p>Line one<br><br>Line two</p>";
    const $3 = cheerio.load(html3);
    expect(extractTextBlocks($3)).toEqual(["Line one\n\nLine two"]);
  });

  it("does not split paragraphs on inline tags and ignores comments within inline elements", () => {
    const html =
      "<p>This is <b>bold <!-- inline comment --></b>, <i>italic</i>, and <a href='#'>a link</a> in <span>one</span> paragraph.</p>";
    const $ = cheerio.load(html);
    const blocks = extractTextBlocks($);
    expect(blocks).toEqual(["This is bold , italic, and a link in one paragraph."]);
  });

  it("handles mixed containers with bare text and child <p> without duplication or loss", () => {
    const html = "<div>Some bare text<p>A child paragraph</p>More bare text</div>";
    const $ = cheerio.load(html);
    const blocks = extractTextBlocks($);
    expect(blocks).toEqual(["Some bare text", "A child paragraph", "More bare text"]);
  });

  it("handles HTML comments and nested blocks inside inline tags", () => {
    const html = `
      <div>
        <!-- A hidden html comment -->
        <p>Before comment</p>
        <span>
          <p>Block wrapped in span</p>
        </span>
      </div>
    `;
    const $ = cheerio.load(html);
    const blocks = extractTextBlocks($);
    expect(blocks).toEqual(["Before comment", "Block wrapped in span"]);
  });

  it("decodes HTML entities properly", () => {
    const html = "<p>&ldquo;Hello &amp; welcome&rdquo; &mdash; 5 &gt; 3 &amp; &#39;quotes&#39;</p>";
    const $ = cheerio.load(html);
    const blocks = extractTextBlocks($);
    expect(blocks).toEqual(["“Hello & welcome” — 5 > 3 & 'quotes'"]);
  });

  it("strips ASCII art dividers when stripAsciiDividers is true", () => {
    const html = `
      <p>Paragraph before divider.</p>
      <p>***</p>
      <p>Paragraph after divider.</p>
      <div>--------------------</div>
      <p>Final paragraph.</p>
    `;
    const $ = cheerio.load(html);
    const blocks = extractTextBlocks($, { stripAsciiDividers: true });
    expect(blocks).toEqual([
      "Paragraph before divider.",
      "Paragraph after divider.",
      "Final paragraph.",
    ]);
  });

  it("retains ASCII art dividers when stripAsciiDividers is false", () => {
    const html = "<p>Text</p><p>***</p><p>More text</p>";
    const $ = cheerio.load(html);
    const blocks = extractTextBlocks($, { stripAsciiDividers: false });
    expect(blocks).toEqual(["Text", "***", "More text"]);
  });

  it("filters blocks matching removePatterns", () => {
    const html = `
      <p>Chapter 1: The Awakening</p>
      <p>The boy opened his eyes.</p>
      <p>Support the author on Patreon at patreon.com/author</p>
      <p>He looked outside the window.</p>
    `;
    const $ = cheerio.load(html);
    const blocks = extractTextBlocks($, {
      removePatterns: [/patreon\.com/i, /support the author/i],
    });
    expect(blocks).toEqual([
      "Chapter 1: The Awakening",
      "The boy opened his eyes.",
      "He looked outside the window.",
    ]);
  });
});
