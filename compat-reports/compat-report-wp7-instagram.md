# EmbedPress × WordPress 7.0 RC-3 — Instagram Compatibility Report (Gutenberg)

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

## ✅ No Issues Found — Instagram Fully Compatible with WP 7.0

Instagram embeds work correctly with WP 7.0 RC-3. The `instagram.com/p/.../embed` iframe loads in the new blob: origin editor canvas and renders the post content visually. No origin restriction or security error observed.

### What was verified

- EmbedPress REST API (`POST /wp-json/embedpress/v1/oembed/embedpress`) returns a valid object with `embed` HTML ✅
- `iframe[src*="instagram.com"]` attaches in the WP 7.0 editor canvas ✅
- **Screenshot confirms the post renders visually** — the ladybug photo from user `testerbhai` is visible inside the iframe in the editor canvas ✅
- Meta's `X-Frame-Options` / `frame-ancestors` does **not** block the embed from the blob: origin canvas ✅
- Inspector sidebar loads: General, Custom Branding, Ads Settings, Content Protection, Lazy Loading panels ✅

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
| Instagram iframe attaches and renders in editor canvas | `iframe[src*="instagram.com"]` attached; screenshot confirms post photo visible | ✅ PASS |
| REST API returns embed HTML | POST endpoint returns object with embed field | ✅ PASS |
