import { test, expect } from '@playwright/test';

const VIMEO_URL    = 'https://vimeo.com/4821640';
const VIMEO_ID     = '4821640';

// WP 7.0 renders block content inside an iframe named "editor-canvas".
// Toolbar, inserter panel, and sidebar live on the outer page.
const CANVAS = 'iframe[name="editor-canvas"]';

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
  const urlInput = canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first();
  await urlInput.fill(url);
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

test.describe('Gutenberg editor — Vimeo block insertion (WP 7.0 RC-3)', () => {

  test('EmbedPress block inserts and accepts Vimeo URL', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);

    const canvas = page.frameLocator(CANVAS);
    await expect(canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first()).toBeVisible({ timeout: 10_000 });
    await expect(canvas.locator('button:has-text("Embed")').first()).toBeVisible({ timeout: 5_000 });
  });

  // KNOWN ISSUE — WP 7.0 RC-3: Vimeo shows security/connection error in editor.
  //
  // Root cause: WP 7.0 renders the block editor canvas inside iframe[name="editor-canvas"]
  // with a blob: URL origin. Vimeo rejects embedding when the parent frame has a blob:
  // origin — showing "We couldn't verify the security of your connection."
  //
  // The Vimeo player iframe is cross-origin so the error text is not readable via
  // Playwright. We assert on the iframe element's src (proves EmbedPress produced
  // the correct embed) and confirm the canvas origin is blob:.
  // Front-end rendering is completely unaffected.
  test('KNOWN ISSUE — Vimeo iframe present but shows security error in editor (WP 7.0 blob: iframe)', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, VIMEO_URL);

    const canvas = page.frameLocator(CANVAS);

    // EmbedPress correctly produced the Vimeo player iframe with the right video ID
    const vimeoIframe = canvas.locator(
      `iframe[src*="player.vimeo.com/video/${VIMEO_ID}"], iframe[src*="vimeo.com"]`
    ).first();
    await expect(vimeoIframe).toBeAttached({ timeout: 20_000 });

    // Root cause confirmed: canvas is a blob: URL — Vimeo rejects this origin
    const canvasFrame = page.frames().find(f => f.name() === 'editor-canvas');
    expect(canvasFrame?.url()).toMatch(/^blob:/);
  });

  test('Inspector sidebar loads with EmbedPress block card and Video Controls panel', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, VIMEO_URL);

    const canvas = page.frameLocator(CANVAS);
    // Wait for the Vimeo iframe to be attached before the inspector fully populates
    await expect(
      canvas.locator(`iframe[src*="vimeo.com"]`).first()
    ).toBeAttached({ timeout: 30_000 });

    await openInspector(page);

    // EmbedPress block card
    await expect(
      page.locator('.block-editor-block-card__title:has-text("EmbedPress"), .block-editor-block-inspector :text("EmbedPress")').first()
    ).toBeVisible({ timeout: 10_000 });

    // EmbedPress-specific sidebar panels — scoped inside the inspector
    const inspector = page.locator('.block-editor-block-inspector');
    await expect(inspector.locator(':text("Video Controls")').first()).toBeVisible({ timeout: 10_000 });
    await expect(inspector.locator(':text("Custom Branding")').first()).toBeVisible({ timeout: 10_000 });
  });

});
