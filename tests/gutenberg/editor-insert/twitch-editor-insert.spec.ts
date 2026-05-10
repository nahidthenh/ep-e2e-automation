import { test, expect } from '@playwright/test';

const TWITCH_URL     = 'https://www.twitch.tv/sinatraa';
const TWITCH_CHANNEL = 'sinatraa';

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

test.describe('Gutenberg editor — Twitch block insertion (WP 7.0 RC-3)', () => {

  test('EmbedPress block inserts and accepts Twitch URL', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);

    const canvas = page.frameLocator(CANVAS);
    await expect(canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first()).toBeVisible({ timeout: 10_000 });
    await expect(canvas.locator('button:has-text("Embed")').first()).toBeVisible({ timeout: 5_000 });
  });

  test('Twitch embed iframe attaches in editor canvas with correct channel', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, TWITCH_URL);

    const canvas = page.frameLocator(CANVAS);

    // Wait for the Twitch embed iframe to be attached
    const twitchIframe = canvas.locator(
      `iframe[src*="embed.twitch.tv"], iframe[src*="${TWITCH_CHANNEL}"]`
    ).first();
    await expect(twitchIframe).toBeAttached({ timeout: 30_000 });

    // Confirm the channel name is in the iframe src
    await expect(twitchIframe).toHaveAttribute('src', new RegExp(TWITCH_CHANNEL), { timeout: 5_000 });

    // Check canvas origin — blob: is the root cause for any embed restrictions
    const canvasFrame = page.frames().find(f => f.name() === 'editor-canvas');
    expect(canvasFrame?.url()).toMatch(/^blob:/);
  });

  test('Inspector sidebar loads with EmbedPress block card', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, TWITCH_URL);

    const canvas = page.frameLocator(CANVAS);
    await expect(
      canvas.locator('iframe[src*="embed.twitch.tv"]').first()
    ).toBeAttached({ timeout: 30_000 });

    await openInspector(page);

    await expect(
      page.locator('.block-editor-block-card__title:has-text("EmbedPress"), .block-editor-block-inspector :text("EmbedPress")').first()
    ).toBeVisible({ timeout: 10_000 });

    const inspector = page.locator('.block-editor-block-inspector');
    // Twitch-specific sidebar panel
    await expect(inspector.locator(':text("Twitch Controls")').first()).toBeVisible({ timeout: 10_000 });
    await expect(inspector.locator(':text("Custom Branding")').first()).toBeVisible({ timeout: 10_000 });
  });

});
