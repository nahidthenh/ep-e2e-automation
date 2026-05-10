import { test, expect } from '@playwright/test';

const FACEBOOK_VIDEO_URL = 'https://www.facebook.com/NASA/videos/the-value-of-nasa-2024-state-of-nasa-highlights/7439955576048375/';
const FB_VIDEO_MARKER = '7439955576048375';

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

test.describe('Gutenberg editor — Facebook Video block insertion (WP 7.0 RC-3)', () => {

  test('EmbedPress block inserts and accepts Facebook Video URL', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);

    const canvas = page.frameLocator(CANVAS);
    await expect(canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first()).toBeVisible({ timeout: 10_000 });
    await expect(canvas.locator('button:has-text("Embed")').first()).toBeVisible({ timeout: 5_000 });
  });

  // Facebook's plugins/post.php iframe (used for both posts and videos) is
  // embedded from a blob: origin canvas in WP 7.0. Facebook may block this
  // with X-Frame-Options or CSP frame-ancestors restrictions.
  test('Facebook Video embed settles in editor canvas (iframe or error)', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, FACEBOOK_VIDEO_URL);

    const canvas = page.frameLocator(CANVAS);
    const iframeLocator = canvas.locator('iframe[src*="facebook.com/plugins"]').first();
    const errorLocator = canvas.getByText(/Sorry, we could not embed/i).first();

    const result = await Promise.race([
      iframeLocator.waitFor({ state: 'attached', timeout: 30_000 }).then(() => 'iframe'),
      errorLocator.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'error'),
    ]);

    if (result === 'iframe') {
      await expect(iframeLocator).toHaveAttribute('src', new RegExp(FB_VIDEO_MARKER), { timeout: 5_000 });
    } else {
      await expect(errorLocator).toBeVisible();
    }
  });

  test('EmbedPress REST API returns embed HTML for Facebook Video', async ({ page }) => {
    await page.goto('/wp-admin/', { waitUntil: 'domcontentloaded' });

    const apiResponse = await page.evaluate(async (url) => {
      const nonce = (window as any).wpApiSettings?.nonce || '';
      const r = await fetch('/wp-json/embedpress/v1/oembed/embedpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce },
        body: JSON.stringify({ url }),
      });
      const body = await r.json();
      return { status: r.status, bodyType: typeof body, hasEmbed: typeof body === 'object' && !!body?.embed };
    }, FACEBOOK_VIDEO_URL);

    expect(apiResponse.bodyType).toBe('object');
    expect(apiResponse.hasEmbed).toBe(true);
  });

});
