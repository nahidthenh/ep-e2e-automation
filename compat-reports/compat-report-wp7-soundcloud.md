# EmbedPress × WordPress 7.0 RC-3 — Soundcloud Compatibility Report (Gutenberg)

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

## ✅ No Issues Found — Soundcloud Fully Compatible with WP 7.0

Soundcloud embeds work correctly with WP 7.0 RC-3. The `w.soundcloud.com/player/` iframe attaches in the blob: origin editor canvas without any origin restriction or security error.

### How Soundcloud embedding works

EmbedPress produces an `<iframe src="https://w.soundcloud.com/player/?...url=https://api.soundcloud.com/tracks/560363814...">`. Soundcloud's player endpoint does not enforce origin-based restrictions and loads correctly from the WP 7.0 `blob:` origin canvas.

### What was verified

- EmbedPress REST API returns a valid object with an `embed` field containing the iframe HTML
- `iframe[src*="soundcloud.com"]` attaches in the editor canvas
- The iframe `src` attribute contains the track ID `560363814`
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
| Soundcloud iframe attaches in editor canvas | `iframe[src*="soundcloud.com"]` attached with track ID `560363814` in src | ✅ PASS |
| Inspector sidebar | EmbedPress block card + General + Custom Branding panels visible | ✅ PASS |
