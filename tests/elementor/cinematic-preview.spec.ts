/**
 * Cinematic Preview — Elementor comprehensive test suite
 *
 * Tests every seeded variant page at /ep-elementor-cinematic-preview-*.
 * Elementor injects style-control CSS directly via WRAPPER selectors,
 * so the style tests here verify a fundamentally different rendering path
 * from the Gutenberg block (which relies on style_overrides in data-options).
 */

import { test, expect, Page } from '@playwright/test';

const YT_VIDEO_ID = '5zWTInJqD5k';

const SLUG_BASE    = 'ep-elementor-cinematic-preview';
const SLUG_PRIME   = 'ep-elementor-cinematic-preview-prime-video';
const SLUG_DISNEY  = 'ep-elementor-cinematic-preview-disney-plus';
const SLUG_APPLE   = 'ep-elementor-cinematic-preview-apple-tv-cinematic';
const SLUG_MINIMAL = 'ep-elementor-cinematic-preview-minimal';
const SLUG_LIGHTBOX = 'ep-elementor-cinematic-preview-lightbox';

async function visitFrontend(page: Page, slug: string) {
  const res = await page.goto(`/${slug}/`, { waitUntil: 'load' });
  expect(res?.ok(), `HTTP ${res?.status()} for /${slug}/`).toBeTruthy();
}

