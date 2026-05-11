/**
 * Cinematic Preview — Extended test suite
 * Covers: badge colors, button colors, font family, meta line override,
 * logo-as-title style, custom thumbnail, synopsis color bug repro,
 * overlay opacity bug repro, Gutenberg editor inspector controls (1 worker).
 */

import { test, expect, Page } from '@playwright/test';

const YT_VIDEO_ID = '5zWTInJqD5k';
const YT_VIDEO_URL = 'https://www.youtube.com/watch?v=5zWTInJqD5k';
const LOGO_URL = 'http://localhost:8080/wp-content/uploads/2026/05/pdf-thumb-sample-2.png';
const CANVAS = 'iframe[name="editor-canvas"]';

async function visitFrontend(page: Page, slug: string) {
  const res = await page.goto(`/${slug}/`, { waitUntil: 'load' });
  expect(res?.ok(), `HTTP ${res?.status()} for /${slug}/`).toBeTruthy();
}

async function waitForOverlay(page: Page) {
  const overlay = page.locator('.ep-cinematic-preview').first();
  await expect(overlay).toBeVisible({ timeout: 30_000 });
  return overlay;
}

// ── editor helpers ────────────────────────────────────────────────────────────

async function openNewPost(page: Page) {
  await page.goto('/wp-admin/post-new.php', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('button[aria-label="Block Inserter"]')).toBeVisible({ timeout: 20_000 });
  const dismiss = page.locator('button[aria-label="Close"], .edit-post-welcome-guide button').first();
  if (await dismiss.isVisible({ timeout: 3_000 }).catch(() => false)) await dismiss.click();
}

async function insertAndEmbedBlock(page: Page, url: string) {
  await page.locator('button[aria-label="Block Inserter"]').click();
  const search = page.locator('.block-editor-inserter__search input, .components-search-control__input, input[placeholder="Search"]').first();
  await expect(search).toBeVisible({ timeout: 10_000 });
  await search.fill('EmbedPress');
  await page.locator('.editor-block-list-item-embedpress-embedpress, button:has-text("EmbedPress")').first().click();
  const canvas = page.frameLocator(CANVAS);
  const urlInput = canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first();
  await expect(urlInput).toBeVisible({ timeout: 30_000 });
  await urlInput.fill(url);
  await canvas.locator('button:has-text("Embed")').first().click();
  await expect(canvas.locator(`iframe[src*="${YT_VIDEO_ID}"], iframe[src*="youtube.com/embed"]`).first()).toBeAttached({ timeout: 30_000 });
}

async function openInspector(page: Page) {
  const btn = page.locator('button[aria-label="Settings"]').first();
  if ((await btn.getAttribute('aria-expanded').catch(() => null)) !== 'true') await btn.click();
  await expect(page.locator('.block-editor-block-inspector, .interface-complementary-area').first()).toBeVisible({ timeout: 10_000 });
}

async function openCinematicPanel(page: Page) {
  const inspector = page.locator('.block-editor-block-inspector');
  const btn = inspector.locator('button.components-button:has-text("Cinematic Preview")').first();
  await expect(btn).toBeVisible({ timeout: 15_000 });
  if ((await btn.getAttribute('aria-expanded').catch(() => null)) !== 'true') await btn.click();
}

