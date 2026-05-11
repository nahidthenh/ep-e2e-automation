/**
 * Cinematic Preview — Gutenberg comprehensive test suite
 *
 * Tests every control in the Cinematic Preview panel by:
 *   1. Checking front-end rendering of pre-seeded pages (reliable DOM assertions)
 *   2. Checking the Gutenberg editor shows all controls in the inspector
 *   3. Verifying interactive front-end behaviour (Play inline, Lightbox, Info toggle)
 */

import { test, expect, Page } from '@playwright/test';

const YT_VIDEO_URL = 'https://www.youtube.com/watch?v=5zWTInJqD5k';
const YT_VIDEO_ID  = '5zWTInJqD5k';

// Slugs created via WP-CLI during setup
const SLUG_NETFLIX   = 'cinematic-preview';
const SLUG_PRIME     = 'cinematic-preview-prime-video';
const SLUG_DISNEY    = 'cinematic-preview-disney-plus';
const SLUG_APPLE     = 'cinematic-preview-apple-tv-cinematic';
const SLUG_MINIMAL   = 'cinematic-preview-minimal';
const SLUG_LIGHTBOX  = 'cinematic-preview-lightbox';

const CANVAS = 'iframe[name="editor-canvas"]';

// ── front-end helpers ────────────────────────────────────────────────────────

async function visitFrontend(page: Page, slug: string) {
  const res = await page.goto(`/${slug}/`, { waitUntil: 'load' });
  expect(res?.ok(), `HTTP ${res?.status()} for /${slug}/`).toBeTruthy();
}

async function getOverlay(page: Page) {
  // The overlay is appended directly inside .ep-embed-content-wraper
  const overlay = page.locator('.ep-cinematic-preview').first();
  await expect(overlay).toBeVisible({ timeout: 30_000 });
  return overlay;
}

// ── editor helpers ───────────────────────────────────────────────────────────

async function openNewPost(page: Page) {
  await page.goto('/wp-admin/post-new.php', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('button[aria-label="Block Inserter"]')).toBeVisible({ timeout: 20_000 });
  const dismiss = page.locator('button[aria-label="Close"], .edit-post-welcome-guide button').first();
  if (await dismiss.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await dismiss.click();
  }
}

async function insertAndEmbedBlock(page: Page, url: string) {
  await page.locator('button[aria-label="Block Inserter"]').click();
  const searchInput = page.locator(
    '.block-editor-inserter__search input, .components-search-control__input, input[placeholder="Search"]'
  ).first();
  await expect(searchInput).toBeVisible({ timeout: 10_000 });
  await searchInput.fill('EmbedPress');
  await page.locator('.editor-block-list-item-embedpress-embedpress, button:has-text("EmbedPress")').first().click();

  const canvas = page.frameLocator(CANVAS);
  const urlInput = canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first();
  await expect(urlInput).toBeVisible({ timeout: 15_000 });
  await urlInput.fill(url);
  await canvas.locator('button:has-text("Embed")').first().click();
  // Wait for iframe to be produced
  await expect(
    canvas.locator(`iframe[src*="${YT_VIDEO_ID}"], iframe[src*="youtube.com/embed"]`).first()
  ).toBeAttached({ timeout: 30_000 });
}

async function openInspector(page: Page) {
  const settingsBtn = page.locator('button[aria-label="Settings"]').first();
  if ((await settingsBtn.getAttribute('aria-expanded').catch(() => null)) !== 'true') {
    await settingsBtn.click();
  }
  await expect(
    page.locator('.block-editor-block-inspector, .interface-complementary-area').first()
  ).toBeVisible({ timeout: 10_000 });
}

