# EmbedPress × WordPress 7.0 RC-3 — Dailymotion Compatibility Report (Gutenberg)

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

## ❌ Confirmed Bug — EmbedPress REST API POST Endpoint Does Not Resolve Dailymotion URLs

**Severity:** High — live embedding in Gutenberg editor fails for all Dailymotion URLs.

### What happens

When a Dailymotion URL is submitted in the EmbedPress Gutenberg block, the editor either:
1. Shows **"Sorry, we could not embed that content."** (cold oEmbed cache), or
2. Shows the Dailymotion player only after falling back to WordPress's built-in oEmbed proxy (warm cache — inconsistent)

### Root cause

EmbedPress's Gutenberg block sends a `POST` request to its own REST endpoint:

```
POST /wp-json/embedpress/v1/oembed/embedpress
body: { "url": "https://www.dailymotion.com/video/x8odzbr" }
```

The endpoint returns **just the raw URL string** instead of an oEmbed response object:

```json
"https://www.dailymotion.com/video/x8odzbr"
```

This is provider-specific: the same POST endpoint correctly resolves YouTube and Vimeo URLs. The `GET` variant of the same endpoint (`?url=...`) DOES work for Dailymotion — the bug is in the POST handler only.

**This is NOT the same issue as YouTube Error 153 or Vimeo's blob: security error.** The Dailymotion player itself has no blob:-origin restriction — when the embed eventually resolves (via WP's oEmbed fallback), it renders correctly without any security error.

### Confirmed via direct API test

```bash
# POST — returns raw URL (bug)
curl -X POST -u admin:admin \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.dailymotion.com/video/x8odzbr"}' \
  http://localhost/wp-json/embedpress/v1/oembed/embedpress
# → "https://www.dailymotion.com/video/x8odzbr"

# GET — returns full embed HTML (works)
curl -u admin:admin \
  "http://localhost/wp-json/embedpress/v1/oembed/embedpress?url=https://www.dailymotion.com/video/x8odzbr"
# → { "type": "video", "html": "<div class='ose-dailymotion'>…</iframe></div>", … }
```

### Inspector sidebar when embed fails

When the embed fails, the inspector shows only **"Advanced"** panel. When the embed succeeds (via WP oEmbed fallback), the full panel set appears:
- General (width/height)
- Custom Branding
- Ads Settings
- Content Protection
- Lazy Loading

**Note:** Dailymotion does NOT have a "Video Controls" panel — this is intentional for the Dailymotion provider, unlike YouTube/Vimeo.

### What still works

- **Front-end rendering is clean** — Dailymotion embed renders correctly on published/seeded pages
- `wp_oembed_get()` works for Dailymotion URLs (WordPress's native oEmbed resolver)
- Short `dai.ly` URLs and full `dailymotion.com` URLs are both affected equally
- Dailymotion has **no blob:-origin restriction** — unlike YouTube Error 153 and Vimeo's connection error, there is no security policy issue

### Fix direction

In EmbedPress's REST API handler for `POST /wp-json/embedpress/v1/oembed/embedpress`, the Dailymotion provider resolution path is returning the input URL instead of calling the oEmbed provider. Fix should align the POST handler's provider lookup to match the GET handler's behavior.

---

## Full Test Results — 8/8 Passed

### Smoke (3/3)

| Test | Result |
|------|--------|
| EmbedPress active | ✅ PASS |
| EmbedPress Pro active | ✅ PASS |
| Elementor active | ✅ PASS |

### Front-end rendering (1/1)

| Test | Slug | What was checked | Result |
|------|------|-----------------|--------|
| Dailymotion (single video) | `/ep-gutenberg-dailymotion/` | iframe visible, video ID `x8odzbr` in src | ✅ PASS |

### Gutenberg editor UI (4/4)

| Test | What was checked | Result |
|------|-----------------|--------|
| Block inserts, URL input visible | EmbedPress block inserts into canvas with URL input + Embed button | ✅ PASS |
| POST endpoint returns raw URL | `POST /wp-json/embedpress/v1/oembed/embedpress` returns URL string, not oEmbed data | ✅ PASS (bug confirmed) |
| Embed settles without blob: restriction | Embed eventually shows iframe OR error — never a blob:-origin security rejection | ✅ PASS (bug documented) |
| Inspector sidebar | EmbedPress block card always visible; Custom Branding/Ads Settings shown when embed succeeds | ✅ PASS |

---

## What You Still Need to Manually Verify

### 1. PHP Debug Log
- Enable `WP_DEBUG_LOG` and embed a Dailymotion URL — check `wp-content/debug.log` for PHP errors related to the oEmbed resolver

### 2. Dailymotion API Key / Authentication
- Check if Dailymotion's API requires authentication and whether EmbedPress Pro settings have a Dailymotion API key configured — this may be why the POST handler fails

### 3. Cold-cache behavior in production
- In a production site (no seeded pages), the fallback to WP native oEmbed will likely always fail since there's no cached embed. The "Sorry, we could not embed" error will be the consistent result for editors.
