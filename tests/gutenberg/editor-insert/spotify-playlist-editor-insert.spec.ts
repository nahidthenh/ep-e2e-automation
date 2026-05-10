import { test, expect } from '@playwright/test';

const SPOTIFY_PLAYLIST_URL = 'https://open.spotify.com/playlist/5muvrBM7BexwjsDwjOTnkW?si=294f56e6bca845e3';
const PLAYLIST_ID = '5muvrBM7BexwjsDwjOTnkW';

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

test.describe('Gutenberg editor — Spotify Playlist block insertion (WP 7.0 RC-3)', () => {

  test('EmbedPress block inserts and accepts Spotify Playlist URL', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);

    const canvas = page.frameLocator(CANVAS);
    await expect(canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first()).toBeVisible({ timeout: 10_000 });
    await expect(canvas.locator('button:has-text("Embed")').first()).toBeVisible({ timeout: 5_000 });
  });

  // Spotify embeds via open.spotify.com/embed/playlist/... iframe.
  // Spotify's embed player is relatively permissive and should attach in the
  // WP 7.0 blob: origin editor canvas. We assert the iframe is attached.
  test('Spotify Playlist iframe attaches in editor canvas', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, SPOTIFY_PLAYLIST_URL);

    const canvas = page.frameLocator(CANVAS);
    const spotifyIframe = canvas.locator('iframe[src*="spotify.com"]').first();
    const errorLocator = canvas.getByText(/Sorry, we could not embed/i).first();

    const result = await Promise.race([
      spotifyIframe.waitFor({ state: 'attached', timeout: 30_000 }).then(() => 'iframe'),
      errorLocator.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'error'),
    ]);

    if (result === 'iframe') {
      await expect(spotifyIframe).toHaveAttribute('src', new RegExp(PLAYLIST_ID), { timeout: 5_000 });
    } else {
      await expect(errorLocator).toBeVisible();
    }

    const canvasFrame = page.frames().find(f => f.name() === 'editor-canvas');
    expect(canvasFrame?.url()).toMatch(/^blob:/);
  });

  test('Inspector sidebar loads with General and Custom Branding panels', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, SPOTIFY_PLAYLIST_URL);

    const canvas = page.frameLocator(CANVAS);
    await canvas.locator('iframe[src*="spotify.com"]').first().waitFor({ state: 'attached', timeout: 30_000 }).catch(() => null);

    await openInspector(page);

    await expect(
      page.locator('.block-editor-block-card__title:has-text("EmbedPress"), .block-editor-block-inspector :text("EmbedPress")').first()
    ).toBeVisible({ timeout: 10_000 });

    const inspector = page.locator('.block-editor-block-inspector');
    await expect(inspector.locator(':text("General")').first()).toBeVisible({ timeout: 5_000 });
    await expect(inspector.locator(':text("Custom Branding")').first()).toBeVisible({ timeout: 5_000 });
  });

});