async function enableCinematicToggle(page: Page) {
  const toggle = page.locator('.ep-cinematic-preview-controls input[type="checkbox"]').first();
  if (!(await toggle.isChecked())) {
    await toggle.evaluate((el: HTMLInputElement) => el.click());
  }
  await expect(toggle).toBeChecked({ timeout: 5_000 });
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION 1 — Badge colors
// ════════════════════════════════════════════════════════════════════════════

test.describe('Cinematic Preview — badge colors', () => {

  test('badge background color CSS var is applied', async ({ page }) => {
    await visitFrontend(page, 'cinematic-preview-badge-colors');
    await waitForOverlay(page);
    const badge = page.locator('.ep-cp-badges span').first();
    await expect(badge).toBeVisible();
    const bg = await badge.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // #e53e3e → rgb(229, 62, 62)
    expect(bg).toBe('rgb(229, 62, 62)');
  });

  test('badge text color CSS var is applied', async ({ page }) => {
    await visitFrontend(page, 'cinematic-preview-badge-colors');
    await waitForOverlay(page);
    const badge = page.locator('.ep-cp-badges span').first();
    const color = await badge.evaluate((el) => window.getComputedStyle(el).color);
    // #ffffff → rgb(255, 255, 255)
    expect(color).toBe('rgb(255, 255, 255)');
  });

});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 2 — Play & Info button colors
// ════════════════════════════════════════════════════════════════════════════

test.describe('Cinematic Preview — button colors', () => {

  test('Play button background color CSS var is applied', async ({ page }) => {
    await visitFrontend(page, 'cinematic-preview-button-colors');
    await waitForOverlay(page);
    const btn = page.locator('.ep-cp-btn-play').first();
    await expect(btn).toBeVisible();
    const bg = await btn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // #38a169 → rgb(56, 161, 105)
    expect(bg).toBe('rgb(56, 161, 105)');
  });

  test('Play button text color CSS var is applied', async ({ page }) => {
    await visitFrontend(page, 'cinematic-preview-button-colors');
    await waitForOverlay(page);
    const btn = page.locator('.ep-cp-btn-play').first();
    const color = await btn.evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 255, 255)');
  });

  test('Info button background color CSS var is applied', async ({ page }) => {
    await visitFrontend(page, 'cinematic-preview-button-colors');
    await waitForOverlay(page);
    const btn = page.locator('.ep-cp-btn-info').first();
    await expect(btn).toBeVisible();
    const bg = await btn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // #3182ce → rgb(49, 130, 206)
    expect(bg).toBe('rgb(49, 130, 206)');
  });

  test('Info button text color CSS var is applied', async ({ page }) => {
    await visitFrontend(page, 'cinematic-preview-button-colors');
    await waitForOverlay(page);
    const btn = page.locator('.ep-cp-btn-info').first();
    const color = await btn.evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 255, 255)');
  });

});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 3 — Font Family
// ════════════════════════════════════════════════════════════════════════════

test.describe('Cinematic Preview — font family', () => {

  test('custom font family is applied to title element', async ({ page }) => {
    await visitFrontend(page, 'cinematic-preview-font-family');
    await waitForOverlay(page);
    const title = page.locator('.ep-cp-title').first();
    await expect(title).toBeVisible();
    const ff = await title.evaluate((el) => window.getComputedStyle(el).fontFamily);
    // 'Georgia, serif' — browser may quote/normalise but must contain Georgia
    expect(ff.toLowerCase()).toContain('georgia');
  });

});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 4 — Meta Line override
// ════════════════════════════════════════════════════════════════════════════

test.describe('Cinematic Preview — meta line override', () => {

  test('meta line override replaces structured fields', async ({ page }) => {
    await visitFrontend(page, 'cinematic-preview-meta-override');
    await waitForOverlay(page);
    const meta = page.locator('.ep-cp-meta');
    await expect(meta).toBeVisible();
    // The override text should appear
    await expect(meta).toContainText('Overridden');
    await expect(meta).toContainText('Custom Meta Line');
  });

  test('structured fields (Year/Rating etc.) are NOT individually rendered when meta override is set', async ({ page }) => {
    await visitFrontend(page, 'cinematic-preview-meta-override');
    await waitForOverlay(page);
    const meta = page.locator('.ep-cp-meta');
    await expect(meta).toBeVisible();
    // Override is a single freeform span — should NOT see individual structured items
    const spans = meta.locator('span');
    const count = await spans.count();
    // Override mode renders exactly 1 span wrapping the freeform text
    expect(count).toBe(1);
  });

});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 5 — Logo as Title style
// ════════════════════════════════════════════════════════════════════════════

