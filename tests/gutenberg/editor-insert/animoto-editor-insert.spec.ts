import { test, expect } from '@playwright/test';

const ANIMOTO_URL = 'https://animoto.com/play/c9R1xmMV6mjZkYXunOaPCQ';

// WP 7.0 renders block content inside an iframe named "editor-canvas".
const CANVAS = 'iframe[name="editor-canvas"]';

// NOTE: Animoto is an EmbedPress PRO feature. The free-tier REST API endpoint
// (POST /wp-json/embedpress/v1/oembed/embedpress) returns the raw URL string
// instead of embed HTML for Animoto URLs. As a result, the editor shows
// "Sorry, we could not embed that content." and the inspector only shows the
// "Advanced" panel. This is expected PRO-gating behaviour, not a bug.

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

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe('Gutenberg editor — Animoto block insertion (WP 7.0 RC-3)', () => {

  test('EmbedPress block inserts and accepts Animoto URL', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);

    const canvas = page.frameLocator(CANVAS);
    await expect(canvas.locator('input[placeholder*="embed here"], input[placeholder*="Enter URL"]').first()).toBeVisible({ timeout: 10_000 });
    await expect(canvas.locator('button:has-text("Embed")').first()).toBeVisible({ timeout: 5_000 });
  });

  // Animoto is a PRO-only provider. With the free tier installed, the REST API
  // POST endpoint returns the raw URL string — the block shows the embed-failed
  // error and the inspector only exposes the "Advanced" panel.
  // With EmbedPress PRO active this test should be updated to assert a live embed.
  test('PRO GATE — Animoto shows embed error in editor (requires EmbedPress PRO)', async ({ page }) => {
    await openNewPost(page);
    await insertEmbedPressBlock(page);
    await fillAndEmbed(page, ANIMOTO_URL);

    const canvas = page.frameLocator(CANVAS);

    // Editor shows the embed-failed error — PRO feature not available
    await expect(
      canvas.getByText(/Sorry, we could not embed/i).first()
    ).toBeVisible({ timeout: 20_000 });

    // No embed iframe is produced
    const bodyHtml = await page.frames()
      .find(f => f.name() === 'editor-canvas')
      ?.locator('body').innerHTML({ timeout: 3_000 }).catch(() => '') ?? '';
    expect(bodyHtml).not.toContain('<iframe');

    // Inspector only shows the "Advanced" panel (no provider-specific controls)
    const settingsBtn = page.locator('button[aria-label="Settings"]').first();
    if (await settingsBtn.getAttribute('aria-expanded').catch(() => null) !== 'true') {
      await settingsBtn.click();
    }
    const inspector = page.locator('.block-editor-block-inspector');
    await expect(inspector.locator(':text("Advanced")').first()).toBeVisible({ timeout: 5_000 });
    await expect(inspector.locator(':text("Custom Branding")').first()).not.toBeVisible({ timeout: 2_000 });
  });

});
