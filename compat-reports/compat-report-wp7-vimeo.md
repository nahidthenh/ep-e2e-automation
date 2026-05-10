# EmbedPress × WordPress 7.0 RC-3 — Vimeo Compatibility Report (Gutenberg)

**Date:** 2026-05-10
**Tested by:** Automated Playwright E2E suite + manual screenshot verification

## Environment

| Component | Version |
|-----------|---------|
| WordPress | 7.0-RC3 |
| PHP | 8.3.31 |
| EmbedPress (Free) | 4.5.2 |
| EmbedPress Pro | 3.8.9 |

---

## ✅ No Issues Found — Vimeo Fully Compatible with WP 7.0

Vimeo embeds work correctly with WP 7.0 RC-3. The player renders with a live video preview inside the new blob: origin editor canvas. An earlier automated test incorrectly flagged a security error — manual screenshot verification confirmed the player loads without any issue.

### What was verified

- EmbedPress REST API returns a valid object with `embed` field containing the Vimeo iframe HTML
- `iframe[src*="player.vimeo.com"]` attaches in the editor canvas with video ID `4821640` in the src
- **Screenshot confirms the Vimeo player renders visually** — video thumbnail and player controls visible in the editor canvas
- Vimeo does **not** enforce origin restrictions from the WP 7.0 `blob:` origin canvas
- Editor canvas origin is confirmed `blob:` (WP 7.0 expected behaviour)
- Inspector sidebar loads correctly: General (Video Size, Width, Height), Video Controls, Custom Branding panels visible

---

## Full Test Results — 7/7 Passed

### Smoke (3/3)

| Test | Result |
|------|--------|
| EmbedPress active | ✅ PASS |
| EmbedPress Pro active | ✅ PASS |
| Elementor active | ✅ PASS |

### Front-end rendering (1/1)

| Test | Slug | What was checked | Result |
|------|------|-----------------|--------|
| Vimeo (single video) | `/ep-gutenberg-vimeo/` | iframe visible, video ID `4821640` in src | ✅ PASS |

### Gutenberg editor UI (3/3)

| Test | What was checked | Result |
|------|-----------------|--------|
| Block inserts, URL input visible | "Enter URL to embed here…" + "Embed" button appear in canvas | ✅ PASS |
| Vimeo player renders in editor canvas | iframe attached with correct src; screenshot confirms live player preview | ✅ PASS |
| Inspector sidebar | EmbedPress block card + Video Controls + Custom Branding panels visible | ✅ PASS |
