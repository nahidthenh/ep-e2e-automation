# EmbedPress × WordPress 7.0 RC-3 — Streamable Compatibility Report (Gutenberg)

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

## ⚠️ Test Data Issue — Streamable Video Deleted (Not an EmbedPress Bug)

EmbedPress's Streamable integration is structurally correct, but the test video (`susppe`) has been **deleted from Streamable** and returns HTTP 404. The editor canvas shows "404 — This page could not be found." inside the iframe.

**Action required:** Update `sources.json` with a live Streamable video URL to fully validate front-end playback and editor preview.

### What was verified

- EmbedPress correctly produces a Streamable embed iframe: `<iframe src="https://streamable.com/o/susppe" …>`
- The iframe element attaches in the editor canvas with the correct `src` attribute
- Inspector panels load correctly: General (width/height), Custom Branding, Ads Settings, Content Protection, Lazy Loading
- No blob:-origin restriction — Streamable's embed does not enforce origin policies like YouTube/Vimeo
- The seeded front-end page still passes because the iframe element is present in the stored HTML (the 404 is visible only at runtime when the browser fetches the video)

### What could NOT be verified (test data issue)

- Whether the Streamable player renders correctly in the editor or front-end
- Whether playback controls work

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
| Streamable (video) | `/ep-gutenberg-streamable/` | iframe visible, `susppe` in src | ✅ PASS (structural only — video is 404) |

### Gutenberg editor UI (3/3)

| Test | What was checked | Result |
|------|-----------------|--------|
| Block inserts, URL input visible | EmbedPress block inserts into canvas with URL input + Embed button | ✅ PASS |
| Streamable iframe attaches with correct src | `iframe[src*="streamable.com/o/susppe"]` attached; blob: canvas confirmed | ✅ PASS (structural — content is 404) |
| Inspector sidebar | EmbedPress block card + General + Custom Branding panels visible | ✅ PASS |

---

## Action Required

### 🔴 Update test video URL
The Streamable video `https://streamable.com/susppe` returns HTTP 404 — the video was deleted.

1. Find or upload a new Streamable video
2. Update `sources.json`: change `"url": "https://streamable.com/susppe"` to the new URL
3. Re-run `npm run seed` to refresh the seeded page
4. Update `tests/gutenberg/streamable.spec.ts` with the new `URL_MARKER`
5. Update `tests/gutenberg/editor-insert/streamable-editor-insert.spec.ts` with the new video ID

### What you still need to manually verify (once URL is updated)
- Streamable player renders and plays correctly in editor and front-end
- No origin restriction errors in the editor canvas
