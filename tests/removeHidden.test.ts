import { describe, it, expect } from "vitest";
import * as cheerio from "cheerio";
import { isStyleHidden, removeHiddenElements } from "../src/removeHidden.js";

describe("isStyleHidden", () => {
  it("detects display: none with casing and whitespace variations", () => {
    expect(isStyleHidden("display:none")).toBe(true);
    expect(isStyleHidden("display: none")).toBe(true);
    expect(isStyleHidden("DISPLAY: NONE")).toBe(true);
    expect(isStyleHidden("display : none !important")).toBe(true);
    expect(isStyleHidden("  display:   none  !IMPORTANT ; ")).toBe(true);
  });

  it("detects visibility: hidden", () => {
    expect(isStyleHidden("visibility:hidden")).toBe(true);
    expect(isStyleHidden("VISIBILITY: HIDDEN !important")).toBe(true);
  });

  it("detects opacity: 0 and its variations", () => {
    expect(isStyleHidden("opacity: 0")).toBe(true);
    expect(isStyleHidden("opacity: 0.0")).toBe(true);
    expect(isStyleHidden("opacity: .0")).toBe(true);
    expect(isStyleHidden("opacity:0!important")).toBe(true);
    expect(isStyleHidden("opacity: 0.5")).toBe(false);
    expect(isStyleHidden("opacity: 1")).toBe(false);
    expect(isStyleHidden("opacity: invalid")).toBe(false);
  });

  it("detects font-size: 0 and its unit variations", () => {
    expect(isStyleHidden("font-size: 0")).toBe(true);
    expect(isStyleHidden("font-size: 0px")).toBe(true);
    expect(isStyleHidden("font-size: 0rem")).toBe(true);
    expect(isStyleHidden("font-size: 0em")).toBe(true);
    expect(isStyleHidden("font-size: 0pt")).toBe(true);
    expect(isStyleHidden("font-size: 0%")).toBe(true);
    expect(isStyleHidden("font-size: 0.0rem !important")).toBe(true);
    expect(isStyleHidden("font-size: 14px")).toBe(false);
    expect(isStyleHidden("font-size: 1rem")).toBe(false);
    expect(isStyleHidden("font-size: auto")).toBe(false);
  });

  it("detects hiding in multi-property style strings and handles malformed declarations", () => {
    expect(isStyleHidden("color: red; display: none; margin: 0;")).toBe(true);
    expect(isStyleHidden("padding: 10px; opacity: 0.0 !important; background: blue;")).toBe(true);
    expect(isStyleHidden("margin: 5px; font-size: 0rem; color: #fff;")).toBe(true);
    expect(isStyleHidden("color: red; margin: 0; padding: 10px;")).toBe(false);
    // Declarations without colons or trailing semicolons
    expect(isStyleHidden("color: red; ; invalid-declaration ;")).toBe(false);
    expect(isStyleHidden(":")).toBe(false);
  });

  it("returns false for empty or non-string inputs", () => {
    expect(isStyleHidden("")).toBe(false);
    expect(isStyleHidden("   ")).toBe(false);
    expect(isStyleHidden(null as unknown as string)).toBe(false);
    expect(isStyleHidden(undefined as unknown as string)).toBe(false);
  });
});

describe("removeHiddenElements", () => {
  it("always removes junk tags regardless of removeHidden setting", () => {
    const html = `
      <div>
        <p>Real content</p>
        <script>console.log('ad');</script>
        <style>.test { color: red; }</style>
        <noscript>Enable JS</noscript>
        <template><span>Template content</span></template>
        <svg><text>SVG Text</text></svg>
        <iframe src="https://example.com"></iframe>
        <canvas>Canvas content</canvas>
      </div>
    `;

    // Test with removeHidden: false
    const $1 = cheerio.load(html);
    removeHiddenElements($1, { removeHidden: false });
    expect($1("script").length).toBe(0);
    expect($1("style").length).toBe(0);
    expect($1("noscript").length).toBe(0);
    expect($1("template").length).toBe(0);
    expect($1("svg").length).toBe(0);
    expect($1("iframe").length).toBe(0);
    expect($1("canvas").length).toBe(0);
    expect($1("p").text()).toBe("Real content");

    // Test with removeHidden: true
    const $2 = cheerio.load(html);
    removeHiddenElements($2, { removeHidden: true });
    expect($2("script").length).toBe(0);
    expect($2("p").text()).toBe("Real content");
  });

  it("preserves header, footer, and nav by default", () => {
    const html = `
      <header><h1>Chapter Title</h1></header>
      <nav><a href="/ch1">Ch 1</a></nav>
      <article><p>Story paragraph</p></article>
      <footer><span>Footnote</span></footer>
    `;

    const $ = cheerio.load(html);
    removeHiddenElements($);
    expect($("header").length).toBe(1);
    expect($("nav").length).toBe(1);
    expect($("footer").length).toBe(1);
    expect($("h1").text()).toBe("Chapter Title");
  });

  it("removes structural tags when opt-in removeTags is specified", () => {
    const html = `
      <header><h1>Chapter Title</h1></header>
      <nav><a href="/ch1">Ch 1</a></nav>
      <article><p>Story paragraph</p></article>
      <footer><span>Footnote</span></footer>
    `;

    const $ = cheerio.load(html);
    removeHiddenElements($, { removeTags: ["nav", "footer"] });
    expect($("header").length).toBe(1);
    expect($("nav").length).toBe(0);
    expect($("footer").length).toBe(0);
  });

  it("removes elements matching removeSelectors", () => {
    const html = `
      <div>
        <p>Legitimate text</p>
        <div class="watermark">Scraped by novelhub</div>
        <p class="ad-banner">Click here for free coins</p>
      </div>
    `;

    const $ = cheerio.load(html);
    removeHiddenElements($, { removeSelectors: [".watermark", ".ad-banner"] });
    expect($(".watermark").length).toBe(0);
    expect($(".ad-banner").length).toBe(0);
    expect($("p").text()).toBe("Legitimate text");
  });

  it("prunes elements with hidden attribute and aria-hidden='true'", () => {
    const html = `
      <div>
        <p>Visible</p>
        <p hidden>Secret text</p>
        <span aria-hidden="true">Screen reader ignore</span>
        <span aria-hidden="TRUE">Screen reader ignore upper</span>
        <span aria-hidden="false">Screen reader keep</span>
      </div>
    `;

    const $ = cheerio.load(html);
    removeHiddenElements($, { removeHidden: true });
    expect($("[hidden]").length).toBe(0);
    expect($("span").length).toBe(1);
    expect($("span").text()).toBe("Screen reader keep");
  });

  it("prunes descendants of hidden elements", () => {
    const html = `
      <div>
        <p>Visible</p>
        <div style="display: none;">
          <p>Child 1</p>
          <div>
            <span>Grandchild</span>
          </div>
        </div>
      </div>
    `;

    const $ = cheerio.load(html);
    removeHiddenElements($, { removeHidden: true });
    expect($("div[style]").length).toBe(0);
    expect($("body").text().trim()).toBe("Visible");
  });
});
