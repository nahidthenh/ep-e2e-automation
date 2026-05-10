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

## Automated Test Results — All 16 Gutenberg YouTube Tests Passed

### Smoke (3/3)

| Test | Result |
|------|--------|
| EmbedPress active | ✅ PASS |
| EmbedPress Pro active | ✅ PASS |
| Elementor active | ✅ PASS |

### Front-end rendering (8/8)

| Test | Slug | What was checked |
|------|------|-----------------|
| YouTube (single video) | `/ep-gutenberg-youtube/` | ✅ iframe visible, video ID `5zWTInJqD5k` in `src` |
| YouTube Live | `/ep-gutenberg-youtube-live/` | ✅ iframe visible, video ID `WGBm9X4vLPw` in `src` |
| YouTube Channel – Gallery | `/ep-gutenberg-youtube-channel/` | ✅ `[data-embed-type="YoutubeChannel"]` + `.layout-gallery` + channel name "WPDeveloper" |
| YouTube Channel – List | `/ep-gutenberg-youtube-channel-list/` | ✅ `.layout-list` + channel name visible |
| YouTube Channel – Carousel (Pro) | `/ep-gutenberg-youtube-channel-carousel/` | ✅ `.layout-carousel` + channel name visible |
| YouTube Channel – Grid (Pro) | `/ep-gutenberg-youtube-channel-grid/` | ✅ `.layout-grid` + channel name visible |
| YouTube Channel – Controls | `/ep-gutenberg-youtube-channel-controls/` | ✅ pagesize=3 → 3 cards, pagination hidden, gap attr correct |
| YouTube Live Channel (`@channel/live`) | `/ep-gutenberg-youtube-live-channel/` | ✅ YoutubeChannel wrapper + youtube iframe inside |

### Gutenberg editor UI (5/5)

> **WP 7.0 note:** The block editor now renders block content inside an `iframe[name="editor-canvas"]`. Tests use `frameLocator` to access the canvas — this is working correctly with EmbedPress 4.5.2.

| Test | What was checked | Result |
|------|-----------------|--------|
| Block appears in inserter search | Searched "EmbedPress" in block inserter → tile visible | ✅ PASS |
| Block inserts and shows URL input | Block inserted → "Enter URL to embed here…" input + "Embed" button visible in canvas iframe | ✅ PASS |
| YouTube URL accepted, preview renders | Pasted video URL, clicked Embed → YouTube iframe preview visible in canvas | ✅ PASS |
| Inspector sidebar loads (video block) | Settings panel opens → EmbedPress block card visible, no blank sidebar | ✅ PASS |
| Inspector shows channel controls (Channel block) | Pasted channel URL, clicked Embed → sidebar shows Layout/Page Size/Pagination controls | ✅ PASS |

---

## Issues Found

**None.** All 16 Gutenberg YouTube tests pass on WP 7.0 RC-3.

One architectural change worth noting: WP 7.0 moved the block editor canvas into an `<iframe name="editor-canvas">`. EmbedPress blocks render correctly inside this iframe — no compatibility breakage. The test suite has been updated to reflect this (uses `frameLocator`).

---

## What You Still Need to Manually Verify

These areas cannot be covered by automated tests in this setup.

### 1. PHP Debug Log — Deprecation Notices
- Enable `WP_DEBUG` + `WP_DEBUG_LOG` and embed a YouTube URL in a new post
- Check `wp-content/debug.log` for any PHP notices or deprecation warnings from EmbedPress hooks/filters on WP 7.0
- **Why manual:** PHP-level notices are not visible to Playwright

### 2. Privacy / Consent Overlay (if enabled)
- If EmbedPress privacy/GDPR mode is turned on (Settings → Privacy), verify the YouTube consent overlay appears and the iframe only loads after the user accepts
- **Why manual:** Consent overlay JS wiring is not exercised by the automated assertions

### 3. YouTube Live — Real Active Stream
- The YouTube Live tests use a static video ID that may not be currently live; YouTube falls back to the VOD player
- Test with a URL that is actively live right now to confirm the live player (HLS, not VOD) loads correctly
- **Why manual:** Live-stream availability is dynamic

### 4. Block Theme / Full-Site Editing
- Try embedding a YouTube URL inside a Template Part via the Site Editor
- EmbedPress output filters can behave differently in FSE context (the test env uses Hello Elementor theme, not a block theme)
- **Why manual:** FSE context is not part of the current test setup
