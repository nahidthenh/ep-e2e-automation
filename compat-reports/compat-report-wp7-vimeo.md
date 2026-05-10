# EmbedPress × WordPress 7.0 RC-3 — Vimeo Compatibility Report (Gutenberg)

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

## ❌ Confirmed Bug — Vimeo Security/Connection Error in Gutenberg Editor Preview

**Severity:** Medium — editor-only, front-end is unaffected.

### What happens
When a Vimeo URL is embedded via the EmbedPress block in the Gutenberg editor, the video player inside the editor canvas shows:

> **"We couldn't verify the security of your connection. Access to this content has been restricted. Contact your internet service provider for help."**

### Root cause
Same root cause as YouTube Error 153. WordPress 7.0 renders the block editor canvas inside `<iframe name="editor-canvas">` with a `blob:` URL origin. Vimeo rejects embedding when the parent frame has a `blob:` origin as a security policy.

### What still works
- **Front-end rendering is clean** — Vimeo embed renders correctly on published pages
- EmbedPress produces the correct Vimeo player iframe with the right video ID (`4821640`)
- Inspector sidebar (General, Video Controls, Custom Branding) loads correctly

### Fix direction
Same fix as YouTube: detect the `blob:` parent origin in EmbedPress and render a static thumbnail placeholder instead. A single fix covers both YouTube and Vimeo.

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
| KNOWN ISSUE confirmed | Vimeo iframe attached with correct src, canvas origin is `blob:` | ✅ PASS (bug documented) |
| Inspector sidebar | EmbedPress block card + Video Controls + Custom Branding panels visible | ✅ PASS |

---

## What You Still Need to Manually Verify

### 1. PHP Debug Log
- Enable `WP_DEBUG_LOG` and embed a Vimeo URL — check `wp-content/debug.log` for PHP deprecation notices

### 2. Privacy / Consent Overlay
- If EmbedPress GDPR mode is on, verify the consent gate fires before the Vimeo iframe loads on front-end

### 3. Vimeo Private Videos
- Test with a password-protected or private Vimeo video to confirm EmbedPress handles auth correctly on WP 7.0
