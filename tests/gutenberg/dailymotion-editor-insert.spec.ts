import { test, expect } from '@playwright/test';

const DAILYMOTION_URL = 'https://www.dailymotion.com/video/x8odzbr';
const DAILYMOTION_ID  = 'x8odzbr';

const CANVAS = 'iframe[name="editor-canvas"]';

// ─── helpers ────────────────────────────────────────────────────────────────

async function openNewPost(page: import('@playwright/test').Page) {
  await page.goto('/wp-admin/post-new.php', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('button[aria-label="Block Inserter"]')).toBeVisible({ timeout: 20_000 });
  const dismiss = page.locator('button[aria-label="Close"], .edit-post-welcome-guide button').first();
  if (await dismiss.isVisible({ timeout: 3_000 }).catch(() => false)) await dismiss.click();
}

async function insertEmbedPressBlock(page: import('@playwright/test').Page) {
  await page.locator('button[aria-label="Block Inserter"]').click();
  const search = page.locator(
    '.block-editor-inserter__search input, .components-search-control__input, input[placeholder="Search"]'
  ).first();
  await expect(search).toBeVisible({ timeout: 10_000 });
  await search.fill('EmbedPress');
  await page.locator('.editor-block-list-item-embedpress-embedpress, button:has-text("EmbedPress")').first().click();

  const canvas = page.frameLocator(CANVAS);
  await expect(
    canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first()
  ).toBeVisible({ timeout: 15_000 });
}

async function fillAndEmbed(page: import('@playwright/test').Page, url: string) {
  const canvas = page.frameLocator(CANVAS);
  await canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first().fill(url);
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

test.describe('Gutenberg editor — Dailymotion block insertion (WP 7.0 RC-3)', () => {

  test('EmbedPress block inserts and accepts Dailymotion URL', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);

    const canvas = page.frameLocator(CANVAS);
    await expect(canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first()).toBeVisible({ timeout: 10_000 });
    await expect(canvas.locator('button:has-text("Embed")').first()).toBeVisible({ timeout: 5_000 });
  });

  // KNOWN ISSUE — EmbedPress's REST API POST endpoint does not correctly resolve
  // Dailymotion URLs in the editor. When the Gutenberg block sends:
  //   POST /wp-json/embedpress/v1/oembed/embedpress
  //   body: { url: "https://www.dailymotion.com/video/x8odzbr" }
  // the response is just the raw URL string instead of embed HTML.
  // The same endpoint correctly resolves YouTube, Vimeo, and other providers via POST.
  // The GET endpoint (?url=...) DOES work for Dailymotion — the POST handler is bugged.
  //
  // The UI outcome depends on whether EmbedPress's WP oEmbed fallback succeeds:
  // - Warm cache: Dailymotion player iframe appears (fallback to WP native oEmbed)
  // - Cold cache: "Sorry, we could not embed that content." error is shown
  //
  // Either way, Dailymotion does NOT show a blob:-origin security error (unlike YouTube/Vimeo).
  test('KNOWN ISSUE — Dailymotion POST endpoint returns raw URL; UI outcome varies by oEmbed cache', async ({ page }) => {
    // Verify the API-level bug directly — this is reliable regardless of UI caching
    await page.goto('/wp-admin/post-new.php', { waitUntil: 'domcontentloaded' });

    const apiResponse = await page.evaluate(async (url) => {
      const nonce = (window as any).wpApiSettings?.nonce || '';
      const r = await fetch('/wp-json/embedpress/v1/oembed/embedpress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce,
        },
        body: JSON.stringify({ url }),
      });
      const body = await r.json();
      return { status: r.status, body, bodyType: typeof body };
    }, DAILYMOTION_URL);

    // The POST endpoint returns the raw URL string (bug) instead of oEmbed response object
    expect(apiResponse.status).toBe(200);
    expect(apiResponse.bodyType).toBe('string');
    expect(apiResponse.body).toBe(DAILYMOTION_URL);
  });

  // KNOWN ISSUE — block embedding is unreliable due to the POST endpoint bug above.
  // This test waits for the embed to settle then confirms:
  //   - no blob:-origin security error (Dailymotion allows blob: embedding unlike YT/Vimeo)
  //   - either a Dailymotion iframe OR a "could not embed" error appears (never stuck loading)
  test('KNOWN ISSUE — Dailymotion embed settles to iframe or error (no blob: security restriction)', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, DAILYMOTION_URL);

    const canvas = page.frameLocator(CANVAS);

    // Wait for embed to settle: either the DM iframe appears OR the error message shows.
    // Give up to 60s for the spinner to clear (server load may slow the fallback path).
    const iframeLocator  = canvas.locator(`iframe[src*="${DAILYMOTION_ID}"], iframe[src*="dailymotion.com"], iframe[src*="geo.dailymotion"]`).first();
    const errorLocator   = canvas.getByText(/Sorry, we could not embed/i).first();

    await Promise.race([
      expect(iframeLocator).toBeAttached({ timeout: 60_000 }).catch(() => null),
      expect(errorLocator).toBeVisible({ timeout: 60_000 }).catch(() => null),
    ]);

    const hasIframe = await iframeLocator.count();
    const hasError  = await errorLocator.count();

    // One of the two states must be reached
    expect(hasIframe + hasError, 'embed should settle to iframe or error').toBeGreaterThan(0);

    // Critical: Dailymotion does NOT block blob: origin, so no security error text
    const canvasFrame = page.frames().find(f => f.name() === 'editor-canvas');
    const canvasText = await canvasFrame?.locator('body').innerText({ timeout: 3_000 }).catch(() => '') ?? '';
    expect(canvasText.toLowerCase()).not.toContain('access to this content has been restricted');
    expect(canvasText.toLowerCase()).not.toContain('security of your connection');
  });

  // Inspector sidebar reflects the current embed state.
  // When the embed resolves (iframe present): General, Custom Branding, Ads Settings panels appear.
  // When the embed fails ("Sorry..."): only Advanced panel appears.
  // Either way, EmbedPress block card is always visible in the inspector.
  test('Inspector sidebar shows EmbedPress block card; full panels appear only when embed succeeds', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, DAILYMOTION_URL);

    const canvas = page.frameLocator(CANVAS);

    // Wait up to 60s for the embed to settle
    const iframeLocator = canvas.locator(`iframe[src*="dailymotion.com"], iframe[src*="geo.dailymotion"]`).first();
    const errorLocator  = canvas.getByText(/Sorry, we could not embed/i).first();
    await Promise.race([
      expect(iframeLocator).toBeAttached({ timeout: 60_000 }).catch(() => null),
      expect(errorLocator).toBeVisible({ timeout: 60_000 }).catch(() => null),
    ]);

    await openInspector(page);

    // EmbedPress block card is always present
    await expect(
      page.locator('.block-editor-block-card__title:has-text("EmbedPress"), .block-editor-block-inspector :text("EmbedPress")').first()
    ).toBeVisible({ timeout: 10_000 });

    const inspector = page.locator('.block-editor-block-inspector');

    // If the embed succeeded (iframe present), the full Dailymotion panels appear
    const embedSucceeded = (await iframeLocator.count()) > 0;
    if (embedSucceeded) {
      await expect(inspector.locator(':text("Custom Branding")').first()).toBeVisible({ timeout: 5_000 });
    } else {
      // Embed failed — only "Advanced" panel is shown (Video Controls / Custom Branding absent)
      await expect(inspector.locator(':text("Advanced")').first()).toBeVisible({ timeout: 5_000 });
    }
  });

});
