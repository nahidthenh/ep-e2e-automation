# Cinematic Preview — Elementor Test Report

**Date:** 2026-05-11
**Editor:** Elementor
**WordPress:** 6.9.4 · PHP 8.3 · Apache
**EmbedPress Pro:** Active
**Test pages:** 14 seeded pages (`/ep-elementor-cinematic-preview/` + 13 variants)
**Test file:** `tests/elementor/cinematic-preview.spec.ts`

---

## Executive Summary

The Cinematic Preview feature works **correctly end-to-end in Elementor**. All 55 tests passed — including every style control (colors, font size, font weight, font family, overlay opacity, badge/button colors). This stands in stark contrast to the Gutenberg block, where all 14 style controls are broken.

The reason is architectural: **Elementor injects CSS directly** via its native `selectors` mechanism, completely bypassing the `style_overrides` / `data-options` path that is broken in Gutenberg.

---

## Test Results — 55 / 55 Passed

| Section | Tests | Passed | Failed |
|---------|-------|--------|--------|
| Front-end structure | 17 | 17 | 0 |
| Style variants (5 presets × 2) | 10 | 10 | 0 |
| Interactive behaviour | 6 | 6 | 0 |
| Badge colours | 2 | 2 | 0 |
| Button colours | 4 | 4 | 0 |
| Font family | 1 | 1 | 0 |
| Meta line override | 2 | 2 | 0 |
| Logo as Title style | 5 | 5 | 0 |
| Custom thumbnail | 1 | 1 | 0 |
| Synopsis colour (CSS injection) | 2 | 2 | 0 |
| Overlay opacity (CSS injection) | 2 | 2 | 0 |
| Smoke (plugins check) | 3 | 3 | 0 |
| **Total** | **55** | **55** | **0** |

---

## What Works Correctly

### Overlay Structure & Content

| Feature | Result |
|---------|--------|
| Overlay renders (`.ep-cinematic-preview`) | ✅ |
| Wrapper gets `.ep-cp-active` class | ✅ |
| Play button (`.ep-cp-btn-play`) visible | ✅ |
| Info button (`.ep-cp-btn-info`) visible when synopsis set | ✅ |
| Title text renders | ✅ |
| Synopsis text renders | ✅ |
| Badges render as comma-separated chips (NEW, HD, 4K) | ✅ |
| Meta row: Year, Age Rating, Duration, Genre | ✅ |
| Meta Line override replaces structured fields | ✅ |
| Meta Line override renders as single span | ✅ |
| YouTube iframe present behind overlay | ✅ |

### Style Presets (all 5 tested)

| Style | `data-style` | Result |
|-------|-------------|--------|
| Netflix Hero | `netflix-hero` | ✅ |
| Prime Video | `prime-video` | ✅ |
| Disney+ | `disney-plus` | ✅ |
| Apple TV+ Cinematic | `apple-tv-cinematic` | ✅ |
| Minimal | `minimal` | ✅ |

### Style Controls — ALL Working via Elementor CSS Injection

| Control | Elementor Selector | Expected | Actual | Result |
|---------|-------------------|----------|--------|--------|
| Title Color | `{{WRAPPER}} .ep-cp-title` | `rgb(255, 255, 255)` | `rgb(255, 255, 255)` | ✅ |
| Title Font Size | `{{WRAPPER}} .ep-cp-title` | `48px` | `48px` | ✅ |
| Title Font Weight | `{{WRAPPER}} .ep-cp-title` | `700` | `700` | ✅ |
| Title Font Family | `{{WRAPPER}} .ep-cp-title` | contains `georgia` | ✅ pass | ✅ |
| Synopsis Color | `{{WRAPPER}} .ep-cp-synopsis` | `rgb(224, 224, 224)` | `rgb(224, 224, 224)` | ✅ |
| Synopsis Font Size | `{{WRAPPER}} .ep-cp-synopsis` | `16px` | `16px` | ✅ |
| Badge Background | `{{WRAPPER}} .ep-cp-badges span` | `rgb(229, 62, 62)` | `rgb(229, 62, 62)` | ✅ |
| Badge Text Color | `{{WRAPPER}} .ep-cp-badges span` | `rgb(255, 255, 255)` | `rgb(255, 255, 255)` | ✅ |
| Play Button Bg | `{{WRAPPER}} .ep-cp-btn-play` | `rgb(56, 161, 105)` | `rgb(56, 161, 105)` | ✅ |
| Play Button Color | `{{WRAPPER}} .ep-cp-btn-play` | `rgb(255, 255, 255)` | `rgb(255, 255, 255)` | ✅ |
| Info Button Bg | `{{WRAPPER}} .ep-cp-btn-info` | `rgb(49, 130, 206)` | `rgb(49, 130, 206)` | ✅ |
| Info Button Color | `{{WRAPPER}} .ep-cp-btn-info` | `rgb(255, 255, 255)` | `rgb(255, 255, 255)` | ✅ |
| Overlay Tint | `{{WRAPPER}} .ep-cp-overlay` | `rgb(255, 0, 0)` | `rgb(255, 0, 0)` | ✅ |
| Overlay Opacity | `{{WRAPPER}} .ep-cp-overlay` | `0.5` | `0.5` | ✅ |

### Interactive Behaviour

