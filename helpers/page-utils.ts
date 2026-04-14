import { Page, expect, Locator } from '@playwright/test';

/** YouTube embed URL fragment used by EmbedPress. */
const YT_EMBED_PATTERN = /youtube\.com\/embed/i;

// ─── Embed verification ────────────────────────────────────────────────────

/**
 * Navigates to a front-end page (by absolute URL or path) and asserts
 * that an EmbedPress YouTube iframe is rendered.
 *
 * EmbedPress can render the embed in two ways:
 *   a) A real <iframe src="https://www.youtube.com/embed/...">  (direct embed)
 *   b) A lazy/privacy wrapper: <div class="embedpress-wrapper"> containing
 *      a click-to-play element — the iframe only appears after interaction.
 *
 * We assert on the wrapper's presence first, then check for the iframe.
 */
export async function verifyYouTubeEmbedOnPage(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'networkidle' });

  // Primary: the EmbedPress container
  const wrapper: Locator = page.locator(
    '.embedpress-wrapper, .ep-embed-content-wraper, [class*="embedpress"]'
  ).first();

  await expect(wrapper).toBeVisible({ timeout: 30_000 });

  // Secondary: actual iframe (may require clicking a play-button overlay)
  const iframe = page.locator('iframe[src*="youtube.com/embed"]').first();
  const iframeVisible = await iframe.isVisible({ timeout: 5_000 }).catch(() => false);

  if (!iframeVisible) {
    // Some EmbedPress themes show a thumbnail/overlay; click to load
    const playOverlay = page.locator(
      '.embedpress-play-button, [class*="play"], .ep-thumbnail'
    ).first();
    if (await playOverlay.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await playOverlay.click();
    }
    await expect(iframe).toBeVisible({ timeout: 15_000 });
  }

  await expect(iframe).toHaveAttribute('src', YT_EMBED_PATTERN);
}

/**
 * Same check but works inside an Elementor iframe context if the editor
 * is still open. For front-end verification use `verifyYouTubeEmbedOnPage`.
 */
export async function verifyEmbedPreviewInEditor(page: Page): Promise<void> {
  // Gutenberg preview is inside the editor canvas
  const blockWrapper = page.locator(
    '.wp-block-embedpress-embedpress, [data-type="embedpress/embedpress"]'
  ).first();
  await expect(blockWrapper).toBeVisible({ timeout: 20_000 });
}

// ─── URL utilities ─────────────────────────────────────────────────────────

/** Derives the slug-based front-end URL from a page slug. */
export function frontendUrl(slug: string, base?: string): string {
  const b = base ?? (process.env.WP_URL ?? 'http://localhost:8080');
  return `${b.replace(/\/$/, '')}/${slug}/`;
}

// ─── Elementor helpers ─────────────────────────────────────────────────────

/**
 * Opens a published page in the Elementor editor.
 * Expects the browser to already be logged into WP admin.
 */
export async function openWithElementor(page: Page, pageId: number): Promise<void> {
  await page.goto(`/wp-admin/post.php?post=${pageId}&action=elementor`);
  await waitForElementorReady(page);
}

/** Waits for Elementor editor to finish loading. */
export async function waitForElementorReady(page: Page): Promise<void> {
  // Wait for the Elementor panel + canvas to be interactive
  await page.waitForSelector('#elementor-panel-inner', { timeout: 60_000 });
  // Dismiss any Elementor modal/tour that appears on first use
  const skipBtn = page.locator(
    'button:has-text("Skip"), button:has-text("Got it"), .dialog-button-cancel'
  ).first();
  if (await skipBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await skipBtn.click();
  }
}

/**
 * Searches for an Elementor widget and drags it to the first available
 * drop zone (empty column) in the canvas.
 */
export async function addElementorWidget(page: Page, widgetName: string): Promise<void> {
  const searchInput = page.locator(
    '.elementor-search-input, [placeholder="Search Widget..."]'
  ).first();
  await searchInput.fill(widgetName);

  // Wait for filtered results
  const widget = page.locator(
    `.elementor-element-wrapper[data-widget_type*="${widgetName.toLowerCase()}"],` +
    `.elementor-widget-title:has-text("${widgetName}")`
  ).first();
  await expect(widget).toBeVisible({ timeout: 15_000 });

  // Drop zone: first empty section column in the canvas
  const dropZone = page.locator(
    '.elementor-drop-zone, .elementor-empty-view .elementor-first-add'
  ).first();
  await expect(dropZone).toBeVisible({ timeout: 10_000 });

  await widget.dragTo(dropZone);

  // Confirm widget settings panel opened
  await expect(
    page.locator('.elementor-panel-box-content')
  ).toBeVisible({ timeout: 10_000 });
}

/**
 * Fills the EmbedPress widget URL control in the Elementor panel.
 */
export async function setEmbedPressUrl(page: Page, url: string): Promise<void> {
  const urlInput = page.locator(
    '[data-setting="url"] input, ' +
    '.elementor-control-url .elementor-control-input-wrapper input'
  ).first();
  await expect(urlInput).toBeVisible({ timeout: 10_000 });
  await urlInput.fill(url);
  await urlInput.press('Enter');

  // Give EmbedPress a moment to validate / preview the URL
  await page.waitForTimeout(2_000);
}

/**
 * Publishes / updates the Elementor page and returns to the front-end URL.
 */
export async function publishElementorPage(page: Page): Promise<string> {
  const updateBtn = page.locator(
    '#elementor-panel-footer-saver-publish, ' +
    'button.elementor-button-success:has-text("Update"), ' +
    'button.elementor-button-success:has-text("Publish")'
  ).first();
  await updateBtn.click();

  // Wait for "Changes saved" toast
  await expect(
    page.locator('.elementor-panel-footer-sub-actions, [class*="toast"], #elementor-panel-saver-button-publish-label')
  ).toBeVisible({ timeout: 20_000 });

  // Extract the front-end URL from the "View Page" button in the panel footer
  const viewBtn = page.locator(
    'a#elementor-panel-footer-settings, a[title="View Page"], #e-panel-footer-page-settings'
  ).first();
  const href = await viewBtn.getAttribute('href').catch(() => null);
  return href ?? '';
}
