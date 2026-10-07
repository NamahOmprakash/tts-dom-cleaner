# tts-dom-cleaner

[![npm version](https://img.shields.io/npm/v/tts-dom-cleaner.svg)](https://www.npmjs.com/package/tts-dom-cleaner)
[![CI](https://github.com/NamahOmprakash/tts-dom-cleaner/actions/workflows/ci.yml/badge.svg)](https://github.com/NamahOmprakash/tts-dom-cleaner/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> Pre-sanitizes messy HTML strings and purges visually hidden content, junk tags, and duplicate paragraphs for Text-to-Speech (TTS) synthesizers and distraction-free reader apps.

---

## Why It Exists

Scraped articles, web novels, and reader extracts frequently contain DOM tricks designed to defeat ad-blockers and scrapers, or glitches caused by crawler duplication:

- **Zero-size & invisible traps**: Text hidden using `font-size: 0px`, `display: none`, `opacity: 0`, or `aria-hidden="true"`. Screen readers and TTS synthesizers read these invisible watermarks and honeypots aloud, ruining the listening experience.
- **Scraper artifacts & DOM doubling**: Chapters often feature duplicated consecutive paragraphs or repetitive divider lines (`***`, `---`).
- **Junk elements**: Embedded scripts, styles, iframes, and canvas tags that inject noise.

`tts-dom-cleaner` runs a defensive pre-sanitization pass over the DOM and returns clean, normalized plain text (or sanitized HTML) ready for TTS speech synthesis.

It has **one runtime dependency ([`cheerio`](https://github.com/cheeriojs/cheerio))**.

---

## Before & After

### Raw Input HTML

```html
<header><h1>Chapter 1: The Lair</h1></header>
<p>Arthur climbed the jagged rocks.</p>
<p style="display:none !important">Scraped by novel-hub watermark</p>
<p>Arthur climbed the jagged rocks.</p>
<div style="font-size: 0px">anti-scraper trap sentence</div>
<p>***</p>
<div class="ad-banner">Click for free coins!</div>
<p>A roar echoed from the cave.</p>
```

### Cleaned TTS Output (`cleanHtml(html, { removeSelectors: ['.ad-banner'] })`)

```text
Chapter 1: The Lair

Arthur climbed the jagged rocks.

A roar echoed from the cave.
```

---

## Installation

```bash
npm install tts-dom-cleaner
```

Requires **Node.js >= 20.0.0**.

---

## Quick Start

```typescript
import { cleanHtml } from "tts-dom-cleaner";

const messyHtml = `
  <div>
    <p>The journey begins here.</p>
    <span style="display: none">Hidden watermark</span>
    <p>The journey begins here.</p>
    <div class="patreon-banner">Support author on Patreon</div>
  </div>
`;

// Extract clean text for TTS
const text = cleanHtml(messyHtml, {
  removeSelectors: [".patreon-banner"],
});

console.log(text);
// "The journey begins here."
```

---

## API Reference

### `cleanHtml(html: string, options?: CleanOptions): string`

#### Options

| Option               | Type               | Default  | Description                                                                                                                                             |
| :------------------- | :----------------- | :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `removeHidden`       | `boolean`          | `true`   | Strip elements hidden via inline styles (`display:none`, `visibility:hidden`, `opacity:0`, `font-size:0`), `hidden` attribute, or `aria-hidden="true"`. |
| `dedupeParagraphs`   | `boolean`          | `true`   | Drops immediately consecutive duplicate paragraphs. Normalized comparison collapses intra-line whitespace.                                              |
| `removeSelectors`    | `string[]`         | `[]`     | Array of custom CSS selectors to prune before text extraction (e.g. `['.watermark', '.ad-box']`).                                                       |
| `removePatterns`     | `RegExp[]`         | `[]`     | Array of regular expressions; any text block matching a pattern is dropped.                                                                             |
| `removeTags`         | `string[]`         | `[]`     | Opt-in list of HTML tag names to drop (e.g. `['nav', 'footer']`). Semantic tags like `<header>` are kept by default to retain chapter titles.           |
| `output`             | `"text" \| "html"` | `"text"` | Return format. `"text"` returns normalized paragraphs; `"html"` returns cleaned DOM markup.                                                             |
| `preserveLineBreaks` | `boolean`          | `true`   | In text mode, joins paragraphs with `\n\n` when `true`, or with single spaces when `false`.                                                             |
| `stripAsciiDividers` | `boolean`          | `true`   | Strips lines containing 3 or more repeating divider characters (`***`, `---`, `___`, `===`, `~~~`).                                                     |

> **Note on Deduplication**: Only immediately consecutive identical paragraphs are deduplicated by default. Legitimate non-consecutive repetitions common in literature (e.g., repeated character dialogue like `"No."` separated by narration) are intentionally preserved.

---

## Security Disclaimer

> [!WARNING]
> **`tts-dom-cleaner` is NOT an XSS or HTML security sanitizer.**
> It is designed exclusively to remove visual hiding tricks and noise for Text-to-Speech synthesis and reader modes. It does not sanitize malicious attributes (e.g. `onload`, `javascript:` protocols).
>
> If you are accepting untrusted user-submitted HTML in a web application, always pipe input through a security sanitizer like [DOMPurify](https://github.com/cure53/DOMPurify) or [sanitize-html](https://github.com/apostrophecms/sanitize-html).

---

## Known Limitations

- **External CSS Stylesheets**: Visibility is inspected via inline `style` attributes. Classes defined in external stylesheets (e.g. `.is-hidden { display: none; }`) cannot be computed without a full layout engine. Use `removeSelectors` to target known hidden class names.
- **Off-screen Positioning**: CSS tricks like `position: absolute; left: -9999px;` or `text-indent: -9999px;` are not detected automatically. Use `removeSelectors` for known off-screen containers.
- **Automated Watermark Detection**: Unmarked watermarks embedded directly in regular text without distinctive selectors, styles, or patterns cannot be detected automatically. Use `removePatterns` with targeted regexes.

---

## Roadmap

- **v0.2.0**: `toSpeechChunks(text: string, options?: { maxChars?: number }): string[]` — Sentence batching leveraging `Intl.Segmenter` to split long texts into TTS synthesis batches while respecting abbreviations (e.g., "Mr.", "Dr.") and ellipses.

---

## Credits & Attribution

- **Core Dependency**: Powered by [`cheerio`](https://github.com/cheeriojs/cheerio) for fast, robust DOM parsing.
- **Origin**: This logic originates from the pull request _"feat(reader): add DOM pre-sanitizer to fix TTS artifacts and duplicates"_ on the [Inreader](https://github.com) project.
- **AI Pair Programming**: Developed with AI pair-programming assistance from Antigravity (Google DeepMind) in compliance with academic and open-source course disclosure guidelines.

---

## License

[MIT](LICENSE) © 2026 Namah Omprakash
