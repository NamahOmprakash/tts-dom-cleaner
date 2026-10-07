import { describe, it, expect } from "vitest";
import * as cheerio from "cheerio";
import {
  dedupeParagraphsList,
  formatTextOutput,
  sanitizeDomBlocks,
} from "../src/dedupe.js";

describe("dedupeParagraphsList", () => {
  it("drops immediately consecutive duplicates", () => {
    const input = [
      "The sun was shining brightly.",
      "The sun was shining brightly.",
      "Birds were singing in the trees.",
      "Birds were singing in the trees.",
    ];
    expect(dedupeParagraphsList(input)).toEqual([
      "The sun was shining brightly.",
      "Birds were singing in the trees.",
    ]);
  });

  it("handles whitespace variations when comparing consecutive paragraphs", () => {
    const input = [
      "The sun was shining brightly.",
      "  The sun was   shining brightly.  ",
      "Birds were singing.",
    ];
    expect(dedupeParagraphsList(input)).toEqual([
      "The sun was shining brightly.",
      "Birds were singing.",
    ]);
  });

  it("preserves non-consecutive duplicate paragraphs (like repeated dialogue)", () => {
    const input = [
      "\"No.\"",
      "He shook his head furiously.",
      "\"No.\"",
      "She reached for the door handle.",
      "\"No.\"",
    ];
    expect(dedupeParagraphsList(input)).toEqual([
      "\"No.\"",
      "He shook his head furiously.",
      "\"No.\"",
      "She reached for the door handle.",
      "\"No.\"",
    ]);
  });
});

describe("formatTextOutput", () => {
  it("formats with double newlines when preserveLineBreaks is true", () => {
    const paras = ["Paragraph one.", "Paragraph two."];
    expect(formatTextOutput(paras, true)).toBe("Paragraph one.\n\nParagraph two.");
  });

  it("formats with single space when preserveLineBreaks is false", () => {
    const paras = ["Paragraph one.", "Paragraph two."];
    expect(formatTextOutput(paras, false)).toBe("Paragraph one. Paragraph two.");
  });

  it("returns empty string for empty array", () => {
    expect(formatTextOutput([], true)).toBe("");
  });
});

describe("sanitizeDomBlocks (DOM-level deduplication and cleanup)", () => {
  it("removes consecutive duplicate paragraphs directly from the DOM tree", () => {
    const html = `
      <div>
        <p>First paragraph.</p>
        <p>First paragraph.</p>
        <p>Second paragraph.</p>
        <p>Second paragraph.</p>
      </div>
    `;
    const $ = cheerio.load(html);
    sanitizeDomBlocks($, { dedupeParagraphs: true });
    expect($("p").length).toBe(2);
    expect($("p").eq(0).text()).toBe("First paragraph.");
    expect($("p").eq(1).text()).toBe("Second paragraph.");
  });

  it("skips container blocks containing other block elements and ignores empty blocks", () => {
    const html = `
      <section>
        <div>
          <p></p>
          <p>Inner text</p>
        </div>
      </section>
    `;
    const $ = cheerio.load(html);
    sanitizeDomBlocks($, { dedupeParagraphs: true });
    expect($("p").text().trim()).toBe("Inner text");
  });

  it("removes ASCII dividers directly from the DOM tree", () => {
    const html = `
      <div>
        <p>Story paragraph</p>
        <p>***</p>
        <p>Next paragraph</p>
      </div>
    `;
    const $ = cheerio.load(html);
    sanitizeDomBlocks($, { stripAsciiDividers: true });
    expect($("p").length).toBe(2);
    expect($("body").text()).not.toContain("***");
  });

  it("removes pattern-matched elements from the DOM tree", () => {
    const html = `
      <div>
        <p>Real text</p>
        <p>Scraped from ReadNovelFull.com</p>
      </div>
    `;
    const $ = cheerio.load(html);
    sanitizeDomBlocks($, { removePatterns: [/ReadNovelFull/i] });
    expect($("p").length).toBe(1);
    expect($("p").text()).toBe("Real text");
  });
});
