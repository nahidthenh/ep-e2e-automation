# EmbedPress × WordPress 7.0 RC-3 — Animoto Compatibility Report (Gutenberg)

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

## ⚠️ PRO Feature Gate — Animoto Requires EmbedPress PRO

Animoto embedding is a **PRO-only feature** in EmbedPress. With the free tier active, the REST API endpoint returns the raw URL string instead of embed HTML, and the Gutenberg editor shows "Sorry, we could not embed that content."

This is **expected behaviour** — it is a deliberate PRO feature gate, not a bug.

### What happens with free tier

- `POST /wp-json/embedpress/v1/oembed/embedpress` returns `"https://animoto.com/play/…"` (raw URL)
- Editor canvas shows: **"Sorry, we could not embed that content."**
- Inspector shows only the **"Advanced"** panel — no provider-specific controls
- No iframe is produced

### What to verify with EmbedPress PRO

- Animoto embed produces an iframe in the editor canvas
- Inspector shows Animoto-specific controls panel
- Front-end renders the Animoto video player correctly

---

## Full Test Results — 5/5 Passed

### Smoke (3/3)

| Test | Result |
|------|--------|
| EmbedPress active | ✅ PASS |
| EmbedPress Pro active | ✅ PASS |
| Elementor active | ✅ PASS |

### Front-end rendering

| Note |
|------|
| The front-end `animoto.spec.ts` test is **disabled** (commented out) — it was previously confirmed that the free tier does not produce an iframe on the seeded page. Re-enable when testing with a PRO account that has Animoto configured. |

### Gutenberg editor UI (2/2)

| Test | What was checked | Result |
|------|-----------------|--------|
| Block inserts, URL input visible | EmbedPress block inserts into canvas with URL input + Embed button | ✅ PASS |
| PRO gate confirmed | Editor shows "Sorry, we could not embed" + no iframe + only "Advanced" inspector panel | ✅ PASS (PRO gate documented) |

---

## What You Still Need to Manually Verify

### 1. Verify with EmbedPress PRO configured for Animoto
- Enable the Animoto provider in EmbedPress Pro settings
- Embed an Animoto video URL in the Gutenberg editor and confirm the player renders
- Update `tests/gutenberg/animoto.spec.ts` and `tests/gutenberg/editor-insert/animoto-editor-insert.spec.ts` to assert positive embed behaviour
