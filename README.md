# tts-dom-cleaner

[![npm version](https://img.shields.io/npm/v/tts-dom-cleaner.svg)](https://www.npmjs.com/package/tts-dom-cleaner)
[![CI](https://github.com/NamahOmprakash/tts-dom-cleaner/actions/workflows/ci.yml/badge.svg)](https://github.com/NamahOmprakash/tts-dom-cleaner/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Clean messy scraped HTML into plain text that is safe to feed to a text-to-speech engine. Removes hidden elements, junk tags, and duplicate paragraphs so TTS never reads invisible or repeated content aloud.

---

## Why

Web-novel and article scrapers frequently return HTML containing text that is invisible in a browser but still present in the DOM: honeypot spans (`display:none`), watermarks (`font-size:0px`), duplicated paragraphs from crawler glitches, and script or style blocks. A Text-to-Speech (TTS) engine reads all of it aloud, ruining the listening experience.

Standard sanitizers such as `sanitize-html` strip the `style` attribute altogether, which inadvertently turns hidden trap text into visible text. `tts-dom-cleaner` inspects inline styles and accessibility attributes _before_ that happens.

### Why not `html-to-text` or Mozilla's Readability?

Generic converters like `html-to-text` or readability extractors focus on converting markup or isolating the main article body. They do not inspect inline CSS properties for anti-copy honeypots (`opacity:0`, `font-size:0`, `display:none !important`) or detect sequential DOM doubling. `tts-dom-cleaner` is specifically engineered as a lightweight, pre-sanitization pass ahead of speech synthesizers and reader apps.

It has **one runtime dependency ([`cheerio`](https://github.com/cheeriojs/cheerio))**.

---

## Before / After

**Input HTML**

```html
<p>The gate opened.</p>
<p style="display:none">Read this novel at example.com</p>
<p>The gate opened.</p>
<p>Chapter 1<br />Arrival</p>
```

**Cleaned TTS Text**

```text
The gate opened.

Chapter 1
Arrival
```

---

## Install

```bash
npm install tts-dom-cleaner
```

Requires **Node.js 20 or later**.

---

## Quick Start

### ESM

```js
import { cleanHtml } from "tts-dom-cleaner";

const text = cleanHtml(html);
```

### CommonJS

```js
const { cleanHtml } = require("tts-dom-cleaner");

const text = cleanHtml(html);
```

### With Options

```js
const text = cleanHtml(html, {
  removeSelectors: [".ad", ".watermark", ".patreon-box"],
  removePatterns: [/read at example\.com/i],
  removeTags: ["nav", "footer"],
});
```

---

## Options

| Option               | Type               | Default  | Description                                                                                                                                   |
| :------------------- | :----------------- | :------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| `removeHidden`       | `boolean`          | `true`   | Remove elements hidden via inline style (`display:none`, `visibility:hidden`, `opacity:0`, `font-size:0`), `hidden`, or `aria-hidden="true"`. |
| `dedupeParagraphs`   | `boolean`          | `true`   | Drop immediately consecutive duplicate paragraphs. Normalized comparison collapses intra-line whitespace.                                     |
| `removeSelectors`    | `string[]`         | `[]`     | Array of custom CSS selectors to drop before text extraction (e.g. `['.watermark', '.ad-box']`).                                              |
| `removePatterns`     | `RegExp[]`         | `[]`     | Array of regular expressions; any matching text block is dropped.                                                                             |
| `removeTags`         | `string[]`         | `[]`     | Opt-in list of HTML tag names to drop (e.g. `['nav', 'footer']`). Semantic tags like `<header>` are kept by default to retain chapter titles. |
| `output`             | `"text" \| "html"` | `"text"` | Return format. `"text"` returns normalized paragraphs; `"html"` returns cleaned DOM markup.                                                   |
| `preserveLineBreaks` | `boolean`          | `true`   | In text mode, joins paragraphs with `\n\n` when `true`, or with single spaces when `false`.                                                   |
| `stripAsciiDividers` | `boolean`          | `true`   | Remove divider lines containing 3 or more repeating characters (`***`, `---`, `___`, `===`, `~~~`).                                           |

> **Always-Removed Tags**: Non-readable junk tags (`script`, `style`, `noscript`, `template`, `svg`, `iframe`, and `canvas`) are always removed regardless of options.
>
> **Note on Deduplication**: Only immediately consecutive identical paragraphs are deduplicated by default. Legitimate non-consecutive repetitions common in literature (e.g., repeated character dialogue like `"No."` separated by narrative action) are intentionally preserved.

---

## How It Works

1. **Parse**: Loads the HTML string into Cheerio with zero external browser overhead.
2. **Purge Junk & Targeted Selectors**: Strips non-content elements (`<script>`, `<style>`, `<template>`, etc.), along with user-supplied `removeTags` and `removeSelectors`.
3. **Inspect Visibility**: Scans inline `style` declarations and attributes. Removes nodes evaluating to `display:none`, `visibility:hidden`, `opacity:0`, `font-size:0`, `hidden`, or `aria-hidden="true"`, automatically pruning all descendants.
4. **Extract Blocks**: Traverses semantic block leaves, cleanly translating `<br>` tags into newlines and maintaining inline tag text (`<b>`, `<span>`, `<a>`) without fragmenting paragraphs or duplicating mixed bare-text containers.
5. **Normalize & Deduplicate**: Drops ASCII divider lines and blocks matching `removePatterns`, collapses sequential duplicate paragraphs, and joins paragraphs with clean delimiters (`\n\n`).

---

## Known Limitations

- **External CSS Stylesheets**: Visibility is inspected exclusively via inline `style` attributes. Classes defined in external stylesheets (e.g. `.hidden { display: none; }`) cannot be computed without a browser layout engine. Use `removeSelectors` for known hidden class names.
- **Off-screen Positioning**: CSS tricks like `position: absolute; left: -9999px;` or `text-indent: -9999px;` are not detected automatically. Target these with `removeSelectors`.
- **Automated Watermark Guessing**: Unmarked watermarks embedded directly in regular text without distinctive styles, selectors, or patterns cannot be detected automatically. Target them using `removePatterns`.

---

## Security

This is **not** an XSS or HTML security sanitizer. It is designed solely to clean DOM text for speech synthesis and reader modes. It does not sanitize malicious attributes (such as `onload` or `javascript:` protocols). Always pipe untrusted user input through a security sanitizer like [DOMPurify](https://github.com/cure53/DOMPurify) or [sanitize-html](https://github.com/apostrophecms/sanitize-html).

---

## Development

```bash
# Install dependencies
npm ci

# Run test suite
npm test

# Run tests with coverage (target: >=90%)
npm run test:coverage

# Run linter and typechecker
npm run lint
npm run typecheck

# Build dual ESM/CJS bundles
npm run build
```

---

## Roadmap

- **v0.2.0**: `toSpeechChunks(text: string, options?: { maxChars?: number }): string[]` — Sentence batching leveraging `Intl.Segmenter` to split long text into TTS synthesis batches while respecting abbreviations (e.g., "Mr.", "Dr.") and ellipses.

See [CHANGELOG.md](CHANGELOG.md).

---

## Credits & Attribution

- Powered by [Cheerio](https://cheerio.js.org/) for HTML parsing.
- Originated from the pull request _"feat(reader): add DOM pre-sanitizer to fix TTS artifacts and duplicates"_ ([Inreader #2072](https://github.com/Inreader/Inreader/pull/2072)).
- **AI Disclosure**: Built with AI assistance: Antigravity (Gemini) for implementation, and Claude for review and planning. All code was reviewed, verified, and tested by the author.

---

## License

[MIT](LICENSE) © 2026 Namah Omprakash
