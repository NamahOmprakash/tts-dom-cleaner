# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-07

### Added

- Core `cleanHtml` DOM pre-sanitization engine with dual ESM and CJS bundling.
- Inline style inspector pruning elements hidden via `display: none`, `visibility: hidden`, `opacity: 0` (`0.0`), and `font-size: 0` (`0px`, `0rem`, `0em`, `0pt`, `0%`), tolerating mixed-casing, whitespace, and `!important`.
- Accessibility-attribute pruning for `hidden` and `aria-hidden="true"`.
- Non-content junk tag purging (`script`, `style`, `noscript`, `template`, `svg`, `iframe`, `canvas`) executed unconditionally.
- Opt-in structural tag pruning (`removeTags`) to preserve chapter headers and titles by default while allowing targeted removal of `nav` or `footer`.
- Custom CSS selector targeting (`removeSelectors`) and regex pattern matching (`removePatterns`).
- Mixed DOM container handling extracting bare text alongside nested block children without duplication or data loss.
- Inline element preservation without splitting paragraphs, translating `<br>` into clean line breaks.
- ASCII art divider stripping requiring $\ge 3$ divider characters (`***`, `---`, `___`, `===`, `~~~`).
- Consecutive paragraph deduplication with whitespace normalization for both `text` and `html` output modes.
- Complete Vitest test suite with 100% statement coverage and 91%+ branch coverage.
- GitHub Actions CI workflow supporting Node.js 20, 22, and 24.
