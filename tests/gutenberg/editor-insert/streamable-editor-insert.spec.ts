import { test, expect } from '@playwright/test';

const STREAMABLE_URL   = 'https://streamable.com/susppe';
const STREAMABLE_VIDEO = 'susppe';

// WP 7.0 renders block content inside an iframe named "editor-canvas".
const CANVAS = 'iframe[name="editor-canvas"]';

// NOTE: The test video (susppe) returns HTTP 404 from Streamable — the video
// was deleted after the test suite was created. EmbedPress's embed structure is
// correct (iframe with streamable.com/o/susppe src is produced), but the iframe
// content shows "404 — This page could not be found." The 404 is a test data
// issue, not an EmbedPress or WP 7.0 bug. Update sources.json with a live
// Streamable video to fully validate front-end playback.

// ─── helpers ────────────────────────────────────────────────────────────────

async function openNewPost(page: import('@playwright/test').Page) {
  await page.goto('/wp-admin/post-new.php', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('button[aria-label="Block Inserter"]')).toBeVisible({ timeout: 20_000 });
  const dismiss = page.locator('button[aria-label="Close"], .edit-post-welcome-guide button').first();
  if (await dismiss.isVisible({ timeout: 3_000 }).catch(() => false)) await dismiss.click();
}

async function insertEmbedPressBlock(page: import('@playwright/test').Page) {
  await page.locator('button[aria-label="Block Inserter"]').click();
  const search = page.locator(
    '.block-editor-inserter__search input, .components-search-control__input, input[placeholder="Search"]'
  ).first();
  await expect(search).toBeVisible({ timeout: 10_000 });
  await search.fill('EmbedPress');
  await page.locator('.editor-block-list-item-embedpress-embedpress, button:has-text("EmbedPress")').first().click();

  const canvas = page.frameLocator(CANVAS);
  await expect(
    canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first()
  ).toBeVisible({ timeout: 15_000 });
}

async function fillAndEmbed(page: import('@playwright/test').Page, url: string) {
  const canvas = page.frameLocator(CANVAS);
  await canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first().fill(url);
  await canvas.locator('button:has-text("Embed")').first().click();
}

async function openInspector(page: import('@playwright/test').Page) {
  const settingsBtn = page.locator('button[aria-label="Settings"]').first();
  if (await settingsBtn.getAttribute('aria-expanded').catch(() => null) !== 'true') {
    await settingsBtn.click();
  }
  await expect(
    page.locator('.block-editor-block-inspector, .interface-complementary-area').first()
  ).toBeVisible({ timeout: 10_000 });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe('Gutenberg editor — Streamable block insertion (WP 7.0 RC-3)', () => {

  test('EmbedPress block inserts and accepts Streamable URL', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);

    const canvas = page.frameLocator(CANVAS);
    await expect(canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first()).toBeVisible({ timeout: 10_000 });
    await expect(canvas.locator('button:has-text("Embed")').first()).toBeVisible({ timeout: 5_000 });
  });

  // EmbedPress correctly produces a Streamable iframe in the editor canvas.
  // The iframe shows "404 — This page could not be found." because the test
  // video (susppe) has been deleted from Streamable. The embed structure itself
  // is correct — the iframe element is attached with the right src.
  test('Streamable iframe attaches in editor canvas with correct video src (test video is 404 — deleted)', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, STREAMABLE_URL);

    const canvas = page.frameLocator(CANVAS);

    // EmbedPress produces the Streamable embed iframe with the correct structure
    const streamIframe = canvas.locator(
      `iframe[src*="streamable.com/o/${STREAMABLE_VIDEO}"], iframe[src*="streamable.com"]`
    ).first();
    await expect(streamIframe).toBeAttached({ timeout: 20_000 });

    // Confirm the video ID is in the iframe src
    await expect(streamIframe).toHaveAttribute('src', new RegExp(STREAMABLE_VIDEO), { timeout: 5_000 });

    // Canvas origin is blob: (WP 7.0 editor canvas)
    const canvasFrame = page.frames().find(f => f.name() === 'editor-canvas');
    expect(canvasFrame?.url()).toMatch(/^blob:/);
  });

  test('Inspector sidebar loads with EmbedPress block card and General panel', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, STREAMABLE_URL);

    const canvas = page.frameLocator(CANVAS);
    await expect(
      canvas.locator('iframe[src*="streamable.com"]').first()
    ).toBeAttached({ timeout: 20_000 });

    await openInspector(page);

    await expect(
      page.locator('.block-editor-block-card__title:has-text("EmbedPress"), .block-editor-block-inspector :text("EmbedPress")').first()
    ).toBeVisible({ timeout: 10_000 });

    const inspector = page.locator('.block-editor-block-inspector');
    await expect(inspector.locator(':text("General")').first()).toBeVisible({ timeout: 5_000 });
    await expect(inspector.locator(':text("Custom Branding")').first()).toBeVisible({ timeout: 5_000 });
  });

});
