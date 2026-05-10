# EmbedPress × WordPress 7.0 RC-3 — Google Slides Compatibility Report (Gutenberg)

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

## ✅ No Issues Found — Google Slides Fully Compatible with WP 7.0

Google Slides embeds work correctly with WP 7.0 RC-3. EmbedPress converts the `/pub?...` URL to a `/embed?...` iframe which Google explicitly supports for embedding. The iframe attaches in the blob: origin editor canvas without any origin restriction.

### How Google Slides embedding works

EmbedPress transforms the public Google Slides URL (`/pub?start=true&loop=true&delayms=3000`) into an embed form (`/embed?start=true&loop=true&delayms=3000`). Google's `/embed` endpoint is designed for iframe embedding and loads correctly from the WP 7.0 `blob:` origin canvas.

### What was verified

- EmbedPress REST API returns a valid object with an `embed` field containing the iframe HTML
- `iframe[src*="docs.google.com/presentation"]` attaches in the editor canvas
- The iframe `src` attribute contains the presentation marker `2PACX-1vQ3rsCWkulDES2YgcuXvTy36o2n6NDu0nNzbV`
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
| Google Slides iframe attaches in editor canvas | `iframe[src*="docs.google.com/presentation"]` attached with correct presentation marker | ✅ PASS |
| Inspector sidebar | EmbedPress block card + General + Custom Branding panels visible | ✅ PASS |
