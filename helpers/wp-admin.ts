import { Page, Locator, expect } from '@playwright/test';

// ─── Navigation ────────────────────────────────────────────────────────────

export async function goToNewGutenbergPage(page: Page): Promise<void> {
  await page.goto('/wp-admin/post-new.php?post_type=page');
  await page.waitForLoadState('domcontentloaded');
  // Wait until Gutenberg's React app has booted (canvas or modal will appear)
  await waitForGutenbergReady(page);
  // Suppress the WP 6.9 "Choose a pattern" prompt via wp.data before any UI work
  await suppressStarterPatternPrompt(page);
  await dismissWelcomeModal(page);
}

export async function goToNewClassicPage(page: Page): Promise<void> {
  // classic-editor-replace=classic → plain URL always opens Classic Editor.
  await page.goto('/wp-admin/post-new.php?post_type=page');
  await page.waitForLoadState('domcontentloaded');
  await page.locator('#title').waitFor({ state: 'visible', timeout: 15_000 });
}

// ─── Gutenberg editor canvas ───────────────────────────────────────────────
// WP 6.2–6.8: block editor rendered inside <iframe name="editor-canvas">.
// WP 6.9+:    canvas iframe removed; everything is in the outer document.

/**
 * Returns a Locator scoped to `selector` within the Gutenberg editing surface.
 * Automatically detects whether the canvas iframe exists (WP ≤ 6.8) or
 * the editor renders directly in the outer document (WP 6.9+).
 */
export async function editorLocator(page: Page, selector: string): Promise<Locator> {
  const hasCanvas = (await page.locator('iframe[name="editor-canvas"]').count()) > 0;
  if (hasCanvas) {
    return page.frameLocator('iframe[name="editor-canvas"]').locator(selector);
  }
  return page.locator(selector);
}

/**
 * Waits until Gutenberg's React app has booted.
 * Resolves when the editor title input, canvas iframe, or a dialog is present —
 * whichever signals that JS is done initialising.
 */
async function waitForGutenbergReady(page: Page): Promise<void> {
  try {
    await Promise.race([
      // WP 6.9+: title is in the outer document
      page.locator('[aria-label="Add title"], .editor-post-title__input').waitFor({ state: 'visible', timeout: 30_000 }),
      // WP ≤ 6.8: canvas iframe
      page.locator('iframe[name="editor-canvas"]').waitFor({ state: 'attached', timeout: 30_000 }),
      // Any modal dialog (e.g. "Choose a pattern")
      page.locator('[role="dialog"]').first().waitFor({ state: 'visible', timeout: 30_000 }),
    ]);
  } catch {
    // Timed out waiting — proceed anyway and let subsequent assertions catch real failures
  }
}

// ─── Gutenberg helpers ─────────────────────────────────────────────────────

/**
 * Tells Gutenberg (via wp.data) not to show the "Choose a pattern" starter
 * prompt introduced in WP 6.9. Must be called after the Gutenberg JS bundle
 * has loaded (i.e. after waitForGutenbergReady).
 * Falls back silently if the API is unavailable (older WP / non-block editor).
 */
async function suppressStarterPatternPrompt(page: Page): Promise<void> {
  await page.evaluate(() => {
    try {
      const wp = (window as any).wp;
      if (!wp?.data) return;
      const { dispatch } = wp.data;
      // WP 6.9: disable the start-fresh / pattern chooser prompt
      dispatch('core/editor')?.disableStarterPatternPrompt?.();
      // Persist preference so it survives store re-hydration
      dispatch('@wordpress/preferences')?.set?.('core', 'enableChoosePatternModal', false);
      dispatch('@wordpress/preferences')?.set?.('core/edit-post', 'welcomeGuide', false);
    } catch {
      // Silently ignore — not all WP versions expose these dispatchers
    }
  });
}

/**
 * Dismisses any modal that can block the editor on a new page:
 *  - WP 6.9 "Choose a pattern" starter dialog
 *  - Gutenberg welcome guide
 *
 * Must be called AFTER waitForGutenbergReady() so React has already rendered.
 */
