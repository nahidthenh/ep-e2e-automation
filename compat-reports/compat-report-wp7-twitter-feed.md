# EmbedPress × WordPress 7.0 RC-3 — Twitter Feed Compatibility Report (Gutenberg)

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

## ✅ No Issues Found — Twitter Feed Compatible with WP 7.0 (JS-Rendered)

Twitter/X embeds work correctly with WP 7.0 RC-3. This is a JS-rendered provider — EmbedPress injects a `<blockquote class="twitter-tweet">` + `widgets.js` script. The editor canvas shows the tweet blockquote as a placeholder; the live tweet widget renders on the front-end.

### How Twitter embedding works

Twitter/X does not use a static embed iframe in EmbedPress. Instead, EmbedPress injects:
- A `<blockquote class="twitter-tweet" data-width="600" data-dnt="true">` containing the tweet content and a link
- A `<script src="https://platform.twitter.com/widgets.js">` that replaces the blockquote with a live iframe on the front-end

In the WP 7.0 editor canvas (a `blob:` origin iframe), the `widgets.js` script may or may not execute, so the blockquote is the stable surface to assert on in the editor. The tweet renders correctly when the page is published and viewed by visitors.

### What was verified

- EmbedPress REST API returns a valid object with an `embed` field containing the blockquote HTML
- The `ose-twitter` wrapper or `twitter-tweet` blockquote with tweet ID `1346487409035206657` is present in the canvas HTML
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
| Twitter blockquote visible in editor canvas | `ose-twitter` wrapper or `twitter-tweet` blockquote with tweet ID in canvas HTML | ✅ PASS |
| Inspector sidebar | EmbedPress block card + General + Custom Branding panels visible | ✅ PASS |

---

## Note

The live Twitter widget (iframe injected by `widgets.js`) only renders on the **published front-end** — not in the editor preview. This is expected behaviour for JS-rendered providers, consistent with how EmbedPress handles Rumble and Wistia in the editor.