test.describe('Cinematic Preview — logo-as-title style', () => {

  test('overlay has data-style="logo-as-title"', async ({ page }) => {
    await visitFrontend(page, 'cinematic-preview-logo-as-title');
    const overlay = await waitForOverlay(page);
    await expect(overlay).toHaveAttribute('data-style', 'logo-as-title');
  });

  test('overlay has ep-cp-has-logo class when logo is set', async ({ page }) => {
    await visitFrontend(page, 'cinematic-preview-logo-as-title');
    const overlay = await waitForOverlay(page);
    await expect(overlay).toHaveClass(/ep-cp-has-logo/);
  });

  test('logo img element is rendered inside the overlay', async ({ page }) => {
    await visitFrontend(page, 'cinematic-preview-logo-as-title');
    await waitForOverlay(page);
    const logo = page.locator('.ep-cinematic-preview .ep-cp-logo').first();
    await expect(logo).toBeVisible();
    const src = await logo.getAttribute('src') ?? '';
    expect(src).toContain('pdf-thumb-sample-2.png');
  });

  test('title text element is NOT rendered (logo replaces it in logo-as-title mode)', async ({ page }) => {
    await visitFrontend(page, 'cinematic-preview-logo-as-title');
    await waitForOverlay(page);
    // In logo-as-title mode the img takes the place of the h2 title
    const title = page.locator('.ep-cinematic-preview .ep-cp-title');
    await expect(title).toHaveCount(0);
  });

  test('Play button is still present in logo-as-title style', async ({ page }) => {
    await visitFrontend(page, 'cinematic-preview-logo-as-title');
    await waitForOverlay(page);
    await expect(page.locator('.ep-cp-btn-play').first()).toBeVisible();
  });

});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 6 — Custom Thumbnail (cinematic poster)
// ════════════════════════════════════════════════════════════════════════════

test.describe('Cinematic Preview — custom thumbnail', () => {

  test('overlay background-image uses the custom thumbnail URL', async ({ page }) => {
    await visitFrontend(page, 'cinematic-preview-thumbnail');
    const overlay = await waitForOverlay(page);
    const bg = await overlay.evaluate((el) => window.getComputedStyle(el).backgroundImage);
    expect(bg).toContain('pdf-thumb-sample-2.png');
  });

});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 7 — Synopsis color bug repro (isolated)
// ════════════════════════════════════════════════════════════════════════════

test.describe('Cinematic Preview — synopsis color (bug repro)', () => {

  test('synopsis color CSS var (#ff69b4) is applied to .ep-cp-synopsis', async ({ page }) => {
    await visitFrontend(page, 'cinematic-preview-synopsis-color');
    await waitForOverlay(page);
    const syn = page.locator('.ep-cp-synopsis').first();
    await expect(syn).toBeVisible();
    const color = await syn.evaluate((el) => window.getComputedStyle(el).color);
    // #ff69b4 → rgb(255, 105, 180)
    expect(color).toBe('rgb(255, 105, 180)');
  });

  test('synopsis font size (18px) is applied', async ({ page }) => {
    await visitFrontend(page, 'cinematic-preview-synopsis-color');
    await waitForOverlay(page);
    const syn = page.locator('.ep-cp-synopsis').first();
    const fs = await syn.evaluate((el) => window.getComputedStyle(el).fontSize);
    expect(fs).toBe('18px');
  });

});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 8 — Overlay opacity bug repro (with both color + opacity set)
// ════════════════════════════════════════════════════════════════════════════

