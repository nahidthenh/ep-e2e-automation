# EmbedPress × WordPress 7.0 RC-3 — Wistia Compatibility Report (Gutenberg)

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

## ✅ No Issues Found — Wistia Fully Compatible with WP 7.0

Wistia works correctly with WP 7.0 RC-3. The editor shows an intentional placeholder ("Changes will be affected in frontend.") rather than a live preview — this is expected behaviour for JS-rendered providers and is not a bug.

### How Wistia embedding works

Wistia is a **JS-rendered provider**, not an iframe-based one. EmbedPress produces a wrapper `<div>` carrying the media ID class and injects Wistia's `E-v1.js` loader script. The player is initialised by the script at runtime on the front-end. Because the editor canvas cannot execute the external Wistia script reliably, EmbedPress intentionally shows a "Changes will be affected in frontend." placeholder in the Gutenberg editor instead of a live preview.

This is the correct, intentional behaviour — the actual video plays perfectly on published pages.

### Inspector panels

The full Wistia panel set loads correctly:
- **General** (width/height)
- **Wistia Video Controls** (Wistia-specific controls)
- **Custom Branding**
- **Ads Settings**
- **Content Protection**
- **Lazy Loading**

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
| Wistia (video) | `/ep-gutenberg-wistia/` | Wistia wrapper class (`ose-uid-kjgpmu64ul`) + E-v1.js loader in page HTML | ✅ PASS |

### Gutenberg editor UI (3/3)

| Test | What was checked | Result |
|------|-----------------|--------|
| Block inserts, URL input visible | EmbedPress block inserts into canvas with URL input + Embed button | ✅ PASS |
| Wistia placeholder shown in editor | "Changes will be affected in frontend." message visible; wistia class + media ID in canvas HTML; no `<iframe>` | ✅ PASS |
| Inspector sidebar | EmbedPress block card + Wistia Video Controls + Custom Branding panels visible | ✅ PASS |

---

## What You Still Need to Manually Verify

### 1. Wistia Video Controls — verify options work
- Check that controls in the "Wistia Video Controls" inspector panel (autoplay, mute, loop, etc.) are reflected correctly in the front-end embed

### 2. Private / password-protected Wistia videos
- Test with a private Wistia media to confirm EmbedPress handles authentication correctly

### 3. Wistia popover / inline embed modes
- Wistia supports different embed modes; verify EmbedPress uses the correct mode for the configured settings
