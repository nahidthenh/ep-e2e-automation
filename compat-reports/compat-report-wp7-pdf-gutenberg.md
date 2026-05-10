# EmbedPress × WordPress 7.0 RC-3 — PDF Compatibility Report (Gutenberg)

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

## ✅ No Issues Found — PDF Fully Compatible with WP 7.0

All three Gutenberg PDF variants (default, download-disabled, flip-book) render correctly on WP 7.0 RC-3.

### What was verified

- Seeded pages resolve correctly at `/ep-gutenberg-pdf/`, `/ep-gutenberg-pdf-no-download/`, `/ep-gutenberg-pdf-flipbook/`
- `iframe.embedpress-embed-document-pdf` is visible on all three pages
- **Default variant:** iframe src points at the sample PDF; base64 `#key=` payload confirms `download=true` and `toolbar=true`
- **No-download variant:** base64 `#key=` payload confirms `download=false`
- **Flip-book variant:** iframe src uses `action=get_flipbook_viewer` Ajax endpoint; base64 `key` query param confirms `flipbook_toolbar_position` is present

---

## Full Test Results — 6/6 Passed

### Smoke (3/3)

| Test | Result |
|------|--------|
| EmbedPress active | ✅ PASS |
| EmbedPress Pro active | ✅ PASS |
| Elementor active | ✅ PASS |

### Front-end rendering (3/3)

| Test | Slug | What was checked | Result |
|------|------|-----------------|--------|
| PDF (default) | `/ep-gutenberg-pdf/` | iframe visible, PDF src present, `download=true` + `toolbar=true` in key payload | ✅ PASS |
| PDF (download disabled) | `/ep-gutenberg-pdf-no-download/` | iframe visible, `download=false` in key payload | ✅ PASS |
| PDF (flip-book viewer) | `/ep-gutenberg-pdf-flipbook/` | iframe visible, `action=get_flipbook_viewer` in src, `flipbook_toolbar_position` in key payload | ✅ PASS |