test.describe('Cinematic Preview — overlay opacity (bug repro)', () => {

  test('overlay opacity (50%) is applied when overlay color is also set', async ({ page }) => {
    await visitFrontend(page, 'cinematic-preview-overlay-opacity');
    await waitForOverlay(page);
    const overlayInner = page.locator('.ep-cp-overlay').first();
    await expect(overlayInner).toBeVisible({ timeout: 10_000 });
    const opacity = await overlayInner.evaluate((el) => window.getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeCloseTo(0.5, 1);
  });

  test('overlay tint color (#ff0000) is applied to .ep-cp-overlay background', async ({ page }) => {
    await visitFrontend(page, 'cinematic-preview-overlay-opacity');
    await waitForOverlay(page);
    const overlayInner = page.locator('.ep-cp-overlay').first();
    const bg = await overlayInner.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // #ff0000 → rgb(255, 0, 0)
    expect(bg).toBe('rgb(255, 0, 0)');
  });

});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 9 — Gutenberg editor inspector controls (sequential, 30s timeout)
// ════════════════════════════════════════════════════════════════════════════

test.describe('Cinematic Preview — editor inspector (all controls)', () => {
  test.describe.configure({ mode: 'serial' });

  test('Preview Style has all 6 options', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openCinematicPanel(page);
    await enableCinematicToggle(page);

    const selects = page.locator('.ep-cinematic-preview-controls select');
    const styleSelect = selects.first();
    const opts = await styleSelect.locator('option').allTextContents();
    expect(opts).toContain('Netflix Hero');
    expect(opts).toContain('Prime Video');
    expect(opts).toContain('Disney+');
    expect(opts).toContain('Apple TV+ Cinematic');
    expect(opts).toContain('Minimal');
    expect(opts).toContain('Logo as Title');
  });

  test('Play Action has Inline and Lightbox options', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openCinematicPanel(page);
    await enableCinematicToggle(page);

    const selects = page.locator('.ep-cinematic-preview-controls select');
    const count = await selects.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const opts = await selects.nth(i).locator('option').allTextContents();
      if (opts.some(t => /inline/i.test(t))) {
        expect(opts.some(t => /lightbox/i.test(t))).toBeTruthy();
        found = true;
        break;
      }
    }
    expect(found).toBeTruthy();
  });

  test('Font Weight SelectControl has Bold and Extra-Bold', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openCinematicPanel(page);
    await enableCinematicToggle(page);

    const selects = page.locator('.ep-cinematic-preview-controls select');
    const count = await selects.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const opts = await selects.nth(i).locator('option').allTextContents();
      if (opts.some(t => t.includes('700'))) {
        expect(opts.some(t => t.includes('800'))).toBeTruthy();
        found = true;
        break;
      }
    }
    expect(found).toBeTruthy();
  });

  test('Title TextControl visible and accepts input', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openCinematicPanel(page);
    await enableCinematicToggle(page);

    const input = page.locator('.ep-cinematic-preview-controls input[type="text"]').first();
    await expect(input).toBeVisible();
    await input.fill('Test Title Input');
    await expect(input).toHaveValue('Test Title Input');
  });

  test('Synopsis TextareaControl visible and accepts input', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openCinematicPanel(page);
    await enableCinematicToggle(page);

    const ta = page.locator('.ep-cinematic-preview-controls textarea').first();
    await expect(ta).toBeVisible();
    await ta.fill('Test synopsis text.');
    await expect(ta).toHaveValue('Test synopsis text.');
  });

  test('Meta labels: Year, Age Rating, Duration, Genre, Meta Line', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openCinematicPanel(page);
    await enableCinematicToggle(page);

    const inspector = page.locator('.block-editor-block-inspector');
    for (const label of ['Year', 'Age Rating', 'Duration', 'Genre', 'Meta Line']) {
      await expect(inspector.locator(`label:has-text("${label}")`).first()).toBeVisible();
    }
  });

  test('Badges TextControl is present', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openCinematicPanel(page);
    await enableCinematicToggle(page);

    await expect(
      page.locator('.block-editor-block-inspector label:has-text("Badges")').first()
    ).toBeVisible();
  });

  test('ColorPalette controls count ≥ 5', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openCinematicPanel(page);
    await enableCinematicToggle(page);

    const palettes = page.locator('.ep-cinematic-preview-controls .components-color-palette, .ep-cinematic-preview-controls .components-circular-option-picker');
    const count = await palettes.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('RangeControls count ≥ 3 (title size, synopsis size, overlay opacity)', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openCinematicPanel(page);
    await enableCinematicToggle(page);

    const ranges = page.locator('.ep-cinematic-preview-controls input[type="range"]');
    await expect(ranges.first()).toBeVisible();
    const count = await ranges.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('Upload Thumbnail and Upload Logo buttons are present', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openCinematicPanel(page);
    await enableCinematicToggle(page);

    await expect(page.locator('.ep-cinematic-preview-controls button:has-text("Upload Thumbnail")').first()).toBeVisible();
    await expect(page.locator('.ep-cinematic-preview-controls button:has-text("Upload Logo")').first()).toBeVisible();
  });

});
