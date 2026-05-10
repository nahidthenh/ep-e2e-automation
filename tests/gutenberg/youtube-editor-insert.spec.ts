import { test, expect, FrameLocator } from '@playwright/test';

const YT_VIDEO_URL   = 'https://www.youtube.com/watch?v=5zWTInJqD5k';
const YT_CHANNEL_URL = 'https://www.youtube.com/@wpdeveloper';

// WP 7.0 renders block content inside an iframe named "editor-canvas".
// Toolbar, inserter panel, and sidebar live on the outer page.
const CANVAS = 'iframe[name="editor-canvas"]';

// ─── helpers ────────────────────────────────────────────────────────────────

async function openNewPost(page: import('@playwright/test').Page) {
  await page.goto('/wp-admin/post-new.php', { waitUntil: 'domcontentloaded' });
  // Wait for the top-bar inserter button — confirms the editor shell is ready
  await expect(page.locator('button[aria-label="Block Inserter"]')).toBeVisible({ timeout: 20_000 });

  // Dismiss welcome guide if present (lives on outer page)
  const dismiss = page.locator('button[aria-label="Close"], .edit-post-welcome-guide button').first();
  if (await dismiss.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await dismiss.click();
  }
}

async function insertEmbedPressBlock(page: import('@playwright/test').Page) {
  // Open the block inserter panel (outer page)
  await page.locator('button[aria-label="Block Inserter"]').click();

  // Search input lives in the inserter panel (outer page)
  const searchInput = page.locator(
    '.block-editor-inserter__search input, .components-search-control__input, input[placeholder="Search"]'
  ).first();
  await expect(searchInput).toBeVisible({ timeout: 10_000 });
  await searchInput.fill('EmbedPress');

  // Click the EmbedPress block tile
  const blockItem = page.locator(
    '.editor-block-list-item-embedpress-embedpress, ' +
    'button:has-text("EmbedPress")'
  ).first();
  await expect(blockItem).toBeVisible({ timeout: 10_000 });
  await blockItem.click();

  // After insertion, the block URL input appears inside the canvas iframe
  const canvas = page.frameLocator(CANVAS);
  const urlInput = canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first();
  await expect(urlInput).toBeVisible({ timeout: 15_000 });
}

async function fillAndEmbed(page: import('@playwright/test').Page, url: string) {
  const canvas = page.frameLocator(CANVAS);
  const urlInput = canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first();
  await expect(urlInput).toBeVisible({ timeout: 10_000 });
  await urlInput.fill(url);
  // Click the "Embed" button that sits next to the input
  await canvas.locator('button:has-text("Embed")').first().click();
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe('Gutenberg editor — YouTube block insertion (WP 7.0 RC-3)', () => {

  test('EmbedPress block appears in inserter search results', async ({ page }) => {
    await openNewPost(page);

    await page.locator('button[aria-label="Block Inserter"]').click();

    const searchInput = page.locator(
      '.block-editor-inserter__search input, .components-search-control__input, input[placeholder="Search"]'
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
    await searchInput.fill('EmbedPress');

    await expect(
      page.locator('.editor-block-list-item-embedpress-embedpress, button:has-text("EmbedPress")').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('EmbedPress block inserts and shows URL input placeholder in canvas', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);

    const canvas = page.frameLocator(CANVAS);

    // Input with "Enter URL to embed here..." placeholder must be present
    await expect(
      canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first()
    ).toBeVisible({ timeout: 15_000 });

    // "Embed" button next to the input
    await expect(canvas.locator('button:has-text("Embed")').first()).toBeVisible({ timeout: 5_000 });

    // Block header text
    await expect(
      canvas.locator('text=EmbedPress - Embed anything from 250+ sites').first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('YouTube URL accepted and embed renders preview in editor canvas', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, YT_VIDEO_URL);

    const canvas = page.frameLocator(CANVAS);

    // After clicking Embed, the block transitions to a preview state —
    // either a YouTube iframe or the EmbedPress wrapper (URL input gone)
    const rendered = canvas.locator(
      'iframe[src*="youtube"], iframe[src*="youtu.be"], ' +
      '.wp-block-embedpress-embedpress:not(:has(input)), ' +
      'figure.wp-block-embedpress-embedpress, ' +
      '.embedpress-wrapper'
    ).first();
    await expect(rendered).toBeVisible({ timeout: 30_000 });
  });

  test('Inspector sidebar loads and shows EmbedPress block card after URL submit', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, YT_VIDEO_URL);

    // Wait for the embed to render in canvas
    const canvas = page.frameLocator(CANVAS);
    await expect(
      canvas.locator('iframe[src*="youtube"], figure.wp-block-embedpress-embedpress, .embedpress-wrapper').first()
    ).toBeVisible({ timeout: 30_000 });

    // Open the Settings sidebar (outer page)
    const settingsBtn = page.locator('button[aria-label="Settings"]').first();
    const expanded = await settingsBtn.getAttribute('aria-expanded').catch(() => null);
    if (expanded !== 'true') await settingsBtn.click();

    // Inspector block card should show the EmbedPress block name (outer page sidebar)
    const inspector = page.locator('.block-editor-block-inspector, .interface-complementary-area').first();
    await expect(inspector).toBeVisible({ timeout: 10_000 });

    await expect(
      page.locator(
        '.block-editor-block-card__title:has-text("EmbedPress"), ' +
        '.block-editor-block-inspector :text("EmbedPress")'
      ).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('YouTube Channel block — Inspector shows layout / channel controls', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, YT_CHANNEL_URL);

    // Wait for channel embed to render in canvas
    const canvas = page.frameLocator(CANVAS);
    await expect(
      canvas.locator('[data-embed-type="YoutubeChannel"], figure.wp-block-embedpress-embedpress').first()
    ).toBeVisible({ timeout: 30_000 });

    // Open Settings sidebar
    const settingsBtn = page.locator('button[aria-label="Settings"]').first();
    const expanded = await settingsBtn.getAttribute('aria-expanded').catch(() => null);
    if (expanded !== 'true') await settingsBtn.click();

    // EmbedPress registers YouTube Channel-specific sidebar panels —
    // at least one of these labels must appear in the inspector
    const channelControl = page.locator(
      ':text("Layout"), :text("Page Size"), :text("Pagination"), :text("YouTube Channel")'
    ).first();
    await expect(channelControl).toBeVisible({ timeout: 15_000 });
  });

});
