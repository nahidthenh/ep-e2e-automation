# EmbedPress × WordPress 7.0 RC-3 — YouTube Compatibility Report (Gutenberg)

**Date:** 2026-05-10
**Tested by:** Automated Playwright E2E suite

## Environment

| Component | Version |
|-----------|---------|
| WordPress | 7.0-RC3 |
| PHP | 8.3.31 |
| EmbedPress (Free) | 4.5.2 |
| EmbedPress Pro | 3.8.9 |
| Elementor | 4.0.7 |
| WP-CLI | 2.12.0 |

---

## ❌ Confirmed Bug — YouTube Error 153 in Gutenberg Editor Preview

**Severity:** Medium — editor-only, front-end is unaffected.

### What happens
When a YouTube URL is embedded via the EmbedPress block in the Gutenberg editor, the video player inside the editor canvas shows:

> **Error 153 — Video player configuration error**

This affects both single video URLs and the video player inside YouTube Channel embeds.

### Root cause
WordPress 7.0 introduced an `<iframe name="editor-canvas">` with a `blob:` URL origin (e.g. `blob:http://localhost/...`) to render block content. YouTube's embedded player rejects playback when the parent frame's origin is a `blob:` scheme — it returns Error 153. This is a YouTube security policy, not an EmbedPress code bug.

Previous WP versions rendered blocks directly in the page DOM, so YouTube loaded fine. The new canvas iframe broke it.

### What still works
- The YouTube iframe element IS produced correctly by EmbedPress (correct video ID in `src`)
- All front-end pages render the YouTube embed without any error
- The EmbedPress inspector sidebar (General, Video Controls, Custom Branding panels) loads correctly
- YouTube Channel metadata (name, subscriber count, video list) renders correctly in the editor

### Fix direction
EmbedPress needs to detect the `blob:` parent origin and either:
- Render a static thumbnail + "preview unavailable in editor" message instead of the live iframe, or
- Use `origin` parameter in the YouTube embed URL to pass the actual site origin

---

## Full Test Results — 17/17 Passed

### Smoke (3/3)

| Test | Result |
|------|--------|
| EmbedPress active | ✅ PASS |
| EmbedPress Pro active | ✅ PASS |
| Elementor active | ✅ PASS |

### Front-end rendering (8/8) — all clean

| Test | Slug | What was checked |
|------|------|-----------------|
| YouTube (single video) | `/ep-gutenberg-youtube/` | ✅ iframe visible, video ID `5zWTInJqD5k` in src |
| YouTube Live | `/ep-gutenberg-youtube-live/` | ✅ iframe visible, video ID `WGBm9X4vLPw` in src |
| YouTube Channel – Gallery | `/ep-gutenberg-youtube-channel/` | ✅ layout-gallery + channel name "WPDeveloper" |
| YouTube Channel – List | `/ep-gutenberg-youtube-channel-list/` | ✅ layout-list + channel name |
| YouTube Channel – Carousel (Pro) | `/ep-gutenberg-youtube-channel-carousel/` | ✅ layout-carousel + channel name |
| YouTube Channel – Grid (Pro) | `/ep-gutenberg-youtube-channel-grid/` | ✅ layout-grid + channel name |
| YouTube Channel – Controls | `/ep-gutenberg-youtube-channel-controls/` | ✅ pagesize=3 → 3 cards, pagination hidden, gap attr correct |
| YouTube Live Channel (`@channel/live`) | `/ep-gutenberg-youtube-live-channel/` | ✅ YoutubeChannel wrapper + youtube iframe |

### Gutenberg editor UI (6/6)

| Test | What was checked | Result |
|------|-----------------|--------|
| Block in inserter search | Searched "EmbedPress" → tile visible | ✅ PASS |
| Block inserts, URL input visible | "Enter URL to embed here…" + "Embed" button in canvas | ✅ PASS |
| Error 153 confirmed (video) | YouTube iframe attached in canvas, canvas origin is `blob:` | ✅ PASS (bug documented) |
| Inspector sidebar — video block | EmbedPress block card + General / Video Controls / Custom Branding panels visible | ✅ PASS |
| Error 153 confirmed (channel) | Channel metadata renders, YouTube iframe attached, canvas origin is `blob:` | ✅ PASS (bug documented) |
| Inspector sidebar — channel block | YouTube Channel controls panel visible | ✅ PASS |

---

## What You Still Need to Manually Verify

### 1. PHP Debug Log — Deprecation Notices
- Enable `WP_DEBUG` + `WP_DEBUG_LOG`, embed a YouTube URL, check `wp-content/debug.log`
- **Why manual:** PHP-level notices are not visible to Playwright

### 2. Privacy / Consent Overlay (if enabled)
- If EmbedPress GDPR mode is on (Settings → Privacy), verify the consent gate fires before the iframe loads on the front-end
- **Why manual:** Consent overlay JS wiring is not part of the automated assertions

### 3. YouTube Live with a Real Active Stream
- Tests use a static video ID that falls back to VOD when not live; test with a currently-live URL to confirm the live HLS player loads
- **Why manual:** Live-stream availability is dynamic

### 4. Block Theme / Full-Site Editing
- Try embedding a YouTube URL inside a Template Part via Site Editor (the test env uses Hello Elementor theme, not a block theme)
- **Why manual:** FSE context is not in the current test setup
