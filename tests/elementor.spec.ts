/**
 * Elementor — EmbedPress widget tests.
 *
 * Coverage:
 *   1. Seeded page: verify the pre-created Elementor page renders correctly.
 *   2. Create flow: create a new page, open in Elementor editor, add the
 *      EmbedPress widget, publish, verify on front end.
 *
 * Notes:
 *   - Elementor loads inside the same window (no outer iframe in modern versions).
 *   - The editor preview pane IS inside an <iframe id="elementor-preview-iframe">.
 *     Front-end verification is done by navigating to the published URL instead.
 *   - Timeouts are deliberately generous; Elementor is a heavy SPA.
 *
 * Requirement: Elementor + EmbedPress plugins must be active.
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';
import {
  goToNewGutenbergPage,
  setGutenbergTitle,
  publishGutenbergPage,
} from '../helpers/wp-admin';
import {
  waitForElementorReady,
  addElementorWidget,
  setEmbedPressUrl,
  publishElementorPage,
  verifyYouTubeEmbedOnPage,
  frontendUrl,
} from '../helpers/page-utils';

const YT_URL = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

// ──────────────────────────────────────────────────────────────────────────
// Group 1 — Seeded page
// ──────────────────────────────────────────────────────────────────────────
test.describe('Elementor — Seeded page', () => {
  test('EP Elementor YouTube page renders embed on front end', async ({ page }) => {
    await verifyYouTubeEmbedOnPage(page, frontendUrl('ep-elementor-youtube-test'));
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Group 2 — Create new page flow
// ──────────────────────────────────────────────────────────────────────────
test.describe('Elementor — Create new page', () => {
  test('creates page, adds EmbedPress widget in Elementor, publishes, verifies embed', async ({ page }) => {
    // ── Step 1: Create a stub page in Gutenberg/Quick-draft ────────────────
    // We need a page ID before we can open Elementor. Simplest path:
    // publish a blank page via Gutenberg first, then switch to Elementor.
    await goToNewGutenbergPage(page);
    await setGutenbergTitle(page, 'EP Elementor Create Test');

    // Publish as-is (blank content) to get a page ID
    const stubUrl = await publishGutenbergPage(page);
    expect(stubUrl).toBeTruthy();

    // Extract the page ID from the "View Page" URL (?page_id=X or /slug/)
    const editUrl = page.url(); // should be wp-admin/post.php?post=X&action=edit
    const postIdMatch = editUrl.match(/post=(\d+)/);
    expect(postIdMatch).not.toBeNull();
    const postId = Number(postIdMatch![1]);

    // ── Step 2: Open page in Elementor editor ──────────────────────────────
    await page.goto(`/wp-admin/post.php?post=${postId}&action=elementor`);
    await waitForElementorReady(page);

    // ── Step 3: Add a section if the canvas is empty ───────────────────────
    await ensureElementorSection(page);

    // ── Step 4: Add EmbedPress widget ─────────────────────────────────────
    await addElementorWidget(page, 'EmbedPress');
    await setEmbedPressUrl(page, YT_URL);

    // ── Step 5: Publish ────────────────────────────────────────────────────
    await publishElementorPage(page);

    // ── Step 6: Front-end verification ────────────────────────────────────
    await verifyYouTubeEmbedOnPage(page, stubUrl);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Helper: ensures at least one editable section/column exists in the canvas
// ──────────────────────────────────────────────────────────────────────────
async function ensureElementorSection(page: Page): Promise<void> {
  // If the canvas already has at least one column we're done
  const existingColumn = page.locator(
    '.elementor-column[data-element_type="column"]'
  ).first();
  if (await existingColumn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    return;
  }

  // Empty canvas: click the "+" to add a new section
  const addSection = page.locator(
    '.elementor-add-section-button, ' +
    '[data-placeholder="Add New Section"], ' +
    'button:has-text("Add new section")'
  ).first();
  await expect(addSection).toBeVisible({ timeout: 15_000 });
  await addSection.click();

  // Pick a single-column preset
  const singleColumn = page.locator(
    '.elementor-column-preset-list .elementor-column-preset:first-child, ' +
    '[data-structure="10"]'  // "10" = 100% width in Elementor's internal notation
  ).first();
  await expect(singleColumn).toBeVisible({ timeout: 10_000 });
  await singleColumn.click();

  // Confirm column appeared
  await expect(
    page.locator('.elementor-column[data-element_type="column"]')
  ).toBeVisible({ timeout: 10_000 });
}
