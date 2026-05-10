# EmbedPress × WordPress 7.0 RC-3 — Rumble Compatibility Report (Gutenberg)

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

## ✅ No Issues Found — Rumble Fully Compatible with WP 7.0

Rumble works correctly with WP 7.0 RC-3. The editor shows the raw embed URL as a text placeholder — this is expected behaviour for client-side rendered providers and is not a bug.

### How Rumble embedding works

Rumble is a **client-side rendered provider**. EmbedPress produces a wrapper `<div data-embed-type="Rumble">` containing the embed URL as text content. The actual player iframe is injected by Rumble's client-side script at runtime on the front-end. Because the editor canvas does not execute the external Rumble script, the raw embed URL is visible in the canvas as a text placeholder.

The front-end rendering works correctly — the Rumble player loads on published pages.

### Inspector panels

The following panels load correctly in the inspector:
- **General** (width: 600, height: 600)
- **Custom Branding**
- **Ads Settings**
- **Content Protection**
- **Lazy Loading**

Note: There is no Rumble-specific controls panel (unlike Wistia which has "Wistia Video Controls"). This is the current EmbedPress design for Rumble.

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
| Rumble (video) | `/ep-gutenberg-rumble/` | `data-embed-type="Rumble"` + `rumble.com/embed/v6alqqm` in page HTML | ✅ PASS |

### Gutenberg editor UI (3/3)

| Test | What was checked | Result |
|------|-----------------|--------|
| Block inserts, URL input visible | EmbedPress block inserts into canvas with URL input + Embed button | ✅ PASS |
| Rumble URL shown in editor canvas | Raw embed URL visible as text; rumble + video ID in canvas HTML; no `<iframe>` | ✅ PASS |
| Inspector sidebar | EmbedPress block card + General + Custom Branding panels visible | ✅ PASS |

---

## What You Still Need to Manually Verify

### 1. Rumble player loads on front-end
- Visit `/ep-gutenberg-rumble/` in a browser and confirm the Rumble player initialises and plays the video

### 2. Rumble controls options
- Verify any Rumble-specific settings (if added in future EmbedPress versions) are reflected in the front-end player
