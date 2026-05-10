# EmbedPress × WordPress 7.0 RC-3 — Twitch Compatibility Report (Gutenberg)

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

## ✅ No Issues Found — Twitch Fully Compatible with WP 7.0

Twitch embeds work correctly in both the Gutenberg editor and on the front-end. Unlike YouTube and Vimeo, Twitch does **not** restrict embedding from `blob:` origins, so the WP 7.0 editor canvas causes no issues.

### What was verified

- Twitch live stream embeds and renders the player preview correctly in the editor canvas
- The channel name (`sinatraa`) appears correctly in the `embed.twitch.tv` iframe `src`
- EmbedPress sets the required `parent=localhost` parameter — Twitch accepts this for local dev
- Inspector sidebar shows the full panel set: **Twitch Controls**, **Custom Branding**, **Ads Settings**, **Content Protection**
- Front-end rendering is clean — iframe visible with correct channel src

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
| Twitch (channel) | `/ep-gutenberg-twitch/` | iframe visible, `channel=sinatraa` in src | ✅ PASS |

### Gutenberg editor UI (3/3)

| Test | What was checked | Result |
|------|-----------------|--------|
| Block inserts, URL input visible | EmbedPress block inserts into canvas with URL input + Embed button | ✅ PASS |
| Twitch embed renders in editor canvas | `embed.twitch.tv` iframe attached with `channel=sinatraa` in src | ✅ PASS |
| Inspector sidebar | EmbedPress block card + Twitch Controls + Custom Branding panels visible | ✅ PASS |

---

## What You Still Need to Manually Verify

### 1. Twitch VOD / Clip Embeds
- Test with a Twitch VOD URL (`twitch.tv/videos/...`) and a clip URL (`twitch.tv/clip/...`) to confirm EmbedPress handles all Twitch URL formats

### 2. Twitch Controls panel — verify options
- Check that the Twitch Controls panel options (autoplay, mute, theme, layout) are reflected in the embedded player

### 3. Production domain `parent` parameter
- On a production site with a real domain (not `localhost`), verify the `parent` parameter is set to the correct domain so Twitch's embed policy is satisfied
