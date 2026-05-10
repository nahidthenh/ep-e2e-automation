# EmbedPress × WordPress 7.0 RC-3 — Facebook Video Compatibility Report (Gutenberg)

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

## ⚠️ Test Data Issue — Facebook Video Deleted (Not an EmbedPress or WP 7.0 Bug)

EmbedPress's Facebook Video integration is **structurally correct and fully compatible with WP 7.0**. The iframe loads in the new blob: origin editor canvas without any origin restriction. However, the test video (`948152072778319`) has been **deleted or made private** — Facebook shows "This Facebook post is no longer available. It may have been removed, or the privacy settings of the post may have changed."

**Action required:** Update `sources.json` with a live, publicly accessible Facebook video URL.

### What was verified

- EmbedPress REST API (`POST /wp-json/embedpress/v1/oembed/embedpress`) returns a valid object with `embed` HTML ✅
- `iframe[src*="facebook.com/plugins/post.php"]` attaches in the WP 7.0 editor canvas — **no blob: origin blocking** ✅
- Facebook's `X-Frame-Options` does **not** block the embed from the blob: origin canvas ✅
- Inspector sidebar loads: General, Custom Branding, Ads Settings, Content Protection, Lazy Loading panels ✅
- Screenshot shows the Facebook iframe loaded, displaying Facebook's own "post not available" message (server-side content gone, not an EmbedPress error)

### How Facebook Video embedding works

EmbedPress uses the same `plugins/post.php` endpoint for videos as for posts, passing the video URL as the `href` parameter. Facebook's embed player loads in the editor iframe and handles both post and video content through the same plugin URL structure.

### What could NOT be verified (test data issue)

- Whether the video player renders and plays inside the iframe
- Whether the video preview looks correct visually

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
| Facebook Video iframe attaches in editor canvas | `iframe[src*="facebook.com/plugins"]` attached — blob: origin does NOT block Facebook | ✅ PASS (structural — video content is deleted) |
| REST API returns embed HTML | POST endpoint returns object with embed field | ✅ PASS |

---

## Action Required

### 🔴 Update test Facebook Video URL
The video `https://www.facebook.com/islammdshariful.sabbir/videos/948152072778319` is no longer available.

1. Find a publicly accessible Facebook video URL
2. Update `sources.json`: change the `Facebook Video` entry URL
3. Re-run `npm run seed` to refresh the seeded page
4. Update `tests/gutenberg/editor-insert/facebook-video-editor-insert.spec.ts` with the new `FB_VIDEO_MARKER`
