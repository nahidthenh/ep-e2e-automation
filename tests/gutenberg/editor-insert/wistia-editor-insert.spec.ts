import { test, expect } from '@playwright/test';

const WISTIA_URL     = 'https://forusualtest.wistia.com/medias/kjgpmu64ul';
const WISTIA_MEDIA   = 'kjgpmu64ul';

// WP 7.0 renders block content inside an iframe named "editor-canvas".
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

test.describe('Gutenberg editor — Wistia block insertion (WP 7.0 RC-3)', () => {

  test('EmbedPress block inserts and accepts Wistia URL', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);

    const canvas = page.frameLocator(CANVAS);
    await expect(canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first()).toBeVisible({ timeout: 10_000 });
    await expect(canvas.locator('button:has-text("Embed")').first()).toBeVisible({ timeout: 5_000 });
  });

  // Wistia is a JS-rendered provider — the player is initialised by Wistia's
  // E-v1.js script at runtime rather than an iframe. EmbedPress intentionally
  // shows a "Changes will be affected in frontend." placeholder in the editor
  // canvas instead of a live preview. The wistia wrapper element (carrying the
  // media ID class) is present in the canvas HTML.
  // This is expected behaviour, NOT a bug.
  test('Wistia embed shows frontend-only placeholder in editor canvas (JS-rendered provider)', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, WISTIA_URL);

    const canvas = page.frameLocator(CANVAS);

    // EmbedPress renders the placeholder message for JS-rendered providers
    await expect(
      canvas.getByText(/Changes will be affected in frontend/i).first()
    ).toBeVisible({ timeout: 20_000 });

    // The wistia wrapper with the media ID IS present in the canvas HTML
    const canvasFrame = page.frames().find(f => f.name() === 'editor-canvas');
    const bodyHtml = await canvasFrame?.locator('body').innerHTML({ timeout: 3_000 }).catch(() => '') ?? '';
    expect(bodyHtml.toLowerCase()).toContain('wistia');
    expect(bodyHtml).toContain(WISTIA_MEDIA);

    // No iframe — Wistia is JS-rendered, not iframe-based
    expect(bodyHtml).not.toContain('<iframe');
  });

  test('Inspector sidebar loads with Wistia Video Controls panel', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, WISTIA_URL);

    const canvas = page.frameLocator(CANVAS);
    // Wait for the placeholder to confirm the embed was processed
    await expect(
      canvas.getByText(/Changes will be affected in frontend/i).first()
    ).toBeVisible({ timeout: 20_000 });

    await openInspector(page);

    await expect(
      page.locator('.block-editor-block-card__title:has-text("EmbedPress"), .block-editor-block-inspector :text("EmbedPress")').first()
    ).toBeVisible({ timeout: 10_000 });

    const inspector = page.locator('.block-editor-block-inspector');
    // Wistia-specific controls panel
    await expect(inspector.locator(':text("Wistia Video Controls")').first()).toBeVisible({ timeout: 10_000 });
    await expect(inspector.locator(':text("Custom Branding")').first()).toBeVisible({ timeout: 10_000 });
  });

});
