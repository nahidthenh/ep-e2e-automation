import { test, expect } from '@playwright/test';

const GOOGLE_DOCS_URL = 'https://docs.google.com/document/d/e/2PACX-1vQBdUB9bU8y9hnIrDvMPHM8TZDkN7TQLPEYLnc-J8gQJEI5H08cFDW6m1nXRpG6QEyclbIT3SzqD1MS/pub';
const DOC_MARKER = '2PACX-1vQBdUB9bU8y9hnIrDv';

const CANVAS = 'iframe[name="editor-canvas"]';

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

test.describe('Gutenberg editor — Google Docs block insertion (WP 7.0 RC-3)', () => {

  test('EmbedPress block inserts and accepts Google Docs URL', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);

    const canvas = page.frameLocator(CANVAS);
    await expect(canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first()).toBeVisible({ timeout: 10_000 });
    await expect(canvas.locator('button:has-text("Embed")').first()).toBeVisible({ timeout: 5_000 });
  });

  // Google Docs /pub URLs are Google's deliberately-embeddable endpoint.
  // They do not enforce X-Frame-Options from blob: origins, so the iframe
  // should attach in the WP 7.0 editor canvas without a security error.
  test('Google Docs iframe attaches in editor canvas', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, GOOGLE_DOCS_URL);

    const canvas = page.frameLocator(CANVAS);
    const docIframe = canvas.locator('iframe[src*="docs.google.com/document"]').first();
    await expect(docIframe).toBeAttached({ timeout: 30_000 });
    await expect(docIframe).toHaveAttribute('src', new RegExp(DOC_MARKER), { timeout: 5_000 });

    const canvasFrame = page.frames().find(f => f.name() === 'editor-canvas');
    expect(canvasFrame?.url()).toMatch(/^blob:/);
  });

  test('Inspector sidebar loads with General and Custom Branding panels', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, GOOGLE_DOCS_URL);

    const canvas = page.frameLocator(CANVAS);
    await expect(canvas.locator('iframe[src*="docs.google.com"]').first()).toBeAttached({ timeout: 30_000 });

    await openInspector(page);

    await expect(
      page.locator('.block-editor-block-card__title:has-text("EmbedPress"), .block-editor-block-inspector :text("EmbedPress")').first()
    ).toBeVisible({ timeout: 10_000 });

    const inspector = page.locator('.block-editor-block-inspector');
    await expect(inspector.locator(':text("General")').first()).toBeVisible({ timeout: 5_000 });
    await expect(inspector.locator(':text("Custom Branding")').first()).toBeVisible({ timeout: 5_000 });
  });

});
