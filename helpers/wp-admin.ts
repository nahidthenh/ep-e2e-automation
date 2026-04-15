import { Page, FrameLocator, expect } from '@playwright/test';

// ─── Navigation ────────────────────────────────────────────────────────────

export async function goToNewGutenbergPage(page: Page): Promise<void> {
  // classic-editor-replace=classic means Classic Editor is the default.
  // `?classic-editor__forget` bypasses it and forces the block editor.
  await page.goto('/wp-admin/post-new.php?post_type=page&classic-editor__forget');
  await page.waitForLoadState('domcontentloaded');
  await dismissWelcomeModal(page);
}

export async function goToNewClassicPage(page: Page): Promise<void> {
  // classic-editor-replace=classic → plain URL always opens Classic Editor.
  await page.goto('/wp-admin/post-new.php?post_type=page');
  await page.waitForLoadState('domcontentloaded');
  await page.locator('#title').waitFor({ state: 'visible', timeout: 15_000 });
}

// ─── Gutenberg iframe canvas (WP 6.2+) ─────────────────────────────────────
// Since WP 6.2 the block editor renders inside <iframe name="editor-canvas">.
// Toolbar, inserter, and publish button remain in the outer document.

export function getEditorCanvas(page: Page): FrameLocator {
  return page.frameLocator('iframe[name="editor-canvas"]');
}

export async function goToAdminPagesList(page: Page): Promise<void> {
  await page.goto('/wp-admin/edit.php?post_type=page');
  await page.waitForLoadState('domcontentloaded');
}

// ─── Gutenberg helpers ─────────────────────────────────────────────────────

/**
 * Dismisses any modal that can block the editor on a new page:
 *  - WP 6.9 "Choose a pattern" starter dialog
 *  - Gutenberg welcome guide
 */
async function dismissWelcomeModal(page: Page): Promise<void> {
  // "Choose a pattern" dialog (WP 6.9+) — close via the X button
  const patternDialog = page.locator('[aria-label="Choose a pattern"],' +
    'div[role="dialog"]:has(h1:text("Choose a pattern"))');
  if (await patternDialog.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
    const closeBtn = page.locator(
      '[aria-label="Close"], ' +
      'button.components-button[aria-label*="Close"], ' +
      'button.components-modal__header-actions button'
    ).first();
    await closeBtn.click();
    await patternDialog.first().waitFor({ state: 'hidden', timeout: 5_000 });
  }

  // Classic welcome guide
  const welcomeModal = page.locator('.edit-post-welcome-guide, .components-guide__finish-button');
  if (await welcomeModal.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
    const closeBtn = page.locator(
      '[aria-label="Close"], .edit-post-welcome-guide button, .components-guide__finish-button'
    ).first();
    await closeBtn.click();
    await welcomeModal.first().waitFor({ state: 'hidden', timeout: 5_000 });
  }
}

/** Types the page title in Gutenberg. Targets the iframed editor canvas. */
export async function setGutenbergTitle(page: Page, title: string): Promise<void> {
  const canvas = getEditorCanvas(page);
  const titleInput = canvas.locator(
    '[aria-label="Add title"], .editor-post-title__input, h1[contenteditable="true"]'
  ).first();
  await expect(titleInput).toBeVisible({ timeout: 20_000 });
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