async function getOverlay(page: Page) {
  const overlay = page.locator('.ep-cinematic-preview').first();
  await expect(overlay).toBeVisible({ timeout: 30_000 });
  return overlay;
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION 1 — Front-end structure
// ════════════════════════════════════════════════════════════════════════════

test.describe('Elementor Cinematic Preview — front-end structure', () => {

  test('overlay is rendered on the base page', async ({ page }) => {
    await visitFrontend(page, SLUG_BASE);
    const overlay = await getOverlay(page);
    await expect(overlay).toHaveAttribute('data-style', 'netflix-hero');
  });

  test('wrapper gets .ep-cp-active class', async ({ page }) => {
    await visitFrontend(page, SLUG_BASE);
    await expect(page.locator('.ep-embed-content-wraper.ep-cp-active').first()).toBeVisible({ timeout: 30_000 });
  });

  test('Play button is present', async ({ page }) => {
    await visitFrontend(page, SLUG_BASE);
    await getOverlay(page);
    await expect(page.locator('.ep-cp-btn-play').first()).toBeVisible();
  });

  test('More Info button is present when synopsis is set', async ({ page }) => {
    await visitFrontend(page, SLUG_BASE);
    await getOverlay(page);
    await expect(page.locator('.ep-cp-btn-info').first()).toBeVisible();
  });

  test('title text is rendered in the overlay', async ({ page }) => {
    await visitFrontend(page, SLUG_BASE);
    await getOverlay(page);
    const title = page.locator('.ep-cp-title').first();
    await expect(title).toBeVisible();
    const text = await title.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('synopsis text is rendered in the overlay', async ({ page }) => {
    await visitFrontend(page, SLUG_BASE);
    await getOverlay(page);
    const syn = page.locator('.ep-cp-synopsis').first();
    await expect(syn).toBeVisible();
    const text = await syn.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('badge chips are rendered (NEW, HD, 4K)', async ({ page }) => {
    await visitFrontend(page, SLUG_BASE);
    await getOverlay(page);
    const badges = page.locator('.ep-cp-badges span');
    await expect(badges).toHaveCount(3, { timeout: 10_000 });
    await expect(badges.nth(0)).toContainText('NEW');
    await expect(badges.nth(1)).toContainText('HD');
    await expect(badges.nth(2)).toContainText('4K');
  });

  test('meta row contains Year, Rating, Duration, Genre', async ({ page }) => {
    await visitFrontend(page, SLUG_BASE);
    await getOverlay(page);
    const meta = page.locator('.ep-cp-meta');
    await expect(meta).toBeVisible();
    await expect(meta).toContainText('2024');
    await expect(meta).toContainText('PG');
    await expect(meta).toContainText('5m 36s');
    await expect(meta).toContainText('Technology');
  });

  test('overlay has a background (poster or gradient)', async ({ page }) => {
    await visitFrontend(page, SLUG_BASE);
    const overlay = await getOverlay(page);
    const bg = await overlay.evaluate((el) => window.getComputedStyle(el).backgroundImage);
    expect(bg).not.toBe('none');
  });

  test('YouTube iframe is present behind the overlay', async ({ page }) => {
    await visitFrontend(page, SLUG_BASE);
    await getOverlay(page);
    const iframe = page.locator(`.ep-embed-content-wraper iframe[src*="${YT_VIDEO_ID}"]`).first();
    await expect(iframe).toBeAttached({ timeout: 20_000 });
  });

  test('title color is applied via Elementor CSS injection (#ffffff)', async ({ page }) => {
    await visitFrontend(page, SLUG_BASE);
    await getOverlay(page);
    const title = page.locator('.ep-cp-title').first();
    await expect(title).toBeVisible();
    const color = await title.evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 255, 255)');
  });

  test('title font-size is applied via Elementor CSS injection (48px)', async ({ page }) => {
    await visitFrontend(page, SLUG_BASE);
    await getOverlay(page);
    const title = page.locator('.ep-cp-title').first();
    const fontSize = await title.evaluate((el) => window.getComputedStyle(el).fontSize);
    expect(fontSize).toBe('48px');
  });

  test('title font-weight is applied via Elementor CSS injection (700)', async ({ page }) => {
    await visitFrontend(page, SLUG_BASE);
    await getOverlay(page);
    const title = page.locator('.ep-cp-title').first();
    const fontWeight = await title.evaluate((el) => window.getComputedStyle(el).fontWeight);
    expect(fontWeight).toBe('700');
  });

  test('synopsis color is applied via Elementor CSS injection (#e0e0e0)', async ({ page }) => {
    await visitFrontend(page, SLUG_BASE);
    await getOverlay(page);
    const syn = page.locator('.ep-cp-synopsis').first();
    const color = await syn.evaluate((el) => window.getComputedStyle(el).color);
    // #e0e0e0 → rgb(224, 224, 224)
    expect(color).toBe('rgb(224, 224, 224)');
  });

  test('synopsis font-size is applied via Elementor CSS injection (16px)', async ({ page }) => {
    await visitFrontend(page, SLUG_BASE);
    await getOverlay(page);
    const syn = page.locator('.ep-cp-synopsis').first();
    const fontSize = await syn.evaluate((el) => window.getComputedStyle(el).fontSize);
    expect(fontSize).toBe('16px');
  });

  test('overlay opacity is applied via Elementor CSS injection (0.6)', async ({ page }) => {
    await visitFrontend(page, SLUG_BASE);
    const overlayInner = page.locator('.ep-cp-overlay').first();
    await expect(overlayInner).toBeVisible({ timeout: 30_000 });
    const opacity = await overlayInner.evaluate((el) => window.getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeCloseTo(0.6, 1);
  });

});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 2 — Style variants
// ════════════════════════════════════════════════════════════════════════════

test.describe('Elementor Cinematic Preview — style variants', () => {

  const variants: Array<{ slug: string; style: string; label: string }> = [
    { slug: SLUG_BASE,    style: 'netflix-hero',       label: 'Netflix Hero' },
    { slug: SLUG_PRIME,   style: 'prime-video',        label: 'Prime Video' },
    { slug: SLUG_DISNEY,  style: 'disney-plus',        label: 'Disney+' },
    { slug: SLUG_APPLE,   style: 'apple-tv-cinematic', label: 'Apple TV+ Cinematic' },
    { slug: SLUG_MINIMAL, style: 'minimal',            label: 'Minimal' },
  ];

  for (const { slug, style, label } of variants) {
    test(`${label} — overlay has correct data-style="${style}"`, async ({ page }) => {
      await visitFrontend(page, slug);
      const overlay = page.locator('.ep-cinematic-preview').first();
      await expect(overlay).toBeVisible({ timeout: 30_000 });
      await expect(overlay).toHaveAttribute('data-style', style);
    });

    test(`${label} — Play button is visible`, async ({ page }) => {
      await visitFrontend(page, slug);
      await expect(page.locator('.ep-cinematic-preview').first()).toBeVisible({ timeout: 30_000 });
      await expect(page.locator('.ep-cp-btn-play').first()).toBeVisible();
    });
  }

});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 3 — Interactive behaviour
// ════════════════════════════════════════════════════════════════════════════

test.describe('Elementor Cinematic Preview — interactive behaviour', () => {

  test('Play (inline) — overlay hides after clicking Play', async ({ page }) => {
    await visitFrontend(page, SLUG_BASE);
    await getOverlay(page);
    await page.locator('.ep-cp-btn-play').first().click();
    await expect(
      page.locator('.ep-embed-content-wraper.ep-cp-active').first()
    ).toBeHidden({ timeout: 10_000 });
  });

  test('More Info toggle — clicking Info button opens synopsis panel', async ({ page }) => {
    await visitFrontend(page, SLUG_BASE);
    const overlay = await getOverlay(page);
    const infoBtn = page.locator('.ep-cp-btn-info').first();
    await expect(infoBtn).toBeVisible();
    await infoBtn.click();
    await expect(overlay).toHaveClass(/ep-cp-info-open/, { timeout: 5_000 });
  });

  test('More Info toggle — clicking Info button again closes the panel', async ({ page }) => {
    await visitFrontend(page, SLUG_BASE);
    const overlay = await getOverlay(page);
    const infoBtn = page.locator('.ep-cp-btn-info').first();
    await infoBtn.click();
    await infoBtn.click();
    await expect(overlay).not.toHaveClass(/ep-cp-info-open/, { timeout: 5_000 });
  });

  test('Lightbox mode — clicking Play opens lightbox container', async ({ page }) => {
    await visitFrontend(page, SLUG_LIGHTBOX);
    await expect(page.locator('.ep-cinematic-preview').first()).toBeVisible({ timeout: 30_000 });
    await page.locator('.ep-cp-btn-play').first().click();
    await expect(page.locator('.ep-cp-lightbox').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Lightbox mode — Close button dismisses the lightbox', async ({ page }) => {
    await visitFrontend(page, SLUG_LIGHTBOX);
    await expect(page.locator('.ep-cinematic-preview').first()).toBeVisible({ timeout: 30_000 });
    await page.locator('.ep-cp-btn-play').first().click();
    await expect(page.locator('.ep-cp-lightbox').first()).toBeVisible({ timeout: 10_000 });
    await page.locator('.ep-cp-lightbox-close').first().click();
    await expect(page.locator('.ep-cp-lightbox').first()).toBeHidden({ timeout: 5_000 });
  });

  test('Lightbox mode — Escape key dismisses the lightbox', async ({ page }) => {
    await visitFrontend(page, SLUG_LIGHTBOX);
    await expect(page.locator('.ep-cinematic-preview').first()).toBeVisible({ timeout: 30_000 });
    await page.locator('.ep-cp-btn-play').first().click();
    await expect(page.locator('.ep-cp-lightbox').first()).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('.ep-cp-lightbox').first()).toBeHidden({ timeout: 5_000 });
  });

  test('Lightbox mode — lightbox contains a YouTube iframe with autoplay', async ({ page }) => {
    await visitFrontend(page, SLUG_LIGHTBOX);
    await expect(page.locator('.ep-cinematic-preview').first()).toBeVisible({ timeout: 30_000 });
    await page.locator('.ep-cp-btn-play').first().click();
    await expect(page.locator('.ep-cp-lightbox').first()).toBeVisible({ timeout: 10_000 });
    const lightboxIframe = page.locator('.ep-cp-lightbox-frame iframe').first();
    await expect(lightboxIframe).toBeVisible({ timeout: 10_000 });
    const src = await lightboxIframe.getAttribute('src') ?? '';
    expect(src).toContain('youtube');
    expect(src).toContain('autoplay=1');
  });

});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 4 — Badge colours
// ════════════════════════════════════════════════════════════════════════════

test.describe('Elementor Cinematic Preview — badge colours', () => {

  test('badge background colour is applied (#e53e3e)', async ({ page }) => {
    await visitFrontend(page, 'ep-elementor-cinematic-preview-badge-colors');
    await getOverlay(page);
    const badge = page.locator('.ep-cp-badges span').first();
    await expect(badge).toBeVisible();
    const bg = await badge.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // #e53e3e → rgb(229, 62, 62)
    expect(bg).toBe('rgb(229, 62, 62)');
  });

  test('badge text colour is applied (#ffffff)', async ({ page }) => {
    await visitFrontend(page, 'ep-elementor-cinematic-preview-badge-colors');
    await getOverlay(page);
    const badge = page.locator('.ep-cp-badges span').first();
    const color = await badge.evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 255, 255)');
  });

});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 5 — Button colours
// ════════════════════════════════════════════════════════════════════════════

test.describe('Elementor Cinematic Preview — button colours', () => {

  test('Play button background colour is applied (#38a169)', async ({ page }) => {
    await visitFrontend(page, 'ep-elementor-cinematic-preview-button-colors');
    await getOverlay(page);
    const btn = page.locator('.ep-cp-btn-play').first();
    await expect(btn).toBeVisible();
    const bg = await btn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // #38a169 → rgb(56, 161, 105)
    expect(bg).toBe('rgb(56, 161, 105)');
  });

  test('Play button text colour is applied (#ffffff)', async ({ page }) => {
    await visitFrontend(page, 'ep-elementor-cinematic-preview-button-colors');
    await getOverlay(page);
    const btn = page.locator('.ep-cp-btn-play').first();
    const color = await btn.evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 255, 255)');
  });

  test('Info button background colour is applied (#3182ce)', async ({ page }) => {
    await visitFrontend(page, 'ep-elementor-cinematic-preview-button-colors');
    await getOverlay(page);
    const btn = page.locator('.ep-cp-btn-info').first();
    await expect(btn).toBeVisible();
    const bg = await btn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // #3182ce → rgb(49, 130, 206)
    expect(bg).toBe('rgb(49, 130, 206)');
  });

  test('Info button text colour is applied (#ffffff)', async ({ page }) => {
    await visitFrontend(page, 'ep-elementor-cinematic-preview-button-colors');
    await getOverlay(page);
    const btn = page.locator('.ep-cp-btn-info').first();
    const color = await btn.evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 255, 255)');
  });

});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 6 — Font family
// ════════════════════════════════════════════════════════════════════════════

test.describe('Elementor Cinematic Preview — font family', () => {

  test('custom font family (Georgia) is applied to title element', async ({ page }) => {
    await visitFrontend(page, 'ep-elementor-cinematic-preview-font-family');
    await getOverlay(page);
    const title = page.locator('.ep-cp-title').first();
    await expect(title).toBeVisible();
    const ff = await title.evaluate((el) => window.getComputedStyle(el).fontFamily);
    expect(ff.toLowerCase()).toContain('georgia');
  });

});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 7 — Meta line override
// ════════════════════════════════════════════════════════════════════════════

test.describe('Elementor Cinematic Preview — meta line override', () => {

  test('meta line override replaces structured fields', async ({ page }) => {
    await visitFrontend(page, 'ep-elementor-cinematic-preview-meta-override');
    await getOverlay(page);
    const meta = page.locator('.ep-cp-meta');
    await expect(meta).toBeVisible();
    await expect(meta).toContainText('Overridden');
    await expect(meta).toContainText('Custom Meta Line');
  });

  test('override renders as a single span (not individual structured items)', async ({ page }) => {
    await visitFrontend(page, 'ep-elementor-cinematic-preview-meta-override');
    await getOverlay(page);
    const meta = page.locator('.ep-cp-meta');
    await expect(meta).toBeVisible();
    const spans = meta.locator('span');
    const count = await spans.count();
    expect(count).toBe(1);
  });

});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 8 — Logo as Title style
// ════════════════════════════════════════════════════════════════════════════

test.describe('Elementor Cinematic Preview — logo-as-title style', () => {

  test('overlay has data-style="logo-as-title"', async ({ page }) => {
    await visitFrontend(page, 'ep-elementor-cinematic-preview-logo-as-title');
    const overlay = await getOverlay(page);
    await expect(overlay).toHaveAttribute('data-style', 'logo-as-title');
  });

  test('overlay has .ep-cp-has-logo class when logo is set', async ({ page }) => {
    await visitFrontend(page, 'ep-elementor-cinematic-preview-logo-as-title');
    const overlay = await getOverlay(page);
    await expect(overlay).toHaveClass(/ep-cp-has-logo/);
  });

  test('logo img element renders with correct src', async ({ page }) => {
    await visitFrontend(page, 'ep-elementor-cinematic-preview-logo-as-title');
    await getOverlay(page);
    const logo = page.locator('.ep-cinematic-preview .ep-cp-logo').first();
    await expect(logo).toBeVisible();
    const src = await logo.getAttribute('src') ?? '';
    expect(src).toContain('pdf-thumb-sample-2.png');
  });

  test('title text element is NOT rendered (logo replaces it)', async ({ page }) => {
    await visitFrontend(page, 'ep-elementor-cinematic-preview-logo-as-title');
    await getOverlay(page);
    const title = page.locator('.ep-cinematic-preview .ep-cp-title');
    await expect(title).toHaveCount(0);
  });

  test('Play button is still present in logo-as-title style', async ({ page }) => {
    await visitFrontend(page, 'ep-elementor-cinematic-preview-logo-as-title');
    await getOverlay(page);
    await expect(page.locator('.ep-cp-btn-play').first()).toBeVisible();
  });

});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 9 — Custom thumbnail
// ════════════════════════════════════════════════════════════════════════════

test.describe('Elementor Cinematic Preview — custom thumbnail', () => {

  test('overlay background-image uses the custom poster URL', async ({ page }) => {
    await visitFrontend(page, 'ep-elementor-cinematic-preview-thumbnail');
    const overlay = await getOverlay(page);
    const bg = await overlay.evaluate((el) => window.getComputedStyle(el).backgroundImage);
    expect(bg).toContain('pdf-thumb-sample-2.png');
  });

});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 10 — Synopsis colour (Elementor CSS injection)
// ════════════════════════════════════════════════════════════════════════════

test.describe('Elementor Cinematic Preview — synopsis colour (CSS injection)', () => {

  test('synopsis colour (#ff69b4) is applied via Elementor selectors', async ({ page }) => {
    await visitFrontend(page, 'ep-elementor-cinematic-preview-synopsis-color');
    await getOverlay(page);
    const syn = page.locator('.ep-cp-synopsis').first();
    await expect(syn).toBeVisible();
    const color = await syn.evaluate((el) => window.getComputedStyle(el).color);
    // #ff69b4 → rgb(255, 105, 180)
    expect(color).toBe('rgb(255, 105, 180)');
  });

  test('synopsis font-size (18px) is applied via Elementor typography selector', async ({ page }) => {
    await visitFrontend(page, 'ep-elementor-cinematic-preview-synopsis-color');
    await getOverlay(page);
    const syn = page.locator('.ep-cp-synopsis').first();
    const fs = await syn.evaluate((el) => window.getComputedStyle(el).fontSize);
    expect(fs).toBe('18px');
  });

});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 11 — Overlay opacity (Elementor CSS injection)
// ════════════════════════════════════════════════════════════════════════════

test.describe('Elementor Cinematic Preview — overlay opacity (CSS injection)', () => {

  test('overlay opacity (50%) is applied via Elementor slider selector', async ({ page }) => {
    await visitFrontend(page, 'ep-elementor-cinematic-preview-overlay-opacity');
    await getOverlay(page);
    const overlayInner = page.locator('.ep-cp-overlay').first();
    await expect(overlayInner).toBeVisible({ timeout: 10_000 });
    const opacity = await overlayInner.evaluate((el) => window.getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeCloseTo(0.5, 1);
  });

  test('overlay tint colour (#ff0000) is applied via Elementor color selector', async ({ page }) => {
    await visitFrontend(page, 'ep-elementor-cinematic-preview-overlay-opacity');
    await getOverlay(page);
    const overlayInner = page.locator('.ep-cp-overlay').first();
    const bg = await overlayInner.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // #ff0000 → rgb(255, 0, 0)
    expect(bg).toBe('rgb(255, 0, 0)');
  });

});
