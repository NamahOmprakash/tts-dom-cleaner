import { cleanHtml } from "../dist/index.js";

const rawScrapedHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Chapter 1: The Beginning</title>
      <style>.hidden { display: none; }</style>
    </head>
    <body>
      <header>
        <h1>Chapter 1: The Beginning</h1>
      </header>
      <div class="chapter-content">
        <p>The wind blew gently through the pine trees on the mountain ridge.</p>
        <p style="display: none !important">Scraped by novel-pirate-aggregator.com</p>
        <p>The wind blew gently through the pine trees on the mountain ridge.</p>
        <p>Caelen adjusted his backpack, looking down toward the valley below.</p>
        <div style="font-size: 0px">anti-scraper trap sentence</div>
        <p>***</p>
        <div class="ad-container">Support our sponsors! Click here!</div>
        <p>A distant roar echoed from deep within the forest.</p>
        <p>A distant roar echoed from deep within the forest.</p>
      </div>
    </body>
  </html>
`;

console.log("=== Raw HTML Input ===");
console.log(rawScrapedHtml.trim());

console.log("\n=== Cleaned Text for TTS Synthesizer ===");
const cleanText = cleanHtml(rawScrapedHtml, {
  removeSelectors: [".ad-container"],
});
console.log(cleanText);

console.log("\n=== Cleaned HTML for Reader Mode ===");
const cleanMarkup = cleanHtml(rawScrapedHtml, {
  removeSelectors: [".ad-container"],
  output: "html",
});
console.log(cleanMarkup);