async function openPanel(page: Page, panelTitle: string) {
  const inspector = page.locator('.block-editor-block-inspector');
  // Find collapsed panel button by its title text and click to expand
  const btn = inspector.locator(`button.components-button:has-text("${panelTitle}")`).first();
  await expect(btn).toBeVisible({ timeout: 15_000 });
  const expanded = await btn.getAttribute('aria-expanded').catch(() => null);
  if (expanded !== 'true') await btn.click();
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION 1 — Front-end rendering: structural checks
// ════════════════════════════════════════════════════════════════════════════

test.describe('Cinematic Preview — front-end structure', () => {

  test('overlay is rendered on the Netflix Hero page', async ({ page }) => {
    await visitFrontend(page, SLUG_NETFLIX);
    const overlay = await getOverlay(page);
    await expect(overlay).toHaveAttribute('data-style', 'netflix-hero');
  });

  test('wrapper gets .ep-cp-active class when cinematic preview is on', async ({ page }) => {
    await visitFrontend(page, SLUG_NETFLIX);
    await expect(page.locator('.ep-embed-content-wraper.ep-cp-active').first()).toBeVisible({ timeout: 30_000 });
  });

  test('Play button is present', async ({ page }) => {
    await visitFrontend(page, SLUG_NETFLIX);
    await getOverlay(page);
    await expect(page.locator('.ep-cp-btn-play').first()).toBeVisible();
  });

  test('More Info button is present when synopsis is set', async ({ page }) => {
    await visitFrontend(page, SLUG_NETFLIX);
    await getOverlay(page);
    await expect(page.locator('.ep-cp-btn-info').first()).toBeVisible();
  });

  test('title text is rendered in the overlay', async ({ page }) => {
    await visitFrontend(page, SLUG_NETFLIX);
    await getOverlay(page);
    await expect(page.locator('.ep-cp-title').first()).toBeVisible();
    const titleText = await page.locator('.ep-cp-title').first().textContent();
    expect(titleText?.trim().length).toBeGreaterThan(0);
  });

  test('synopsis text is rendered in the overlay', async ({ page }) => {
    await visitFrontend(page, SLUG_NETFLIX);
    await getOverlay(page);
    await expect(page.locator('.ep-cp-synopsis').first()).toBeVisible();
    const synText = await page.locator('.ep-cp-synopsis').first().textContent();
    expect(synText?.trim().length).toBeGreaterThan(0);
  });

  test('badge chips are rendered (NEW, HD, 4K)', async ({ page }) => {
    await visitFrontend(page, SLUG_NETFLIX);
    await getOverlay(page);
    const badges = page.locator('.ep-cp-badges span');
    await expect(badges).toHaveCount(3, { timeout: 10_000 });
    await expect(badges.nth(0)).toContainText('NEW');
    await expect(badges.nth(1)).toContainText('HD');
    await expect(badges.nth(2)).toContainText('4K');
  });

  test('meta row contains Year, Rating, Duration, Genre', async ({ page }) => {
    await visitFrontend(page, SLUG_NETFLIX);
    await getOverlay(page);
    const meta = page.locator('.ep-cp-meta');
    await expect(meta).toBeVisible();
    await expect(meta).toContainText('2024');
    await expect(meta).toContainText('PG');
    await expect(meta).toContainText('5m 36s');
    await expect(meta).toContainText('Technology');
  });

  test('overlay gradient background is set', async ({ page }) => {
    await visitFrontend(page, SLUG_NETFLIX);
    const overlay = await getOverlay(page);
    const bg = await overlay.evaluate((el) => window.getComputedStyle(el).backgroundImage);
    // Should have either a poster url() or a gradient
    expect(bg).not.toBe('none');
  });

  test('title custom CSS vars are applied (color, font-size, font-weight)', async ({ page }) => {
    await visitFrontend(page, SLUG_NETFLIX);
    await getOverlay(page);
    const titleEl = page.locator('.ep-cp-title').first();
    await expect(titleEl).toBeVisible();
    const color = await titleEl.evaluate((el) => window.getComputedStyle(el).color);
    // #ffffff → rgb(255, 255, 255)
    expect(color).toBe('rgb(255, 255, 255)');
    const fontSize = await titleEl.evaluate((el) => window.getComputedStyle(el).fontSize);
    // 48px custom
    expect(fontSize).toBe('48px');
    const fontWeight = await titleEl.evaluate((el) => window.getComputedStyle(el).fontWeight);
    expect(fontWeight).toBe('700');
  });

  test('synopsis custom CSS vars are applied (color, font-size)', async ({ page }) => {
    await visitFrontend(page, SLUG_NETFLIX);
    await getOverlay(page);
    const synEl = page.locator('.ep-cp-synopsis').first();
    const color = await synEl.evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe('rgb(224, 224, 224)');
    const fontSize = await synEl.evaluate((el) => window.getComputedStyle(el).fontSize);
    expect(fontSize).toBe('16px');
  });

  test('overlay opacity CSS var is applied (60%)', async ({ page }) => {
    await visitFrontend(page, SLUG_NETFLIX);
    const overlayInner = page.locator('.ep-cp-overlay').first();
    await expect(overlayInner).toBeVisible({ timeout: 30_000 });
    const opacity = await overlayInner.evaluate((el) => window.getComputedStyle(el).opacity);
    // 60 / 100 = 0.6
    expect(parseFloat(opacity)).toBeCloseTo(0.6, 1);
  });

  test('YouTube iframe is in the DOM behind the overlay', async ({ page }) => {
    await visitFrontend(page, SLUG_NETFLIX);
    await getOverlay(page);
    const iframe = page.locator(`.ep-embed-content-wraper iframe[src*="${YT_VIDEO_ID}"]`).first();
    await expect(iframe).toBeAttached({ timeout: 20_000 });
  });

});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 2 — Style variants
// ════════════════════════════════════════════════════════════════════════════

test.describe('Cinematic Preview — style variants', () => {

  const styles: Array<{ slug: string; style: string; label: string }> = [
    { slug: SLUG_NETFLIX,  style: 'netflix-hero',       label: 'Netflix Hero' },
    { slug: SLUG_PRIME,    style: 'prime-video',        label: 'Prime Video' },
    { slug: SLUG_DISNEY,   style: 'disney-plus',        label: 'Disney+' },
    { slug: SLUG_APPLE,    style: 'apple-tv-cinematic', label: 'Apple TV+ Cinematic' },
    { slug: SLUG_MINIMAL,  style: 'minimal',            label: 'Minimal' },
  ];

  for (const { slug, style, label } of styles) {
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

test.describe('Cinematic Preview — interactive behaviour', () => {

  test('Play (inline) — overlay hides after clicking Play', async ({ page }) => {
    await visitFrontend(page, SLUG_NETFLIX);
    const overlay = await getOverlay(page);
    await page.locator('.ep-cp-btn-play').first().click();
    // Overlay should get ep-cp-hidden or wrapper loses ep-cp-active
    await expect(
      page.locator('.ep-embed-content-wraper.ep-cp-active').first()
    ).toBeHidden({ timeout: 10_000 });
  });

  test('More Info toggle — clicking Info button opens synopsis panel', async ({ page }) => {
    await visitFrontend(page, SLUG_NETFLIX);
    const overlay = await getOverlay(page);
    const infoBtn = page.locator('.ep-cp-btn-info').first();
    await expect(infoBtn).toBeVisible();
    await infoBtn.click();
    await expect(overlay).toHaveClass(/ep-cp-info-open/, { timeout: 5_000 });
  });

  test('More Info toggle — clicking Info button again closes the panel', async ({ page }) => {
    await visitFrontend(page, SLUG_NETFLIX);
    const overlay = await getOverlay(page);
    const infoBtn = page.locator('.ep-cp-btn-info').first();
    await infoBtn.click(); // open
    await infoBtn.click(); // close
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

  test('Lightbox mode — lightbox contains a fresh YouTube iframe with autoplay', async ({ page }) => {
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
// SECTION 4 — Gutenberg editor controls
// ════════════════════════════════════════════════════════════════════════════

test.describe('Cinematic Preview — Gutenberg editor controls', () => {

  test('Cinematic Preview panel exists in inspector for YouTube embed', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openPanel(page, 'Cinematic Preview');
    const inspector = page.locator('.block-editor-block-inspector');
    await expect(inspector.locator('.ep-cinematic-preview-controls').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Enable Cinematic Preview toggle renders content controls when turned on', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openPanel(page, 'Cinematic Preview');
    const toggle = page.locator('.ep-cinematic-preview-controls .components-toggle-control').first();
    await expect(toggle).toBeVisible();
    const input = toggle.locator('input[type="checkbox"]');
    if (!(await input.isChecked())) {
      await toggle.locator('.components-toggle-control__label, label').first().click();
    }
    await expect(input).toBeChecked({ timeout: 5_000 });
    // After enabling, the SelectControl for style should appear
    await expect(
      page.locator('.ep-cinematic-preview-controls select, .ep-cinematic-preview-controls .components-select-control').first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Preview Style SelectControl has all 6 options', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openPanel(page, 'Cinematic Preview');

    // Enable the toggle
    const toggle = page.locator('.ep-cinematic-preview-controls input[type="checkbox"]').first();
    if (!(await toggle.isChecked())) {
      await toggle.evaluate((el: HTMLInputElement) => el.click());
    }
    await expect(toggle).toBeChecked({ timeout: 5_000 });

    const styleSelect = page.locator('.ep-cinematic-preview-controls select').first();
    await expect(styleSelect).toBeVisible();
    const options = await styleSelect.locator('option').allTextContents();
    expect(options).toContain('Netflix Hero');
    expect(options).toContain('Prime Video');
    expect(options).toContain('Disney+');
    expect(options).toContain('Apple TV+ Cinematic');
    expect(options).toContain('Minimal');
    expect(options).toContain('Logo as Title');
  });

  test('Play Action SelectControl has Inline and Lightbox options', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openPanel(page, 'Cinematic Preview');

    const toggle = page.locator('.ep-cinematic-preview-controls input[type="checkbox"]').first();
    if (!(await toggle.isChecked())) {
      await toggle.evaluate((el: HTMLInputElement) => el.click());
    }
    await expect(toggle).toBeChecked({ timeout: 5_000 });

    // The Play Action select is the second SelectControl in the panel
    const selects = page.locator('.ep-cinematic-preview-controls select');
    const count = await selects.count();
    expect(count).toBeGreaterThanOrEqual(2); // style + play action at minimum

    // Find the one that contains 'inline' / 'lightbox'
    let playActionSelect = null;
    for (let i = 0; i < count; i++) {
      const opts = await selects.nth(i).locator('option').allTextContents();
      if (opts.some(t => t.toLowerCase().includes('inline'))) {
        playActionSelect = selects.nth(i);
        break;
      }
    }
    expect(playActionSelect).not.toBeNull();
    const opts = await playActionSelect!.locator('option').allTextContents();
    expect(opts.some(t => t.toLowerCase().includes('inline'))).toBeTruthy();
    expect(opts.some(t => t.toLowerCase().includes('lightbox'))).toBeTruthy();
  });

  test('Title TextControl is visible and accepts input', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openPanel(page, 'Cinematic Preview');

    const toggle = page.locator('.ep-cinematic-preview-controls input[type="checkbox"]').first();
    if (!(await toggle.isChecked())) {
      await toggle.evaluate((el: HTMLInputElement) => el.click());
    }
    await expect(toggle).toBeChecked({ timeout: 5_000 });

    const titleInput = page.locator('.ep-cinematic-preview-controls input[type="text"]').first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill('My Test Title');
    await expect(titleInput).toHaveValue('My Test Title');
  });

  test('Synopsis TextareaControl is visible and accepts input', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openPanel(page, 'Cinematic Preview');

    const toggle = page.locator('.ep-cinematic-preview-controls input[type="checkbox"]').first();
    if (!(await toggle.isChecked())) {
      await toggle.evaluate((el: HTMLInputElement) => el.click());
    }
    await expect(toggle).toBeChecked({ timeout: 5_000 });

    const textarea = page.locator('.ep-cinematic-preview-controls textarea').first();
    await expect(textarea).toBeVisible();
    await textarea.fill('A test synopsis for the video.');
    await expect(textarea).toHaveValue('A test synopsis for the video.');
  });

  test('Upload Thumbnail button is present', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openPanel(page, 'Cinematic Preview');

    const toggle = page.locator('.ep-cinematic-preview-controls input[type="checkbox"]').first();
    if (!(await toggle.isChecked())) {
      await toggle.evaluate((el: HTMLInputElement) => el.click());
    }
    await expect(toggle).toBeChecked({ timeout: 5_000 });

    await expect(
      page.locator('.ep-cinematic-preview-controls button:has-text("Upload Thumbnail")').first()
    ).toBeVisible();
  });

  test('Upload Logo button is present', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openPanel(page, 'Cinematic Preview');

    const toggle = page.locator('.ep-cinematic-preview-controls input[type="checkbox"]').first();
    if (!(await toggle.isChecked())) {
      await toggle.evaluate((el: HTMLInputElement) => el.click());
    }
    await expect(toggle).toBeChecked({ timeout: 5_000 });

    await expect(
      page.locator('.ep-cinematic-preview-controls button:has-text("Upload Logo")').first()
    ).toBeVisible();
  });

  test('RangeControl for Title Font Size is present', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openPanel(page, 'Cinematic Preview');

    const toggle = page.locator('.ep-cinematic-preview-controls input[type="checkbox"]').first();
    if (!(await toggle.isChecked())) {
      await toggle.evaluate((el: HTMLInputElement) => el.click());
    }
    await expect(toggle).toBeChecked({ timeout: 5_000 });

    // Range controls render as input[type="range"] inside the panel
    const ranges = page.locator('.ep-cinematic-preview-controls input[type="range"]');
    await expect(ranges.first()).toBeVisible();
    const count = await ranges.count();
    // Title font size + synopsis font size + overlay opacity = at least 3
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('Font Weight SelectControl has Bold and Extra-Bold options', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openPanel(page, 'Cinematic Preview');

    const toggle = page.locator('.ep-cinematic-preview-controls input[type="checkbox"]').first();
    if (!(await toggle.isChecked())) {
      await toggle.evaluate((el: HTMLInputElement) => el.click());
    }
    await expect(toggle).toBeChecked({ timeout: 5_000 });

    const selects = page.locator('.ep-cinematic-preview-controls select');
    let fontWeightSelect = null;
    const count = await selects.count();
    for (let i = 0; i < count; i++) {
      const opts = await selects.nth(i).locator('option').allTextContents();
      if (opts.some(t => t.includes('Bold'))) {
        fontWeightSelect = selects.nth(i);
        break;
      }
    }
    expect(fontWeightSelect).not.toBeNull();
    const opts = await fontWeightSelect!.locator('option').allTextContents();
    expect(opts.some(t => t.includes('700'))).toBeTruthy();
    expect(opts.some(t => t.includes('800'))).toBeTruthy();
  });

  test('ColorPalette controls are present (title, synopsis, badge, overlay, play/info buttons)', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openPanel(page, 'Cinematic Preview');

    const toggle = page.locator('.ep-cinematic-preview-controls input[type="checkbox"]').first();
    if (!(await toggle.isChecked())) {
      await toggle.evaluate((el: HTMLInputElement) => el.click());
    }
    await expect(toggle).toBeChecked({ timeout: 5_000 });

    // Each ColorPalette renders a .components-color-palette element
    const palettes = page.locator('.ep-cinematic-preview-controls .components-color-palette, .ep-cinematic-preview-controls .components-circular-option-picker');
    const count = await palettes.count();
    // title color, synopsis color, badge bg, badge text, play bg, play text, info bg, info text, overlay tint = 9
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('Meta TextControls: Year, Age Rating, Duration, Genre, Meta Line', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openPanel(page, 'Cinematic Preview');

    const toggle = page.locator('.ep-cinematic-preview-controls input[type="checkbox"]').first();
    if (!(await toggle.isChecked())) {
      await toggle.evaluate((el: HTMLInputElement) => el.click());
    }
    await expect(toggle).toBeChecked({ timeout: 5_000 });

    const inspector = page.locator('.block-editor-block-inspector');
    await expect(inspector.locator('label:has-text("Year")').first()).toBeVisible();
    await expect(inspector.locator('label:has-text("Age Rating")').first()).toBeVisible();
    await expect(inspector.locator('label:has-text("Duration")').first()).toBeVisible();
    await expect(inspector.locator('label:has-text("Genre")').first()).toBeVisible();
    await expect(inspector.locator('label:has-text("Meta Line")').first()).toBeVisible();
  });

  test('Badges TextControl is present', async ({ page }) => {
    await openNewPost(page);
    await insertAndEmbedBlock(page, YT_VIDEO_URL);
    await openInspector(page);
    await openPanel(page, 'Cinematic Preview');

    const toggle = page.locator('.ep-cinematic-preview-controls input[type="checkbox"]').first();
    if (!(await toggle.isChecked())) {
      await toggle.evaluate((el: HTMLInputElement) => el.click());
    }
    await expect(toggle).toBeChecked({ timeout: 5_000 });

    const inspector = page.locator('.block-editor-block-inspector');
    await expect(inspector.locator('label:has-text("Badges")').first()).toBeVisible();
  });

});
