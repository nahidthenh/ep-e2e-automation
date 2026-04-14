import { Page, expect } from '@playwright/test';

// ─── Navigation ────────────────────────────────────────────────────────────

export async function goToNewGutenbergPage(page: Page): Promise<void> {
  await page.goto('/wp-admin/post-new.php?post_type=page');
  await page.waitForLoadState('networkidle');
  await dismissWelcomeModal(page);
}

export async function goToNewClassicPage(page: Page): Promise<void> {
  // classic-editor plugin appends `?classic-editor` flag
  await page.goto('/wp-admin/post-new.php?post_type=page&classic-editor');
  await page.waitForLoadState('domcontentloaded');
}

export async function goToAdminPagesList(page: Page): Promise<void> {
  await page.goto('/wp-admin/edit.php?post_type=page');
  await page.waitForLoadState('domcontentloaded');
}

// ─── Gutenberg helpers ─────────────────────────────────────────────────────

/** Dismisses the Gutenberg welcome guide if present. */
async function dismissWelcomeModal(page: Page): Promise<void> {
  const modal = page.locator('.edit-post-welcome-guide, .components-guide__finish-button');
  if (await modal.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
    const closeBtn = page.locator(
      '[aria-label="Close"], .edit-post-welcome-guide button, .components-guide__finish-button'
    ).first();
    await closeBtn.click();
    await modal.first().waitFor({ state: 'hidden' });
  }
}

/** Types the page title in Gutenberg. */
export async function setGutenbergTitle(page: Page, title: string): Promise<void> {
  const titleInput = page.locator('.editor-post-title__input, [aria-label="Add title"]');
  await titleInput.click();
  await titleInput.fill(title);
}

/**
 * Inserts a block by name using the block inserter search.
 * Returns when the block is selected in the editor.
 */
export async function insertBlock(page: Page, blockName: string): Promise<void> {
  // Open inserter
  const inserterBtn = page.locator(
    'button[aria-label="Toggle block inserter"], button[aria-label="Block Inserter"]'
  );
  await inserterBtn.click();

  // Search
  const searchInput = page.locator(
    '[placeholder="Search"], [aria-label="Search for blocks and patterns"]'
  ).first();
  await searchInput.fill(blockName);

  // Click the first matching result
  const result = page.locator(
    `.block-editor-block-types-list__item[aria-label*="${blockName}"],` +
    `.editor-block-list-item-${blockName.toLowerCase().replace(/\s/g, '-')},` +
    `.components-button:has-text("${blockName}")`
  ).first();
  await expect(result).toBeVisible({ timeout: 10_000 });
  await result.click();

  // Close inserter if still open
  if (await inserterBtn.getAttribute('aria-expanded') === 'true') {
    await inserterBtn.click();
  }
}

// ─── Classic Editor helpers ────────────────────────────────────────────────

/** Sets title in the Classic Editor. */
export async function setClassicTitle(page: Page, title: string): Promise<void> {
  await page.locator('#title').fill(title);
}

/**
 * Writes raw content into the Classic Editor text area (Text mode).
 * Switches to Text tab first to bypass TinyMCE.
 */
export async function setClassicContent(page: Page, content: string): Promise<void> {
  const textTab = page.locator('#content-html');
  await textTab.click();
  await page.locator('#content').fill(content);
}

// ─── Publish helpers ───────────────────────────────────────────────────────

/**
 * Publishes a Gutenberg page and returns the front-end URL.
 */
export async function publishGutenbergPage(page: Page): Promise<string> {
  // Click the top-right "Publish" button
  const publishBtn = page.locator(
    'button.editor-post-publish-button, button[aria-label="Publish"]'
  ).first();
  await publishBtn.click();

  // Confirm in the publish panel if it appears
  const confirmBtn = page.locator(
    'button.editor-post-publish-button__button:visible'
  );
  if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await confirmBtn.click();
  }

  // Wait for the "Post published" / "Page published" notice
  await expect(
    page.locator('.components-snackbar, .notice-success, [aria-label="Post published."]')
  ).toBeVisible({ timeout: 20_000 });

  // Extract front-end URL from the "View Page" link
  const viewLink = page.locator('a:has-text("View Page"), a:has-text("View Post")').first();
  const href = await viewLink.getAttribute('href') ?? '';
  return href;
}

/**
 * Publishes a Classic Editor page and returns the front-end URL.
 */
export async function publishClassicPage(page: Page): Promise<string> {
  await page.locator('#publish').click();
  await page.waitForLoadState('domcontentloaded');

  const viewLink = page.locator('#message a:has-text("View Page"), #message a:has-text("View page")').first();
  await expect(viewLink).toBeVisible({ timeout: 15_000 });
  return (await viewLink.getAttribute('href')) ?? '';
}
