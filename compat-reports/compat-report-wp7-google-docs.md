# EmbedPress × WordPress 7.0 RC-3 — Google Docs Compatibility Report (Gutenberg)

**Date:** 2026-05-10
**Tested by:** Automated Playwright E2E suite

## Environment

| Component | Version |
|-----------|---------|
| WordPress | 7.0-RC3 |
| PHP | 8.3.31 |
| EmbedPress (Free) | 4.5.2 |
| EmbedPress Pro | 3.8.9 |

---

## ✅ No Issues Found — Google Docs Fully Compatible with WP 7.0

Google Docs embeds work correctly with WP 7.0 RC-3. EmbedPress converts the `/pub` URL to a `/pub` embed iframe which Google explicitly permits for embedding. The iframe attaches in the new blob: origin editor canvas without any origin restriction.

### How Google Docs embedding works

EmbedPress wraps the `/pub` Google Docs URL in an `<iframe src="https://docs.google.com/document/d/e/.../pub">`. Google's `/pub` endpoint is designed for public embedding and does not enforce `X-Frame-Options` or `frame-ancestors` restrictions — it loads correctly from the WP 7.0 `blob:` origin canvas.

### What was verified

- EmbedPress REST API (`POST /wp-json/embedpress/v1/oembed/embedpress`) returns a valid object with an `embed` field containing the iframe HTML
- `iframe[src*="docs.google.com/document"]` attaches in the editor canvas
- The iframe `src` attribute contains the document marker `2PACX-1vQBdUB9bU8y9hnIrDv`
- Editor canvas origin is confirmed `blob:` (WP 7.0 expected behaviour)
- Inspector sidebar loads: General and Custom Branding panels visible

---

## Full Test Results — 6/6 Passed

### Smoke (3/3)

| Test | Result |
|------|--------|
| EmbedPress active | ✅ PASS |
| EmbedPress Pro active | ✅ PASS |
| Elementor active | ✅ PASS |

### Gutenberg editor UI (3/3)

| Test | What was checked | Result |
|------|-----------------|--------|
| Block inserts, URL input visible | EmbedPress block inserts into canvas with URL input + Embed button | ✅ PASS |
| Google Docs iframe attaches in editor canvas | `iframe[src*="docs.google.com/document"]` attached with correct doc marker | ✅ PASS |
| Inspector sidebar | EmbedPress block card + General + Custom Branding panels visible | ✅ PASS |