| Action | Result |
|--------|--------|
| Play (inline) — overlay hides, wrapper loses `.ep-cp-active` | ✅ |
| More Info toggle — adds `ep-cp-info-open` class | ✅ |
| More Info toggle — second click removes class | ✅ |
| Lightbox — opens `.ep-cp-lightbox` on Play click | ✅ |
| Lightbox — Close button dismisses | ✅ |
| Lightbox — `Escape` key dismisses | ✅ |
| Lightbox iframe — contains `autoplay=1` in src | ✅ |

### Logo as Title

| Check | Result |
|-------|--------|
| `data-style="logo-as-title"` | ✅ |
| `.ep-cp-has-logo` class on overlay | ✅ |
| Logo `<img>` renders with correct `src` | ✅ |
| `.ep-cp-title` text element absent (logo replaces it) | ✅ |
| Play button still present | ✅ |

### Custom Thumbnail

| Check | Result |
|-------|--------|
| Overlay `background-image` uses the custom poster URL | ✅ |

---

## Key Finding: Why Elementor Works When Gutenberg Doesn't

### The Gutenberg bug (BUG-1 in the Gutenberg report)

In Gutenberg, all 14 style controls fail because `EmbedPressBlockRenderer.php` never writes a `style_overrides` key into the `cinematic_preview` object in `data-options`. The front-end JS reads `cp.style_overrides`, gets `undefined`, and returns immediately — CSS custom properties are never set.

### Elementor's different approach

In Elementor, **every style control declares a `selectors` array** in its control definition:

```php
// Example: synopsis color
$this->add_control('cinematic_preview_synopsis_color', [
    'type'      => Controls_Manager::COLOR,
    'selectors' => [
        '{{WRAPPER}} .ep-cp-synopsis' => 'color: {{VALUE}};',
    ],
]);

// Example: overlay opacity
$this->add_control('cinematic_preview_overlay_opacity', [
    'type'      => Controls_Manager::SLIDER,
    'range'     => ['px' => ['min' => 0, 'max' => 1, 'step' => 0.05]],
    'selectors' => [
        '{{WRAPPER}} .ep-cp-overlay' => 'opacity: {{SIZE}};',
    ],
]);
```

Elementor's CSS engine reads these `selectors`, resolves `{{WRAPPER}}` to the widget container's unique CSS class (e.g., `.elementor-element-abc12345`), and **injects a `<style>` block** directly into the page. This CSS applies regardless of what `data-options` contains.

This means:
- Elementor does NOT use `style_overrides` at all for rendering
- The missing `style_overrides` key in `data-options` does not affect Elementor
- The Gutenberg `style_overrides` bug is **Gutenberg-only**

### Comparison table

| Mechanism | Gutenberg | Elementor |
|-----------|-----------|-----------|
| Style delivery | CSS custom properties via `data-options.cinematic_preview.style_overrides` | Elementor CSS injection via `selectors` |
| Bug: `style_overrides` missing from `data-options` | **All 14 style controls broken** | **No impact — different path** |
| Synopsis color (#ff69b4) | ❌ Not applied | ✅ Applied |
| Overlay opacity (50%) | ❌ Not applied | ✅ Applied |
| Badge background | ❌ Not applied | ✅ Applied |
| Font family (Georgia) | ❌ Not applied | ✅ Applied |

---

## No Bugs Found in Elementor

No functional defects were identified in the Elementor Cinematic Preview implementation. The test run was a clean 55/55 pass.

### Minor observation (not a bug)

The Elementor widget's `$playerOptions['cinematic_preview']` array (in `Embedpress_Elementor.php` around line 5494) also omits `style_overrides`, exactly like the Gutenberg renderer. However, since Elementor never reads `style_overrides` from `data-options` — it uses its own CSS injection — this has no effect on behaviour.

If the `style_overrides` key were ever added to the Elementor `data-options` output (e.g., for a hypothetical future JS feature), it would need to match the Gutenberg fix structure. But it is not needed today.

---

## Seeded Test Pages

| ID | Slug | Purpose |
|----|------|---------|
| 500270 | `ep-elementor-cinematic-preview` | Base (Netflix Hero) + all content + style controls |
| 500271 | `ep-elementor-cinematic-preview-prime-video` | Prime Video preset |
| 500272 | `ep-elementor-cinematic-preview-disney-plus` | Disney+ preset |
| 500273 | `ep-elementor-cinematic-preview-apple-tv-cinematic` | Apple TV+ Cinematic preset |
| 500274 | `ep-elementor-cinematic-preview-minimal` | Minimal preset |
| 500275 | `ep-elementor-cinematic-preview-lightbox` | Lightbox play mode |
| 500276 | `ep-elementor-cinematic-preview-logo-as-title` | Logo as Title style |
| 500277 | `ep-elementor-cinematic-preview-badge-colors` | Badge bg/text color |
| 500278 | `ep-elementor-cinematic-preview-button-colors` | Play/Info button colors |
| 500279 | `ep-elementor-cinematic-preview-font-family` | Title typography — Georgia |
| 500280 | `ep-elementor-cinematic-preview-meta-override` | Meta line override |
| 500281 | `ep-elementor-cinematic-preview-thumbnail` | Custom cinematic poster |
| 500282 | `ep-elementor-cinematic-preview-synopsis-color` | Synopsis color (#ff69b4) + size (18px) |
| 500283 | `ep-elementor-cinematic-preview-overlay-opacity` | Overlay opacity 50% + tint #ff0000 |
