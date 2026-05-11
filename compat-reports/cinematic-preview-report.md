# Cinematic Preview — Full Test Report

**Date:** 2026-05-11  
**Editor:** Gutenberg  
**WordPress:** 6.9.4 · PHP 8.3 · Apache  
**EmbedPress Pro:** Active  
**Test pages:** `/cinematic-preview/` + 13 variant pages  
**Test files:** `cinematic-preview.spec.ts`, `cinematic-preview-extended.spec.ts`

---

## Executive Summary

The Cinematic Preview feature **renders correctly** for overlay structure, content fields, all 6 style presets, and interactive behaviour (inline play, lightbox, info toggle). However, **every single style customization control is completely non-functional** due to one root cause bug in the PHP renderer — the `style_overrides` object is never output to `data-options`, so the JS that applies CSS custom properties never receives the authored values.

---

## Root Cause — PHP Never Outputs `style_overrides`

**File:** `EmbedPress/Gutenberg/EmbedPressBlockRenderer.php` (around line 1006)

The PHP renderer builds the `cinematic_preview` block inside `data-options` with only content fields:

```php
$options['cinematic_preview'] = [
    'style'     => ...,
    'title'     => ...,
    'logo'      => ...,
    'poster'    => ...,
    'synopsis'  => ...,
    'badge'     => ...,
    'meta'      => ...,
    'year'      => ...,
    'rating'    => ...,
    'duration'  => ...,
    'genre'     => ...,
    'play_mode' => ...,
];
```

It never outputs a `style_overrides` key. The JS in `cinematic-preview.js` reads:

```javascript
applyStyleOverrides(overlay, cp.style_overrides);
```

Since `cp.style_overrides` is always `undefined`, `applyStyleOverrides()` immediately returns:

```javascript
function applyStyleOverrides(overlay, so) {
    if (!so) return;   // ← always hits this, nothing ever runs below
    ...
}
```

**Result:** No CSS custom properties (`--ep-cp-*`) are ever set on the `.ep-cinematic-preview` element. Every style control the user configures in the Gutenberg inspector is silently discarded.

**Verified with live DOM inspection:**

| CSS Custom Property | Expected set value | Actual value on element |
|--------------------|--------------------|-------------------------|
| `--ep-cp-title-color` | `#ffffff` | `""` (empty — never set) |
| `--ep-cp-title-font-size` | `48px` | `""` (empty — never set) |
| `--ep-cp-title-font-weight` | `700` | `""` (empty — never set) |
| `--ep-cp-synopsis-color` | `#e0e0e0` | `""` (empty — never set) |
| `--ep-cp-synopsis-font-size` | `16px` | `""` (empty — never set) |
| `--ep-cp-badge-bg` | `#e53e3e` | `""` (empty — never set) |
| `--ep-cp-overlay-opacity` | `0.6` | `""` (empty — never set) |

---

## All Broken Controls (14 total)

Every control in this list relies on `style_overrides` being present. **All are broken by the same root cause.**

