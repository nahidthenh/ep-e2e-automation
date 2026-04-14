/**
 * Gutenberg editor — EmbedPress YouTube embed tests.
 *
 * Coverage:
 *   1. Seeded page: verify the pre-created Gutenberg page renders correctly.
 *   2. Create flow: add a new page, insert EmbedPress block, publish,
 *      then verify the embed on the front end.
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';
import {
  goToNewGutenbergPage,
  setGutenbergTitle,
  insertBlock,
  publishGutenbergPage,
} from '../helpers/wp-admin';
import {
  verifyYouTubeEmbedOnPage,
  verifyEmbedPreviewInEditor,
  frontendUrl,
} from '../helpers/page-utils';

const YT_URL = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

// Runs once before all tests in this file
test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

// ──────────────────────────────────────────────────────────────────────────
// Group 1 — Seeded page
// ──────────────────────────────────────────────────────────────────────────
test.describe('Gutenberg — Seeded page', () => {
  test('EP Gutenberg YouTube page renders embed on front end', async ({ page }) => {
    await verifyYouTubeEmbedOnPage(page, frontendUrl('ep-gutenberg-youtube-test'));
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Group 2 — Create new page flow
// ──────────────────────────────────────────────────────────────────────────
test.describe('Gutenberg — Create new page', () => {
  test('inserts EmbedPress block, publishes, and verifies embed on front end', async ({ page }) => {
    await goToNewGutenbergPage(page);

    // ── Set title ──────────────────────────────────────────────────────────
    await setGutenbergTitle(page, 'EP Gutenberg Create Test');

    // ── Insert EmbedPress block ────────────────────────────────────────────
    await insertBlock(page, 'EmbedPress');

    // The block renders a URL input after insertion
    const urlInput = page.locator(
      'input[placeholder*="URL"], input[placeholder*="url"], ' +
      '.components-placeholder__input'
    ).first();
    await expect(urlInput).toBeVisible({ timeout: 10_000 });
    await urlInput.fill(YT_URL);
    await urlInput.press('Enter');

    // Wait for the block to display the embed preview or a success indicator
    await verifyEmbedPreviewInEditor(page);

    // ── Publish ────────────────────────────────────────────────────────────
    const pageUrl = await publishGutenbergPage(page);
    expect(pageUrl).toBeTruthy();

    // ── Front-end verification ─────────────────────────────────────────────
    await verifyYouTubeEmbedOnPage(page, pageUrl);
  });
});
