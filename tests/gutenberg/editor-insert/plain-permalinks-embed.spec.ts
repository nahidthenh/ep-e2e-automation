/**
 * Regression test for fbs-81741
 * EmbedPress embeds fail under Plain (/?p=ID) permalinks because JS sources
 * built REST URLs as hardcoded `/wp-json/embedpress/v1/...`.
 *
 * Root cause: WordPress only registers the /wp-json/ rewrite for non-Plain
 * permalink structures. Under Plain, REST is served at ?rest_route=/...
 * so every hardcoded fetch 404'd and no embedHTML was saved.
 *
 * Fix: use apiFetch({ path }) and rest_url() throughout so the WP API
 * resolver picks the correct base for the active permalink structure.
 */

import { test, expect } from '@playwright/test';
import { editorLocator } from '../../../helpers/wp-admin';

const YT_VIDEO_URL = 'https://www.youtube.com/watch?v=5zWTInJqD5k';
const YT_VIDEO_ID  = '5zWTInJqD5k';

// ── Permalink helpers ──────────────────────────────────────────────────────
// In serial mode all tests share the same `page` object, so we set/restore
// the permalink directly on that page in beforeEach / afterEach rather than
// creating a separate browser context in beforeAll (which doesn't affect the
// shared page and leaves it stuck on whatever URL it was at).

async function setPermalinks(
  page: import('@playwright/test').Page,
  radioLabel: 'Plain' | 'Post name',
): Promise<void> {
  await page.goto('/wp-admin/options-permalink.php', { waitUntil: 'domcontentloaded' });
  await page.getByRole('radio', { name: radioLabel }).check();
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await page.waitForLoadState('domcontentloaded');
}

// ── Editor helpers ─────────────────────────────────────────────────────────

async function openNewPost(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/wp-admin/post-new.php', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('button[aria-label="Block Inserter"]')).toBeVisible({ timeout: 20_000 });
  const dismiss = page.locator('button[aria-label="Close"], .edit-post-welcome-guide button').first();
  if (await dismiss.isVisible({ timeout: 3_000 }).catch(() => false)) await dismiss.click();
}

async function insertEmbedPressBlock(page: import('@playwright/test').Page): Promise<void> {
  await page.locator('button[aria-label="Block Inserter"]').click();
  const search = page.locator(
    '.block-editor-inserter__search input, .components-search-control__input, input[placeholder="Search"]',
  ).first();
  await expect(search).toBeVisible({ timeout: 10_000 });
  await search.fill('EmbedPress');
  await page.locator('.editor-block-list-item-embedpress-embedpress, button:has-text("EmbedPress")').first().click();

  // WP ≤ 6.8: canvas inside iframe[name="editor-canvas"]; WP 6.9+: outer document.
  const urlInput = await editorLocator(page, 'input[placeholder*="embed here"], input[placeholder*="Enter URL"]');
  await expect(urlInput.first()).toBeVisible({ timeout: 15_000 });

  // Close the block inserter panel. In WP 6.9+ the editor and the inserter panel
  // share the same outer document. If the inserter stays open, `button:has-text("Embed")`
  // in fillAndEmbed matches the "EmbedPress" block buttons (which contain "Embed") and
  // clicks them instead of the block's own "Embed" submit button.
  const inserterBtn = page.locator('button[aria-label="Block Inserter"]');
  if ((await inserterBtn.getAttribute('aria-expanded').catch(() => null)) === 'true') {
    await inserterBtn.click();
    await page.waitForTimeout(200);
  }
}

async function fillAndEmbed(page: import('@playwright/test').Page, url: string): Promise<void> {
  const urlInput = await editorLocator(page, 'input[placeholder*="embed here"], input[placeholder*="Enter URL"]');
  await urlInput.first().fill(url);
  // Use getByRole with exact match so we hit the block's "Embed" submit button and not
  // an "EmbedPress" or "Embed anything" button elsewhere on the page.
  const embedBtn = page.getByRole('button', { name: 'Embed', exact: true }).first();
  await embedBtn.click();
}

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe('Plain permalinks — EmbedPress oEmbed REST fix (fbs-81741)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await setPermalinks(page, 'Plain');
  });

  test.afterEach(async ({ page }) => {
    await setPermalinks(page, 'Post name');
  });

  test('EmbedPress block inserts and shows URL input under Plain permalinks', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);

    const urlInput = await editorLocator(page, 'input[placeholder*="embed here"], input[placeholder*="Enter URL"]');
    await expect(urlInput.first()).toBeVisible({ timeout: 15_000 });
    const embedBtn = page.getByRole('button', { name: 'Embed', exact: true }).first();
    await expect(embedBtn).toBeVisible({ timeout: 5_000 });
  });

  test('YouTube oEmbed call resolves under Plain permalinks — iframe is produced', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, YT_VIDEO_URL);

    // An attached YouTube iframe means the oEmbed REST endpoint returned embedHTML.
    // Before the fix (hardcoded /wp-json/ paths), this call 404'd under Plain
    // permalinks and the block showed an embed-error message instead.
    const ytIframe = await editorLocator(
      page, `iframe[src*="${YT_VIDEO_ID}"], iframe[src*="youtube.com/embed"]`,
    );
    await expect(ytIframe.first()).toBeAttached({ timeout: 30_000 });
  });

  test('No "could not embed" error appears under Plain permalinks', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, YT_VIDEO_URL);

    // Wait for the embed to resolve (success path)
    const ytIframe = await editorLocator(
      page, `iframe[src*="${YT_VIDEO_ID}"], iframe[src*="youtube.com/embed"]`,
    );
    await expect(ytIframe.first()).toBeAttached({ timeout: 30_000 });

    // Confirm the pre-fix failure message is absent
    const errText = await editorLocator(page, ':text("Sorry, we could not embed"), :text("cannot embed")');
    await expect(errText.first()).not.toBeVisible({ timeout: 3_000 });
  });
});