async function dismissWelcomeModal(page: Page): Promise<void> {
  // Generic catch-all: any visible Gutenberg modal overlay (command palette,
  // pattern picker, welcome guide, etc.) intercepts clicks on the inserter
  // / publish button. Press Escape up to 3 times until no overlay remains.
  const anyOverlay = page.locator('.components-modal__screen-overlay').first();
  for (let i = 0; i < 3; i++) {
    if (!(await anyOverlay.isVisible({ timeout: 500 }).catch(() => false))) break;
    await page.keyboard.press('Escape');
    await anyOverlay.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
  }

  // "Choose a pattern" dialog (WP 6.9+)
  const patternDialog = page.locator(
    '[aria-label="Choose a pattern"], div[role="dialog"]:has(h1:text("Choose a pattern"))'
  );
  if (await patternDialog.first().isVisible({ timeout: 4_000 }).catch(() => false)) {
    // Escape is the most reliable way to close WP modal dialogs
    await page.keyboard.press('Escape');
    // Give the close animation a moment
    await patternDialog.first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});

    // Fallback: click the close button if Escape didn't work
    if (await patternDialog.first().isVisible().catch(() => false)) {
      const closeBtn = page.locator(
        'button[aria-label="Close"], ' +
        '.components-modal__header button[aria-label="Close"], ' +
        '.components-modal__header-actions button'
      ).first();
      await closeBtn.click({ timeout: 5_000 }).catch(() => {});
      await patternDialog.first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
    }
  }

  // Classic welcome guide
  const welcomeModal = page.locator('.edit-post-welcome-guide, .components-guide__finish-button');
  if (await welcomeModal.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
    await page.keyboard.press('Escape');
    await welcomeModal.first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});

    if (await welcomeModal.first().isVisible().catch(() => false)) {
      const closeBtn = page.locator(
        '[aria-label="Close"], .edit-post-welcome-guide button, .components-guide__finish-button'
      ).first();
      await closeBtn.click().catch(() => {});
      await welcomeModal.first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
    }
  }
}

/**
 * Types the page title in Gutenberg.
 * Works with both WP ≤ 6.8 (canvas iframe) and WP 6.9+ (outer document).
 */
export async function setGutenbergTitle(page: Page, title: string): Promise<void> {
  // Order matters: try the editable input/contenteditable first. In WP 6.9+
  // there's also a button in the document tools toolbar that *displays*
  // the title and opens the command palette on click — `[aria-label="Add title"]`
  // can match it. We must click the actual editable surface, not that button.
  const titleInput = (await editorLocator(
    page,
    '.editor-post-title__input, ' +
      'h1.wp-block-post-title[contenteditable="true"], ' +
      'h1[contenteditable="true"][aria-label="Add title"], ' +
      '[aria-label="Add title"]:not(button)',
  )).first();
  await expect(titleInput).toBeVisible({ timeout: 20_000 });
  await titleInput.click();
  await titleInput.fill(title);
  // Defocus so the command-palette trigger button can't auto-open later.
  await titleInput.blur().catch(() => {});
}

/**
 * Inserts a block by name using the block inserter search.
 * Returns when the block is selected in the editor.
 */