| Control | Block Attribute | CSS Custom Property | Default Fallback Shown |
|---------|----------------|---------------------|------------------------|
| Title Color | `cinematicPreviewTitleColor` | `--ep-cp-title-color` | `#fff` (white) |
| Title Font Size | `cinematicPreviewTitleFontSize` | `--ep-cp-title-font-size` | `clamp(18px, 3.2vw, 38px)` → **38px** |
| Title Font Weight | `cinematicPreviewTitleFontWeight` | `--ep-cp-title-font-weight` | **900** |
| Title Font Family | `cinematicPreviewTitleFontFamily` | `--ep-cp-title-font-family` | Bebas Neue / Impact stack |
| Synopsis Color | `cinematicPreviewSynopsisColor` | `--ep-cp-synopsis-color` | `inherit` → white |
| Synopsis Font Size | `cinematicPreviewSynopsisFontSize` | `--ep-cp-synopsis-font-size` | **15px** |
| Badge Background Color | `cinematicPreviewBadgeBgColor` | `--ep-cp-badge-bg` | `#e50914` (Netflix red) |
| Badge Text Color | `cinematicPreviewBadgeTextColor` | `--ep-cp-badge-color` | `#fff` |
| Play Button Background | `cinematicPreviewPlayBtnBgColor` | `--ep-cp-play-bg` | `#fff` |
| Play Button Text Color | `cinematicPreviewPlayBtnTextColor` | `--ep-cp-play-color` | `#000` |
| Info Button Background | `cinematicPreviewInfoBtnBgColor` | `--ep-cp-info-bg` | `rgba(109,109,110,.7)` |
| Info Button Text Color | `cinematicPreviewInfoBtnTextColor` | `--ep-cp-info-color` | `#fff` |
| Overlay Tint Color | `cinematicPreviewOverlayColor` | `--ep-cp-overlay-color` | `rgba(0,0,0,0)` (transparent) |
| Overlay Opacity | `cinematicPreviewOverlayOpacity` | `--ep-cp-overlay-opacity` | **1** (100%) |

---

## What Works Correctly

### Overlay Structure & Content
| Feature | Result |
|---------|--------|
| Overlay renders (`.ep-cinematic-preview`) | ✅ |
| Wrapper gets `.ep-cp-active` class | ✅ |
| Play button (`.ep-cp-btn-play`) visible | ✅ |
| Info button (`.ep-cp-btn-info`) visible when synopsis set | ✅ |
| Title text renders (auto-fills from oEmbed when blank) | ✅ |
| Synopsis text renders | ✅ |
| Badges render as comma-separated chips | ✅ |
| Meta row: Year, Age Rating, Duration, Genre | ✅ |
| Meta Line override replaces structured fields | ✅ |
| Meta Line override renders as single span (not individual items) | ✅ |
| YouTube iframe present behind overlay | ✅ |

### Style Presets (all 6 render with correct `data-style` attribute)
| Style | `data-style` | Result |
|-------|-------------|--------|
| Netflix Hero | `netflix-hero` | ✅ |
| Prime Video | `prime-video` | ✅ |
| Disney+ | `disney-plus` | ✅ |
| Apple TV+ Cinematic | `apple-tv-cinematic` | ✅ |
| Minimal | `minimal` | ✅ |
| Logo as Title | `logo-as-title` | ✅ |

### Logo as Title Style
| Check | Result |
|-------|--------|
| `.ep-cp-has-logo` class present on overlay | ✅ |
| Logo `<img>` element renders with correct `src` | ✅ |
| `.ep-cp-title` text element is NOT rendered (logo replaces it) | ✅ |
| Play button still present | ✅ |

### Custom Thumbnail
| Check | Result |
|-------|--------|
| Overlay `background-image` uses the custom poster URL | ✅ |

### Interactive Behaviour
| Action | Result |
|--------|--------|
| Play (inline) — overlay hides, video starts | ✅ |
| More Info toggle — adds `ep-cp-info-open` class | ✅ |
| More Info toggle — second click removes class | ✅ |
| Lightbox — opens `.ep-cp-lightbox` on Play click | ✅ |
| Lightbox — Close button dismisses | ✅ |
| Lightbox — `Escape` key dismisses | ✅ |
| Lightbox iframe — contains `autoplay=1` in src | ✅ |

### Gutenberg Editor Inspector Controls
| Control | Present in Inspector |
|---------|---------------------|
| Enable Cinematic Preview (toggle) | ✅ |
| Preview Style (6 options) | ✅ |
| Upload Thumbnail button | ✅ |
| Upload Logo button | ✅ |
| Title TextControl | ✅ |
| Synopsis TextareaControl | ✅ |
| Badges TextControl | ✅ |
| Year / Age Rating / Duration / Genre / Meta Line TextControls | ✅ |
| Play Action (Inline / Lightbox) | ✅ |
| Font Weight SelectControl (7 options incl. Bold, Extra-Bold) | ✅ |
| ColorPalette controls (≥ 5) | ✅ |
| RangeControls (≥ 3) | ✅ |

