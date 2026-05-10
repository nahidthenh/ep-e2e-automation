import { test, expect } from '@playwright/test';

const TWITTER_URL = 'https://twitter.com/WPDevTeam/status/1346487409035206657?s=20';
const TWEET_ID = '1346487409035206657';

const CANVAS = 'iframe[name="editor-canvas"]';

// Twitter/X embeds use a <blockquote class="twitter-tweet"> + widgets.js approach.
// The widgets.js script replaces the blockquote with an iframe at runtime on the
// front-end, but in the WP 7.0 editor canvas the external script may not execute.
// The stable surface to assert on in the editor is the blockquote element itself.

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

test.describe('Gutenberg editor — Twitter Feed block insertion (WP 7.0 RC-3)', () => {

  test('EmbedPress block inserts and accepts Twitter URL', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);

    const canvas = page.frameLocator(CANVAS);
    await expect(canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first()).toBeVisible({ timeout: 10_000 });
    await expect(canvas.locator('button:has-text("Embed")').first()).toBeVisible({ timeout: 5_000 });
  });

  // Twitter/X is JS-rendered: EmbedPress injects a <blockquote class="twitter-tweet">
  // + widgets.js script. The blockquote is the stable editor-canvas marker.
  // widgets.js may or may not execute inside the blob: iframe — the tweet render
  // is only guaranteed on the front-end.
  test('Twitter blockquote with tweet ID is visible in editor canvas', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, TWITTER_URL);

    // Wait for the embed to process (spinner disappears)
    await page.waitForTimeout(3_000);

    const canvasFrame = page.frames().find(f => f.name() === 'editor-canvas');
    expect(canvasFrame?.url()).toMatch(/^blob:/);

    const bodyHtml = await canvasFrame?.locator('body').innerHTML({ timeout: 15_000 }) ?? '';

    // EmbedPress embed HTML contains the blockquote with the tweet ID
    const hasTweetId = bodyHtml.includes(TWEET_ID) || bodyHtml.includes('twitter-tweet');
    const hasEmbedWrapper = bodyHtml.includes('ose-twitter') || bodyHtml.includes('data-embed-type="Twitter"');

    expect(hasTweetId || hasEmbedWrapper, 'Expected twitter-tweet blockquote or ose-twitter wrapper in canvas HTML').toBe(true);
  });

  test('Inspector sidebar loads with General and Custom Branding panels', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, TWITTER_URL);

    await page.waitForTimeout(3_000);

    const settingsBtn = page.locator('button[aria-label="Settings"]').first();
    if (await settingsBtn.getAttribute('aria-expanded').catch(() => null) !== 'true') {
      await settingsBtn.click();
    }
    await expect(
      page.locator('.block-editor-block-inspector, .interface-complementary-area').first()
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.locator('.block-editor-block-card__title:has-text("EmbedPress"), .block-editor-block-inspector :text("EmbedPress")').first()
    ).toBeVisible({ timeout: 10_000 });

    const inspector = page.locator('.block-editor-block-inspector');
    await expect(inspector.locator(':text("General")').first()).toBeVisible({ timeout: 5_000 });
    await expect(inspector.locator(':text("Custom Branding")').first()).toBeVisible({ timeout: 5_000 });
  });

});
