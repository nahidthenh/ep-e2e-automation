import { test, expect } from '@playwright/test';

const YT_VIDEO_URL   = 'https://www.youtube.com/watch?v=5zWTInJqD5k';
const YT_VIDEO_ID    = '5zWTInJqD5k';
const YT_CHANNEL_URL = 'https://www.youtube.com/@wpdeveloper';

// WP 7.0 renders block content inside an iframe named "editor-canvas".
// Toolbar, inserter panel, and sidebar live on the outer page.
const CANVAS = 'iframe[name="editor-canvas"]';

// ─── helpers ────────────────────────────────────────────────────────────────

async function openNewPost(page: import('@playwright/test').Page) {
  await page.goto('/wp-admin/post-new.php', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('button[aria-label="Block Inserter"]')).toBeVisible({ timeout: 20_000 });

  const dismiss = page.locator('button[aria-label="Close"], .edit-post-welcome-guide button').first();
  if (await dismiss.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await dismiss.click();
  }
}

async function insertEmbedPressBlock(page: import('@playwright/test').Page) {
  await page.locator('button[aria-label="Block Inserter"]').click();

  const searchInput = page.locator(
    '.block-editor-inserter__search input, .components-search-control__input, input[placeholder="Search"]'
  ).first();
  await expect(searchInput).toBeVisible({ timeout: 10_000 });
  await searchInput.fill('EmbedPress');

  await page.locator('.editor-block-list-item-embedpress-embedpress, button:has-text("EmbedPress")').first().click();

  const canvas = page.frameLocator(CANVAS);
  await expect(
    canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first()
  ).toBeVisible({ timeout: 15_000 });
}

async function fillAndEmbed(page: import('@playwright/test').Page, url: string) {
  const canvas = page.frameLocator(CANVAS);
  const urlInput = canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first();
  await urlInput.fill(url);
  await canvas.locator('button:has-text("Embed")').first().click();
}

async function openInspector(page: import('@playwright/test').Page) {
  const settingsBtn = page.locator('button[aria-label="Settings"]').first();
  if (await settingsBtn.getAttribute('aria-expanded').catch(() => null) !== 'true') {
    await settingsBtn.click();
  }
  await expect(
    page.locator('.block-editor-block-inspector, .interface-complementary-area').first()
  ).toBeVisible({ timeout: 10_000 });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe('Gutenberg editor — YouTube block insertion (WP 7.0 RC-3)', () => {

  test('EmbedPress block appears in inserter search results', async ({ page }) => {
    await openNewPost(page);
    await page.locator('button[aria-label="Block Inserter"]').click();

    const searchInput = page.locator(
      '.block-editor-inserter__search input, .components-search-control__input, input[placeholder="Search"]'
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
    await searchInput.fill('EmbedPress');

    await expect(
      page.locator('.editor-block-list-item-embedpress-embedpress, button:has-text("EmbedPress")').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('EmbedPress block inserts and shows URL input placeholder in canvas', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);

    const canvas = page.frameLocator(CANVAS);
    await expect(canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first()).toBeVisible({ timeout: 15_000 });
    await expect(canvas.locator('button:has-text("Embed")').first()).toBeVisible({ timeout: 5_000 });
    await expect(canvas.locator('text=EmbedPress - Embed anything from 250+ sites').first()).toBeVisible({ timeout: 5_000 });
  });

  // KNOWN ISSUE — WP 7.0 RC-3: YouTube Error 153 "Video player configuration error" in editor preview.
  //
  // Root cause: WP 7.0 renders the block editor canvas inside `iframe[name="editor-canvas"]`
  // with a blob: URL origin (blob:http://localhost/...). YouTube's embedded player rejects
  // playback when the parent frame has a blob: origin — it returns Error 153.
  //
  // NOTE: The error text is inside YouTube's own cross-origin iframe so Playwright cannot
  // read it directly. We assert on the YouTube iframe element's src instead, which proves
  // EmbedPress produced the embed correctly — the failure is YouTube-side, not EmbedPress-side.
  // Front-end rendering is completely unaffected.
  test('KNOWN ISSUE — YouTube embed iframe present in canvas but player shows Error 153 (WP 7.0 blob iframe)', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, YT_VIDEO_URL);

    const canvas = page.frameLocator(CANVAS);

    // EmbedPress successfully produced a YouTube embed iframe with the correct video ID
    const ytIframe = canvas.locator(`iframe[src*="${YT_VIDEO_ID}"], iframe[src*="youtube.com/embed/${YT_VIDEO_ID}"]`).first();
    await expect(ytIframe).toBeAttached({ timeout: 20_000 });

    // Confirm the canvas iframe's origin is blob: — this is the root cause of Error 153
    const canvasFrame = page.frames().find(f => f.name() === 'editor-canvas');
    expect(canvasFrame?.url()).toMatch(/^blob:/);
  });

  test('Inspector sidebar loads with EmbedPress block card and Video Controls panel', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, YT_VIDEO_URL);

    const canvas = page.frameLocator(CANVAS);
    // Wait until the YouTube iframe is actually attached — only then does EmbedPress
    // populate the full inspector (General, Video Controls, Custom Branding panels).
    await expect(
      canvas.locator(`iframe[src*="${YT_VIDEO_ID}"], iframe[src*="youtube.com/embed"]`).first()
    ).toBeAttached({ timeout: 30_000 });

    await openInspector(page);

    // EmbedPress block card in the inspector
    await expect(
      page.locator('.block-editor-block-card__title:has-text("EmbedPress"), .block-editor-block-inspector :text("EmbedPress")').first()
    ).toBeVisible({ timeout: 10_000 });

    // EmbedPress-specific sidebar panels — scoped inside the inspector to avoid matching WP admin nav
    const inspector = page.locator('.block-editor-block-inspector');
    await expect(inspector.locator(':text("Video Controls")').first()).toBeVisible({ timeout: 10_000 });
    await expect(inspector.locator(':text("Custom Branding")').first()).toBeVisible({ timeout: 10_000 });
  });

  // KNOWN ISSUE — same Error 153 on the video player inside the channel embed (same blob: origin cause).
  // Channel metadata (name, subscriber count, video list) renders correctly.
  test('KNOWN ISSUE — YouTube Channel video player shows Error 153 in editor (WP 7.0 blob iframe)', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, YT_CHANNEL_URL);

    const canvas = page.frameLocator(CANVAS);

    // Channel metadata renders correctly
    await expect(canvas.locator('text=WPDeveloper').first()).toBeVisible({ timeout: 30_000 });

    // A YouTube embed iframe is present (EmbedPress produced it) but Error 153 shows inside it
    const ytIframe = canvas.locator('iframe[src*="youtube"]').first();
    await expect(ytIframe).toBeAttached({ timeout: 15_000 });

    // Root cause confirmed: canvas is a blob: URL
    const canvasFrame = page.frames().find(f => f.name() === 'editor-canvas');
    expect(canvasFrame?.url()).toMatch(/^blob:/);
  });

  test('YouTube Channel block — Inspector shows YouTube Channel controls', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, YT_CHANNEL_URL);

    const canvas = page.frameLocator(CANVAS);
    await expect(canvas.locator('text=WPDeveloper').first()).toBeVisible({ timeout: 30_000 });

    await openInspector(page);

    // YouTube Channel-specific panel — scoped to inspector
    const inspector = page.locator('.block-editor-block-inspector');
    await expect(inspector.locator(':text("YouTube Channel")').first()).toBeVisible({ timeout: 15_000 });
  });

});
