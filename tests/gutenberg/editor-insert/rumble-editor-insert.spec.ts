import { test, expect } from '@playwright/test';

const RUMBLE_URL   = 'https://rumble.com/embed/v6alqqm/?pub=4';
const RUMBLE_VIDEO = 'v6alqqm';

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

test.describe('Gutenberg editor — Rumble block insertion (WP 7.0 RC-3)', () => {

  test('EmbedPress block inserts and accepts Rumble URL', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);

    const canvas = page.frameLocator(CANVAS);
    await expect(canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first()).toBeVisible({ timeout: 10_000 });
    await expect(canvas.locator('button:has-text("Embed")').first()).toBeVisible({ timeout: 5_000 });
  });

  // Rumble is a client-side rendered provider. EmbedPress produces a wrapper
  // <div data-embed-type="Rumble"> with the embed URL as text content — the
  // actual player iframe is injected by Rumble's client script at runtime on
  // the front-end. The editor canvas therefore shows the raw embed URL as text
  // rather than a live player. This is expected behaviour, NOT a bug.
  test('Rumble embed shows raw URL in editor canvas (client-side rendered provider)', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, RUMBLE_URL);

    const canvas = page.frameLocator(CANVAS);

    // Canvas renders the embed URL as visible text (the div content)
    await expect(
      canvas.getByText(/rumble\.com\/embed/i).first()
    ).toBeVisible({ timeout: 20_000 });

    // The rumble wrapper element with the video ID is present in the canvas HTML
    const canvasFrame = page.frames().find(f => f.name() === 'editor-canvas');
    const bodyHtml = await canvasFrame?.locator('body').innerHTML({ timeout: 3_000 }).catch(() => '') ?? '';
    expect(bodyHtml.toLowerCase()).toContain('rumble');
    expect(bodyHtml).toContain(RUMBLE_VIDEO);

    // No iframe — Rumble is client-side rendered, not iframe-based in the editor
    expect(bodyHtml).not.toContain('<iframe');
  });

  test('Inspector sidebar loads with EmbedPress block card and General panel', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, RUMBLE_URL);

    const canvas = page.frameLocator(CANVAS);
    await expect(
      canvas.getByText(/rumble\.com\/embed/i).first()
    ).toBeVisible({ timeout: 20_000 });

    await openInspector(page);

    await expect(
      page.locator('.block-editor-block-card__title:has-text("EmbedPress"), .block-editor-block-inspector :text("EmbedPress")').first()
    ).toBeVisible({ timeout: 10_000 });

    const inspector = page.locator('.block-editor-block-inspector');
    await expect(inspector.locator(':text("General")').first()).toBeVisible({ timeout: 5_000 });
    await expect(inspector.locator(':text("Custom Branding")').first()).toBeVisible({ timeout: 5_000 });
  });

});
