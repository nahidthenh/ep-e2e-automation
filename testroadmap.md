# EmbedPress E2E Test Roadmap

> **Versions analysed:** Free 4.5.0 · Pro 3.8.7  
> **Editors in scope:** Gutenberg (Block Editor) · Classic Editor · Elementor  
> **Purpose:** This document is the planning reference for the automation team.
> Test implementation follows separately, guided by this roadmap.

---

## Table of Contents

1. [Test Data & Database Strategy](#1-test-data--database-strategy)
2. [Regression Tests — Seeded Pages](#2-regression-tests--seeded-pages)
3. [Regression Tests — Settings & Configuration](#3-regression-tests--settings--configuration)
4. [Functional Tests — Gutenberg Editor](#4-functional-tests--gutenberg-editor)
5. [Functional Tests — Classic Editor](#5-functional-tests--classic-editor)
6. [Functional Tests — Elementor Editor](#6-functional-tests--elementor-editor)
7. [Pro Feature Tests](#7-pro-feature-tests)
8. [Cross-Editor Consistency Tests](#8-cross-editor-consistency-tests)
9. [Settings Page Tests](#9-settings-page-tests)
10. [REST API & AJAX Tests](#10-rest-api--ajax-tests)
11. [Accessibility & Performance Smoke Tests](#11-accessibility--performance-smoke-tests)
12. [Priority & Phasing](#12-priority--phasing)

---

## 1. Test Data & Database Strategy

### Recommendation: Import/Export approach

**Use a seed SQL file — not a live export — for the following reasons:**

| Concern | Rationale |
|---|---|
| Live export contains user PII / tokens | Instagram tokens, YouTube API keys, license keys are stored in `wp_options`; a raw export would leak secrets into the repo |
| oEmbed cache rows age out | `wp_options` contains cached oEmbed HTML keyed by URL+hash; stale cache breaks assertions |
| Elementor post meta is env-specific | `_elementor_data` contains host-specific URLs baked into the JSON |
| Plugin version drift | An export made from v3.x will contain meta keys that v4.x no longer reads |

**Recommended seed structure (two layers):**

```
seed/
├── seed.sql          ← Minimal fixture: pages + post meta only. No wp_options bloat.
├── seed-options.sql  ← (Optional) Specific wp_options keys needed for certain test groups
│                        (e.g. embedpress:youtube, embedpress:instagram).
│                        Stored as templates with placeholder values replaced at CI time.
└── README.md         ← Documents every row and which test group needs it
```

**What to store in `seed.sql`:**
- `wp_posts` — pre-created published pages, one per editor × provider combo
- `wp_postmeta` — `_elementor_data`, `_elementor_edit_mode`, `_wp_page_template`, `ep_base_*` (encrypted embeds for protection tests)
- Do **not** store: `wp_options` API keys, oEmbed cache rows (`_oembed_*`), user sessions

**What to inject at CI time (not stored in Git):**
- YouTube API key → `wp option update embedpress:youtube '{...}'`
- Instagram access token → via WP-CLI before test suite
- License key for Pro → `wp option update embedpress_license_key $LICENSE_KEY`

**Page ID allocation plan (fixed IDs avoid slug collisions):**

| ID Range | Purpose |
|---|---|
| 100–109 | Gutenberg regression pages (one per block type) |
| 110–119 | Classic Editor regression pages |
| 120–129 | Elementor regression pages |
| 130–139 | Pro feature pages (protection, branding, ads) |
| 140–149 | Edge-case pages (malformed URLs, long content, etc.) |

---

## 2. Regression Tests — Seeded Pages

> These tests load **pre-created pages from `seed.sql`** and assert the embed renders.
> They are the fastest, most stable part of the suite — run on every commit.

### 2.1 Gutenberg Seeded Pages

Each page pre-created in `seed.sql` with block attributes fully populated:

| # | Block | Provider / Content | Assert |
|---|---|---|---|
| G-R-01 | `embedpress/youtube-block` | YouTube single video | iframe renders, src contains `youtube.com/embed` |
| G-R-02 | `embedpress/embedpress` | Vimeo video | `embedpress-wrapper` present, iframe src contains `vimeo.com` |
| G-R-03 | `embedpress/embedpress` | Twitch stream | Twitch iframe renders |
| G-R-04 | `embedpress/embedpress` | Wistia video | Wistia embed container renders |
| G-R-05 | `embedpress/google-docs-block` | Public Google Doc | Google Docs iframe renders |
| G-R-06 | `embedpress/google-sheets-block` | Public Google Sheet | Sheets iframe renders |
| G-R-07 | `embedpress/google-slides-block` | Public Google Slides | Slides iframe renders |
| G-R-08 | `embedpress/google-maps-block` | Google Maps URL | Maps iframe renders |
| G-R-09 | `embedpress/embedpress-pdf` | Self-hosted PDF URL | PDFObject viewer renders |
| G-R-10 | `embedpress/document` | Self-hosted DOCX URL | Document viewer renders |

**DB note for G-R:** `embedpress/youtube-block` only needs `iframeSrc` in attributes.
`embedpress/embedpress` requires `embedHTML` to be pre-baked into the block attrs —
generate it once via the editor UI, then export just those `wp_postmeta` rows.

---

### 2.2 Classic Editor Seeded Pages

| # | Method | Provider | Assert |
|---|---|---|---|
| C-R-01 | `[embedpress]` shortcode | YouTube URL | `embedpress-wrapper` on frontend |
| C-R-02 | `[embedpress]` shortcode | Vimeo URL | Vimeo embed renders |
| C-R-03 | `[embedpress]` shortcode | Google Doc URL | Doc iframe renders |
| C-R-04 | `[embedpress_pdf]` shortcode | PDF URL | Inline PDF viewer renders |
| C-R-05 | `[embedpress_pdf]` + `display_mode=lightbox` | PDF URL | Lightbox trigger button renders; clicking it opens viewer |
| C-R-06 | `[embedpress_pdf]` + `display_mode=button` | PDF URL | Button with `trigger_text` label renders |

---

### 2.3 Elementor Seeded Pages

| # | Widget | Provider | Assert |
|---|---|---|---|
| E-R-01 | `embedpres_elementor` | YouTube URL | iframe or EmbedPress wrapper renders |
| E-R-02 | `embedpres_elementor` | Vimeo URL | Vimeo container renders |
| E-R-03 | `embedpres_document` | PDF URL (media library) | Document viewer renders |
| E-R-04 | `embedpres_pdf` | PDF URL | PDF viewer renders |
| E-R-05 | `embedpres_calendar` | Google Calendar URL | Calendar iframe renders |

---

## 3. Regression Tests — Settings & Configuration

> Ensure previously-working settings don't silently break across versions.

| # | Area | What to verify |
|---|---|---|
| S-R-01 | Global resize | `enableGlobalEmbedResize=true` + custom width/height → all embeds respect dimensions |
| S-R-02 | Lazy load off | `g_lazyload=false` → iframe renders immediately on page load |
| S-R-03 | Lazy load on | `g_lazyload=true` → iframe NOT in DOM on load; appears on scroll |
| S-R-04 | Powered-by branding | `embedpress_document_powered_by=1` → "Powered by EmbedPress" link in document footer |
| S-R-05 | Block enable/disable | Disable `embedpress/youtube-block` via Settings → Elements → confirm block absent in Gutenberg inserter |
| S-R-06 | Elementor widget enable/disable | Disable `embedpres_elementor` via Settings → Elements → confirm absent in Elementor panel |

---

## 4. Functional Tests — Gutenberg Editor

> End-to-end flows: create a new page, add a block, publish, verify frontend.

### 4.1 Universal EmbedPress Block (`embedpress/embedpress`)

| # | Flow | Steps summary | Assert |
|---|---|---|---|
| G-F-01 | YouTube URL paste | New page → insert EmbedPress block → paste YT URL → Embed → Publish | Frontend: iframe with `youtube.com/embed` |
| G-F-02 | Vimeo URL paste | Same flow with Vimeo URL | Frontend: Vimeo iframe |
| G-F-03 | Invalid URL | Paste non-embeddable URL | Editor: error notice; no frontend crash |
| G-F-04 | Width/height override | Set custom dimensions in block Inspector → Publish | Frontend: inline style matches set dimensions |
| G-F-05 | Block alignment | Set alignment (wide, full) → Publish | Frontend: correct alignment class present |

### 4.2 YouTube Block (`embedpress/youtube-block`)

| # | Flow | Assert |
|---|---|---|
| G-YT-01 | Single video | YT watch URL → Publish | `ose-youtube` wrapper + iframe rendered |
| G-YT-02 | Playlist | YT playlist URL → Publish | Playlist player renders |
| G-YT-03 | Channel URL | YT channel URL → Publish | Channel gallery or single-video renders |
| G-YT-04 | Short URL (youtu.be) | `youtu.be/ID` → Publish | Resolves and renders correctly |

### 4.3 Google Blocks

| # | Block | Key assertion |
|---|---|---|
| G-GD-01 | Google Docs | Shared doc URL → iframe with `docs.google.com` src |
| G-GS-01 | Google Sheets | Sheet URL → iframe renders |
| G-GSL-01 | Google Slides | Presentation URL → iframe renders |
| G-GF-01 | Google Forms | Form URL → iframe renders |
| G-GM-01 | Google Maps | Maps URL → iframe renders |
| G-GC-01 | Google Calendar | Calendar URL → iframe renders |

### 4.4 Document / PDF Blocks

| # | Block | Key assertion |
|---|---|---|
| G-DOC-01 | `embedpress/document` | PDF URL → document viewer renders |
| G-PDF-01 | `embedpress/embedpress-pdf` | PDF URL, inline mode → inline viewer |
| G-PDF-02 | `embedpress/embedpress-pdf` | PDF URL, lightbox mode → trigger button; click opens viewer |
| G-PDF-03 | `embedpress/embedpress-pdf` | PDF URL, viewer_style=modern | Modern theme class applied |
| G-PDF-04 | `embedpress/pdf-gallery` | Multiple PDFs → gallery layout renders (grid default) |

### 4.5 Other Media Blocks

| # | Block | Key assertion |
|---|---|---|
| G-TW-01 | Twitch | Twitch channel URL → Twitch iframe |
| G-WI-01 | Wistia | Wistia video URL → Wistia container |

---

## 5. Functional Tests — Classic Editor

### 5.1 Shortcode: `[embedpress]`

| # | Flow | Assert |
|---|---|---|
| C-F-01 | YouTube URL | Shortcode in text tab → Publish → `embedpress-wrapper` renders |
| C-F-02 | Vimeo URL | Same flow | Vimeo wrapper renders |
| C-F-03 | Google Doc | Shortcode wrapping GDoc URL | Doc iframe renders |
| C-F-04 | Width + height attrs | `[embedpress width=800 height=450]url[/embedpress]` | Inline dimensions applied |
| C-F-05 | Invalid URL | Non-embeddable URL | Graceful fallback (link or blank); no PHP error |
| C-F-06 | TinyMCE button | Use TinyMCE EmbedPress toolbar button to insert | Same as C-F-01 |

### 5.2 Shortcode: `[embedpress_pdf]`

| # | Flow | Assert |
|---|---|---|
| C-PDF-01 | Inline mode | `display_mode=inline` | Viewer renders inline |
| C-PDF-02 | Lightbox mode | `display_mode=lightbox` | Button renders; modal opens on click |
| C-PDF-03 | Button mode | `display_mode=button`, custom `trigger_text` | Button with correct label |
| C-PDF-04 | Link mode | `display_mode=link` | Anchor link with trigger_text |
| C-PDF-05 | Viewer style: modern | `viewer_style=modern` | `.modern` CSS class on viewer |
| C-PDF-06 | Viewer style: minimal | `viewer_style=minimal` | `.minimal` CSS class |
| C-PDF-07 | Custom color | `theme_mode=custom custom_color=#ff0000` | Custom color CSS var applied |
| C-PDF-08 | Powered-by | `powered_by=yes` | Branding link visible |
| C-PDF-09 | Powered-by hidden | `powered_by=no` | Branding link absent |

---

## 6. Functional Tests — Elementor Editor

> Open a new page → "Edit with Elementor" → add widget → configure → Update → verify frontend.

### 6.1 EmbedPress Widget (`embedpres_elementor`)

| # | Flow | Assert |
|---|---|---|
| E-F-01 | YouTube URL | Set `embedpress_embeded_link` to YT URL → Update | EmbedPress wrapper + iframe renders |
| E-F-02 | Vimeo URL | Vimeo URL | Vimeo wrapper renders |
| E-F-03 | Google Doc | GDoc URL | Doc iframe renders |
| E-F-04 | Twitch channel | Twitch URL | Twitch iframe renders |
| E-F-05 | Width override | Set custom width | Inline style matches |
| E-F-06 | Source dropdown | Select "YouTube" from dropdown | Correct source-specific controls appear in panel |
| E-F-07 | Elementor preview | Embed preview visible in editor canvas before saving | Preview iframe or placeholder visible |

### 6.2 Document Widget (`embedpres_document`)

| # | Flow | Assert |
|---|---|---|
| E-DOC-01 | PDF from URL | Set document URL → Update | Document viewer renders on frontend |
| E-DOC-02 | PDF from media library | Select file type "File", choose PDF from media | Viewer renders |
| E-DOC-03 | Lazy load toggle (Pro) | Enable lazy load → Update | iframe not in DOM on load; appears on scroll |

### 6.3 PDF Gallery Widget (`embedpres_pdf_gallery`)

| # | Flow | Assert |
|---|---|---|
| E-PDFG-01 | Add multiple PDFs | Select 3 PDFs → Update | Gallery with 3 thumbnails renders |
| E-PDFG-02 | Grid layout | columns=3 → Update | 3-column grid |
| E-PDFG-03 | Click thumbnail | Click PDF thumbnail on frontend | Viewer opens (lightbox or inline) |

### 6.4 Calendar Widget (`embedpres_calendar`)

| # | Flow | Assert |
|---|---|---|
| E-CAL-01 | Google Calendar URL | Set calendar URL → Update | Calendar iframe renders |

---

## 7. Pro Feature Tests

### 7.1 Content Protection

| # | Type | Flow | Assert |
|---|---|---|---|
| P-CP-01 | Password protection (Gutenberg) | Enable protection, set password, publish | Frontend: locked gate visible; embed hidden |
| P-CP-02 | Correct password | Enter correct password on frontend | Embed unlocks and renders |
| P-CP-03 | Wrong password | Enter wrong password | Error message shown; embed stays locked |
| P-CP-04 | User-role protection | Set `protection_type=user-role`, allowed role = Administrator | Logged-in admin sees embed; guest sees gate |
| P-CP-05 | Role restriction — guest | Load as non-logged-in user | Gate displayed, embed hidden |
| P-CP-06 | Custom lock messages | Set custom `lockHeading`, `lockSubHeading`, `lockErrorMessage` | Custom text rendered in gate |
| P-CP-07 | Protection — Classic Editor | Same via shortcode attrs | Same assertions |
| P-CP-08 | Protection — Elementor | Same via widget controls | Same assertions |

### 7.2 Custom Branding

| # | Flow | Assert |
|---|---|---|
| P-BR-01 | Global brand logo | Upload logo in Settings → Branding | Logo appears on document embeds |
| P-BR-02 | Powered-by disabled | Set `embedpress_document_powered_by=0` | "Powered by EmbedPress" link absent |
| P-BR-03 | Custom theme color | Set `custom_color` globally | PDF viewer uses custom color |

### 7.3 Lazy Loading

| # | Flow | Assert |
|---|---|---|
| P-LL-01 | Global lazy load on | `g_lazyload=true` → page load | iframe `src` absent on initial load; set after scroll to viewport |
| P-LL-02 | Per-widget lazy load (Elementor) | Enable lazy load per widget (Doc widget) | Same as P-LL-01 for that widget only |
| P-LL-03 | Lazy load off | `g_lazyload=false` | iframe `src` present immediately on page load |

### 7.4 Ad Manager

| # | Flow | Assert |
|---|---|---|
| P-AD-01 | Ad template set | Configure ad in Settings → Custom Ads, attach to embed | Ad container renders alongside/before embed |
| P-AD-02 | No ad config | No ad configured | No ad container in DOM |

### 7.5 Pro Provider Enhancements

| # | Provider | Feature | Assert |
|---|---|---|---|
| P-YT-01 | YouTube | Channel gallery layout | Gallery layout class/structure applied |
| P-VM-01 | Vimeo | Advanced controls | Vimeo player with extended options renders |
| P-SC-01 | SoundCloud | Buy/Download buttons | Buttons visible in player |
| P-DM-01 | Dailymotion | Logo visibility off | No Dailymotion logo in player |
| P-WI-01 | Wistia | Volume control | Volume slider in Wistia player |
| P-ME-01 | Meetup | Timezone display | Event times shown in configured timezone |
| P-GP-01 | Google Photos | Gallery-justify layout | Justify layout JS loaded; layout renders |

### 7.6 PDF Gallery — Pro Thumbnail Generation

| # | Flow | Assert |
|---|---|---|
| P-PDFG-01 | AJAX thumbnail generation | `ep_generate_pdf_thumbnail` called | Thumbnail image returned; cached in post meta |
| P-PDFG-02 | Imagick unavailable fallback | Disable Imagick → add PDF to gallery | WordPress native preview used as fallback |

---

## 8. Cross-Editor Consistency Tests

> Same embed URL → same provider → all three editors → identical frontend output.

| # | Provider | Editors compared | Assert |
|---|---|---|---|
| X-01 | YouTube | Gutenberg vs Classic vs Elementor | All three produce `youtube.com/embed` iframe |
| X-02 | Vimeo | Gutenberg vs Classic vs Elementor | All three produce Vimeo iframe |
| X-03 | PDF inline | Gutenberg vs Classic vs Elementor | All three produce PDFObject viewer |
| X-04 | Google Docs | Gutenberg vs Classic vs Elementor | All three produce docs.google.com iframe |

---

## 9. Settings Page Tests

| # | Settings page | What to verify |
|---|---|---|
| SET-01 | General | Resize settings saved and applied; lazy load toggle saved |
| SET-02 | Elements — Gutenberg | Enable/disable individual blocks; reflect in block inserter |
| SET-03 | Elements — Elementor | Enable/disable individual widgets; reflect in Elementor panel |
| SET-04 | Branding | Logo upload; saved logo appears in embeds |
| SET-05 | Custom Ads | Ad template CRUD; ad attached to embed renders |
| SET-06 | Sources — YouTube | API key field; valid key saves without error |
| SET-07 | Sources — Instagram | Access token field; token saves without error |
| SET-08 | Sources — Twitch | Client ID/Secret save |
| SET-09 | License (Pro) | Valid license key activates Pro features; invalid key shows error |
| SET-10 | Go Premium | Page renders; CTA links present |

---

## 10. REST API & AJAX Tests

| # | Endpoint | Scenario | Assert |
|---|---|---|---|
| API-01 | `GET /embedpress/v1/oembed/{provider}` | Valid YouTube URL | 200; HTML contains iframe |
| API-02 | `GET /embedpress/v1/oembed/{provider}` | Invalid URL | Graceful error response (not 500) |
| API-03 | `GET /embedpress/v1/oembed/{provider}` | Meetup URL with pagination params | 200; paginated content returned |
| API-04 | `wp_ajax_embedpress_elements_action` | Toggle block on/off with valid nonce | `wp_options` `embedpress:elements` updated |
| API-05 | `wp_ajax_embedpress_elements_action` | Missing or invalid nonce | 403 / wp_die |
| API-06 | `wp_ajax_embedpress_settings_action` | Save valid settings payload | Settings persisted in `embedpress` option |
| API-07 | `wp_ajax_ep_generate_pdf_thumbnail` | Valid PDF attachment ID | Returns thumbnail URL; saves to post meta |
| API-08 | `wp_ajax_ep_generate_pdf_thumbnail` | Invalid attachment ID | Error response; no PHP fatal |

---

## 11. Accessibility & Performance Smoke Tests

| # | Area | Check |
|---|---|---|
| A-01 | iframe titles | All rendered iframes have `title` attribute (WCAG 2.1 criterion 4.1.2) |
| A-02 | Password form | Lock form has proper `label` elements; keyboard navigable |
| A-03 | Keyboard navigation | EmbedPress block controls focusable via Tab in Gutenberg |
| P-01 | Page load with embed | No render-blocking JS from EmbedPress on frontend (only block assets enqueued for pages that use them) |
| P-02 | Lazy load image | With `g_lazyload=true`, no iframe requests before scroll (confirm in Network tab via Playwright) |
| P-03 | Block editor load | `post-new.php` with EmbedPress loaded: no JS console errors |

---

## 12. Priority & Phasing

### Phase 1 — Regression Safety Net (ship first, run on every commit)

Seed all `seed.sql` pages, then implement:
- All **Section 2** seeded-page tests (G-R-*, C-R-*, E-R-*)
- **Section 8** cross-editor consistency tests
- **Section 9** SET-01–SET-03 (resize/elements toggle)

> Database need: finalize `seed.sql` with pre-baked `embedHTML` attributes for the
> `embedpress/embedpress` block rows (requires one manual page-creation session).

---

### Phase 2 — Core Create Flows (basic authoring workflows)

- All **Section 4** Gutenberg functional tests
- All **Section 5** Classic Editor functional tests  
- All **Section 6** Elementor functional tests
- **Section 9** settings tests SET-04–SET-08

> DB need: `seed-options.sql` with placeholder API keys replaced at CI startup.

---

### Phase 3 — Pro Features

- All **Section 7** Pro feature tests
- **Section 9** SET-09 License test
- **Section 10** REST API + AJAX tests

> DB need: `ep_base_*` post meta rows for password-protection tests (one-time generation).

---

### Phase 4 — Quality & Edge Cases

- All **Section 11** accessibility & performance smoke tests
- G-F-03 / C-F-05 invalid URL edge cases
- P-PDFG-02 Imagick fallback test (requires Docker image variant without Imagick)
- Provider edge cases: YouTube short URLs, channel handles, playlist IDs

---

## Appendix A — Seed SQL Coverage Matrix

| Seed page ID | Editor | Block/Shortcode | Provider | Phase |
|---|---|---|---|---|
| 100 | Gutenberg | `embedpress/youtube-block` | YouTube | 1 |
| 101 | Classic | `[embedpress]` | YouTube | 1 |
| 102 | Elementor | `embedpres_elementor` | YouTube | 1 |
| 103 | Gutenberg | `embedpress/embedpress` | Vimeo | 1 |
| 104 | Gutenberg | `embedpress/google-docs-block` | Google Docs | 1 |
| 105 | Gutenberg | `embedpress/embedpress-pdf` (inline) | PDF | 1 |
| 106 | Classic | `[embedpress_pdf]` (lightbox) | PDF | 1 |
| 107 | Elementor | `embedpres_document` | PDF | 1 |
| 108 | Gutenberg | `embedpress/embedpress` (protected) | YouTube | 3 |
| 109 | Classic | `[embedpress]` (role-protected) | YouTube | 3 |

---

## Appendix B — wp_options Keys Required Per Test Phase

| Option key | Required by | How to set in CI |
|---|---|---|
| `embedpress` | Phase 1 (resize, lazy load) | `wp option update embedpress '{...}'` |
| `embedpress:elements` | Phase 1 (block toggle) | `wp option update embedpress:elements '{...}'` |
| `embedpress:youtube` | Phase 2 (YouTube API) | `wp option update embedpress:youtube "$YT_CONFIG"` |
| `embedpress:instagram` | Phase 2 (Instagram feed) | Inject from CI secret |
| `embedpress:twitch` | Phase 2 (Twitch) | Inject from CI secret |
| `embedpress_license_key` | Phase 3 (Pro) | Inject from CI secret |
| `embedpress_document_powered_by` | Phase 1 (branding) | `wp option update ...` |
| `g_lazyload` (inside `embedpress`) | Phase 1 & 3 | `wp option patch update embedpress g_lazyload '1'` |

---

*Last updated: 2026-04-15 | EmbedPress Free 4.5.0 + Pro 3.8.7*
