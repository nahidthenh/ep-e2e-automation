import { Page, expect, Locator } from '@playwright/test';

// ─── Embed verification ────────────────────────────────────────────────────

/**
 * Navigates to a front-end page and asserts that EmbedPress rendered content.
 *
 * @param requireIframe  When true (default), asserts a real YouTube <iframe>
 *   is present. Set to false for create-flow tests running in Docker without
 *   external network — the oEmbed API call to YouTube will fail, so only the
 *   EmbedPress block container is checked.
 */
export async function verifyYouTubeEmbedOnPage(
  page: Page,
  url: string,
  { requireIframe = true }: { requireIframe?: boolean } = {}
): Promise<void> {
  // 'networkidle' is unreliable with YouTube iframes (they keep polling);
  // 'load' fires once the DOM + render-blocking resources are ready.
  await page.goto(url, { waitUntil: 'load' });

  // Primary: the EmbedPress container.
  //   - embedpress/embedpress block → .embedpress-wrapper / .ep-embed-content-wraper
  //   - embedpress/youtube-block   → .ose-youtube.wp-block-embed-youtube
  //   - Classic shortcode          → .embedpress-wrapper
  //   - Elementor widget           → [class*="embedpress"]
  const wrapper: Locator = page.locator(
    '.embedpress-wrapper, .ep-embed-content-wraper, ' +
    '.ose-youtube, .wp-block-embed-youtube, [class*="embedpress"]'
  ).first();

  await expect(wrapper).toBeVisible({ timeout: 30_000 });

  if (!requireIframe) return;

  // Secondary: actual iframe (may require clicking a play-button overlay)
  const iframe = page.locator('iframe[src*="youtube.com"]').first();
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

  await expect(iframe).toHaveAttribute('src', /youtube\.com/i);
}

/**
 * Verifies the EmbedPress block is present in the Gutenberg editor.
 * Accepts any block state (preview, error, or placeholder with URL filled) —
 * actual embed rendering requires external network which may not be available in CI.
 */
export async function verifyEmbedPreviewInEditor(page: Page): Promise<void> {
  // Accept the block in any state: rendered embed, error message, or placeholder
  const block = page.locator(
    '.wp-block-embedpress-embedpress, ' +
    '[data-type="embedpress/embedpress"], ' +
    '.wp-block[data-type*="embedpress"], ' +
    // EmbedPress placeholder when URL is entered (block IS inserted even if embed fails)
    '.block-editor-block-list__block:has([value*="youtube.com"]), ' +
    '.block-editor-block-list__block:has(.components-placeholder)'
  ).first();
  await expect(block).toBeVisible({ timeout: 20_000 });
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
  // EmbedPress registers its widget as "embedpres_elementor" (intentional typo in plugin)
  const widget = page.locator(
    `.elementor-element-wrapper[data-widget_type*="embedpres"],` +
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
  // EmbedPress Elementor widget control key is "embedpress_embeded_link"
  const urlInput = page.locator(
    '[data-setting="embedpress_embeded_link"] input, ' +
    '.elementor-control-embedpress_embeded_link input, ' +
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
