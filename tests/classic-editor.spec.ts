/**
 * Classic Editor — EmbedPress YouTube embed tests.
 *
 * Coverage:
 *   1. Seeded page: verify the pre-created Classic editor page renders correctly.
 *   2. Create flow: add a new page via Classic Editor, paste EmbedPress
 *      shortcode, publish, verify on front end.
 *
 * Requirement: Classic Editor plugin must be active.
 */
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';
import {
  goToNewClassicPage,
  setClassicTitle,
  setClassicContent,
  publishClassicPage,
} from '../helpers/wp-admin';
import {
  verifyYouTubeEmbedOnPage,
  frontendUrl,
} from '../helpers/page-utils';

const YT_URL = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
const SHORTCODE = `[embedpress]${YT_URL}[/embedpress]`;

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

// ──────────────────────────────────────────────────────────────────────────
// Group 1 — Seeded page
// ──────────────────────────────────────────────────────────────────────────
test.describe('Classic Editor — Seeded page', () => {
  test('EP Classic YouTube page renders embed on front end', async ({ page }) => {
    await verifyYouTubeEmbedOnPage(page, frontendUrl('ep-classic-youtube-test'));
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Group 2 — Create new page flow
// ──────────────────────────────────────────────────────────────────────────
test.describe('Classic Editor — Create new page', () => {
  test('pastes EmbedPress shortcode, publishes, verifies embed on front end', async ({ page }) => {
    await goToNewClassicPage(page);

    // ── Title & content ────────────────────────────────────────────────────
    await setClassicTitle(page, 'EP Classic Create Test');
    await setClassicContent(page, SHORTCODE);

    // ── Verify shortcode is present before publishing ──────────────────────
    const content = await page.locator('#content').inputValue();
    expect(content).toContain('[embedpress]');

    // ── Publish ────────────────────────────────────────────────────────────
    const pageUrl = await publishClassicPage(page);
    expect(pageUrl).toBeTruthy();

    // ── Front-end verification ─────────────────────────────────────────────
    await verifyYouTubeEmbedOnPage(page, pageUrl);
  });
});