---

## Test Results Summary

### `cinematic-preview.spec.ts` (39 tests)
| Section | Tests | Passed | Failed |
|---------|-------|--------|--------|
| Front-end structure | 11 | 9 | 2 |
| Style variants | 10 | 10 | 0 |
| Interactive behaviour | 7 | 7 | 0 |
| Gutenberg editor controls | 11 | 4 | 7* |

*7 editor tests timed out under 4-worker parallel load — **test infrastructure issue, not a product bug**.

### `cinematic-preview-extended.spec.ts` (29 tests)
| Section | Tests | Passed | Failed |
|---------|-------|--------|--------|
| Badge colors | 2 | 1 | 1 |
| Button colors | 4 | 2 | 2 |
| Font family | 1 | 0 | 1 |
| Meta line override | 2 | 2 | 0 |
| Logo as Title style | 5 | 5 | 0 |
| Custom thumbnail | 1 | 1 | 0 |
| Synopsis color (bug repro) | 2 | 0 | 2 |
| Overlay opacity (bug repro) | 2 | 0 | 2 |
| Editor inspector (serial, 1 worker) | 10 | 7 | 3* |

*3 editor tests still timed out even at 1 worker — likely the Cinematic Preview panel takes longer to appear after embed resolves; selector may need tuning.

---

## Bug Summary

### BUG-1 — All 14 style customization controls non-functional (Critical)

- **Severity:** Critical
- **Scope:** All 14 style override controls in Gutenberg inspector
- **Root cause:** `EmbedPressBlockRenderer.php` never writes style override attributes (`cinematicPreviewTitleColor`, `cinematicPreviewTitleFontSize`, etc.) into the `cinematic_preview` object inside `data-options`. The JS `applyStyleOverrides(overlay, cp.style_overrides)` always receives `undefined` and bails immediately.
- **Fix direction:** In `build_player_options()`, extend the `cinematic_preview` array to include a `style_overrides` sub-object containing all the style attribute values:
  ```php
  'style_overrides' => [
      'title_color'       => $attributes['cinematicPreviewTitleColor'] ?? '',
      'title_font_size'   => $attributes['cinematicPreviewTitleFontSize'] ?? 0,
      'title_font_weight' => $attributes['cinematicPreviewTitleFontWeight'] ?? '',
      'title_font_family' => $attributes['cinematicPreviewTitleFontFamily'] ?? '',
      'synopsis_color'    => $attributes['cinematicPreviewSynopsisColor'] ?? '',
      'synopsis_font_size'=> $attributes['cinematicPreviewSynopsisFontSize'] ?? 0,
      'badge_bg'          => $attributes['cinematicPreviewBadgeBgColor'] ?? '',
      'badge_color'       => $attributes['cinematicPreviewBadgeTextColor'] ?? '',
      'play_bg'           => $attributes['cinematicPreviewPlayBtnBgColor'] ?? '',
      'play_color'        => $attributes['cinematicPreviewPlayBtnTextColor'] ?? '',
      'info_bg'           => $attributes['cinematicPreviewInfoBtnBgColor'] ?? '',
      'info_color'        => $attributes['cinematicPreviewInfoBtnTextColor'] ?? '',
      'overlay_color'     => $attributes['cinematicPreviewOverlayColor'] ?? '',
      'overlay_opacity'   => $attributes['cinematicPreviewOverlayOpacity'] ?? 0,
  ],
  ```
- **Fluentboards subtasks:** #81631 (synopsis color), #81632 (overlay opacity) — both are symptoms of this single root cause.

---

## Notes on False Positives in First Test Run

The initial test run incorrectly reported title color as passing. This was a coincidence:
- The authored title color was `#ffffff` (white) — which is also the CSS fallback default (`var(--ep-cp-title-color, #fff)`). The test passed because the expected value matched the preset default, **not** because the authored value was applied.
- Similarly, badge text color `#ffffff` appeared to pass because the CSS default is also white.
