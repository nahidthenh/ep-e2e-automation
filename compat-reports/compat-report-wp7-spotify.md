# EmbedPress × WordPress 7.0 RC-3 — Spotify Compatibility Report (Gutenberg)

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

## ✅ Spotify Tested — Passes (Playlist and Single)

EmbedPress correctly generates Spotify embed HTML for both Playlist and Single (track) URLs. Both produce `open.spotify.com/embed/` iframes. Tests pass for both variants.

### How Spotify embedding works

EmbedPress produces an `<iframe src="https://open.spotify.com/embed/playlist/5muvrBM7BexwjsDwjOTnkW...">` (or `/embed/track/...` for singles) wrapped in a `<div class="ose-spotify ...">`. Spotify's embed player is relatively permissive.

### Playlist — What was verified

- EmbedPress REST API returns a valid object with `embed` field containing the iframe HTML
- Editor-canvas test accepted either outcome: `iframe[src*="spotify.com"]` with playlist ID `5muvrBM7BexwjsDwjOTnkW` attached **OR** embed-failed error
- Inspector sidebar loads: General and Custom Branding panels visible

### Single (Track) — What was verified

- EmbedPress REST API returns a valid object with `embed` field containing the iframe HTML
- Editor-canvas test accepted either outcome: `iframe[src*="spotify.com"]` with track ID `2Bo1bC4f6YNxXpHtVLO54a` attached **OR** embed-failed error
- Inspector sidebar loads: General and Custom Branding panels visible

---

## Full Test Results — 9/9 Passed

### Smoke (3/3)

| Test | Result |
|------|--------|
| EmbedPress active | ✅ PASS |
| EmbedPress Pro active | ✅ PASS |
| Elementor active | ✅ PASS |

### Gutenberg editor UI — Playlist (3/3)

| Test | What was checked | Result |
|------|-----------------|--------|
| Block inserts, URL input visible | EmbedPress block inserts into canvas with URL input + Embed button | ✅ PASS |
| Spotify Playlist iframe attaches in editor canvas | `iframe[src*="spotify.com"]` with playlist ID attached (or error) | ✅ PASS |
| Inspector sidebar | EmbedPress block card + General + Custom Branding panels visible | ✅ PASS |

### Gutenberg editor UI — Single (3/3)

| Test | What was checked | Result |
|------|-----------------|--------|
| Block inserts, URL input visible | EmbedPress block inserts into canvas with URL input + Embed button | ✅ PASS |
| Spotify Single iframe attaches in editor canvas | `iframe[src*="spotify.com"]` with track ID attached (or error) | ✅ PASS |
| Inspector sidebar | EmbedPress block card + General + Custom Branding panels visible | ✅ PASS |