export async function insertBlock(page: Page, blockName: string): Promise<void> {
  // Ensure no modal is blocking the editor before we open the inserter
  await dismissWelcomeModal(page);

  // Click into the editor canvas so focus isn't on a toolbar button that
  // could auto-open the command palette / a popover.
  const canvas = page.locator(
    '.block-editor-block-list__layout, .editor-styles-wrapper',
  ).first();
  await canvas.click({ position: { x: 10, y: 10 } }).catch(() => {});

  // One more dismissal pass in case the click into the canvas surfaced a popover.
  await dismissWelcomeModal(page);

  // Open inserter
  const inserterBtn = page.locator(
    'button[aria-label="Toggle block inserter"], button[aria-label="Block Inserter"]',
  ).first();
  // Skip if the inserter is already open (avoids the close-then-reopen toggle race).
  const alreadyOpen = (await inserterBtn.getAttribute('aria-expanded')) === 'true';
  if (!alreadyOpen) {
    await inserterBtn.click();
  }

  // Search
  const searchInput = page.locator(
    '[placeholder="Search"], [aria-label="Search for blocks and patterns"]'
  ).first();
  await searchInput.fill(blockName);

  // Click the matching result. Prefer ARIA `option` with exact name so that
  // searching "YouTube" picks EmbedPress's "YouTube" block and not
  // "YouTube Embed" (WP core's generic block, which appears alongside).
  let result = page.getByRole('option', { name: blockName, exact: true }).first();
  if ((await result.count()) === 0) {
    // Fallback for older WP block-editor markup.
    result = page.locator(
      `[role="option"]:has-text("${blockName}"), ` +
      `.block-editor-block-types-list__item[aria-label="${blockName}"]`,
    ).first();
  }
  await expect(result).toBeVisible({ timeout: 10_000 });

  // Ensure no modal overlay is intercepting clicks before we proceed
  await page.locator('.components-modal__screen-overlay').waitFor({ state: 'detached', timeout: 5_000 }).catch(() => {});

  await result.click();

  // Don't try to close the inserter here — the command palette overlay
  // (WP 6.x) frequently re-appears post-insert and blocks the toggle click.
  // Leaving the inserter open has no functional effect on subsequent steps.
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
 *
 * WP 6.9 publish flow:
 *   Click 1 → opens the "Are you ready to publish?" pre-publish panel
 *   Click 2 → the same header "Publish" button now confirms and publishes
 */
export async function publishGutenbergPage(page: Page): Promise<string> {
  // Primary "Publish" button selector — covers WP 6.x variants
  const publishBtnSelector =
    'button.editor-post-publish-button, ' +
    'button[aria-label="Publish"], ' +
    '.editor-header__settings button:has-text("Publish"), ' +
    'button.is-primary:has-text("Publish")';

  const publishBtn = page.locator(publishBtnSelector).first();
  await expect(publishBtn).toBeVisible({ timeout: 15_000 });
  await publishBtn.click();

  const snackbar = page.locator(
    '.components-snackbar, .notice-success, ' +
    '[aria-label="Post published."], [aria-label="Page published."]'
  );

  // WP 6.9: the "Publish" button is a toggle. Clicking it opens a pre-publish
  // checks panel. The confirm button is inside the panel header.
  const alreadyPublished = await snackbar.isVisible({ timeout: 3_000 }).catch(() => false);

  if (!alreadyPublished) {
    // Panel should have appeared — find the confirm "Publish" button inside it
    const panelPublishBtn = page.locator(
      '.editor-post-publish-panel__header-publish-button button'
    ).first();
    if (await panelPublishBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await panelPublishBtn.click();
    }
    // Fallback for older WP that publishes without a panel
  }

  // Wait for the published snackbar
  await expect(snackbar).toBeVisible({ timeout: 30_000 });

  // Extract the front-end URL. WP 6.9 snackbar uses <button> not <a>, so
  // we read the permalink from the WP REST API using the post ID from the editor URL.
  const editorUrl = page.url(); // wp-admin/post.php?post=X&action=edit
  const postIdMatch = editorUrl.match(/post=(\d+)/);
  if (postIdMatch) {
    const permalink = await page.evaluate(async (id: number) => {
      const r = await fetch(`/wp-json/wp/v2/pages/${id}?_fields=link`, { credentials: 'include' });
      const j: { link?: string } = await r.json();
      return j.link ?? '';
    }, Number(postIdMatch[1]));
    if (permalink) return permalink;
  }

  // Fallback: try the <a href> in the snackbar (WP ≤ 6.8 only)
  const viewLink = page.locator('a:has-text("View Page"), a:has-text("View Post")').first();
  return (await viewLink.getAttribute('href').catch(() => null)) ?? '';
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
