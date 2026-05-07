import { test, expect } from '@playwright/test';
import {
  openWithElementor,
  publishElementorPage,
} from '../../helpers/page-utils';

const SOURCE_NAME = 'YouTube';
const SOURCE_URL  = 'https://www.youtube.com/watch?v=5zWTInJqD5k';
const SEEDED_SLUG = 'ep-elementor-youtube';
const PRO_REQUIRED = true;

// EmbedPress's Elementor widget for YouTube exposes its source-specific
// controls only when EmbedPress Pro is active. Skip the suite otherwise.
test.beforeAll(async ({ browser }) => {
  if (!PRO_REQUIRED) return;
  const ctx  = await browser.newContext({ storageState: '.auth/state.json' });
  const page = await ctx.newPage();
  await page.goto('/wp-admin/plugins.php');
  const proRow = page.locator('tr[data-plugin^="embedpress-pro/"]:has(.plugin-title)');
  const proActive =
    (await proRow.count()) === 1 &&
    (await proRow.evaluate((el) => el.classList.contains('active')));
  await ctx.close();
  test.skip(!proActive, 'EmbedPress Pro inactive — skipping Pro-only source');
});

test.describe(`Elementor create flow — ${SOURCE_NAME}`, () => {
  test('configure YouTube Pro controls, save, verify iframe params', async ({ page }) => {
    // Resolve the seeded page's post ID via the body class.
    await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'domcontentloaded' });
    const postId = await page.evaluate(() => {
      // For pages WordPress emits `page-id-<n>` (not `postid-` like for posts).
      const m = document.body.className.match(/page-id-(\d+)/);
      return m ? Number(m[1]) : null;
    });
    expect(
      postId,
      'seeded page not found — run `npm run seed -- --source YouTube`',
    ).toBeTruthy();

    // Open the seeded page in Elementor and click the existing widget so
    // the panel reflects its (already-set) URL — then layer the Pro controls.
    await openWithElementor(page, postId!);

    // Elementor renders the canvas inside a preview iframe; the EmbedPress
    // widget is in there. Locate it via frameLocator and click — the Elementor
    // panel (outer document) updates with that widget's controls.
    const preview = page.frameLocator(
      '#elementor-preview-iframe, iframe[name="elementor-preview-iframe"]',
    );
    const widget = preview.locator('.elementor-widget-embedpres_elementor').first();
    await expect(widget).toBeVisible({ timeout: 30_000 });
    await widget.click();

    // Wait for the YouTube auto-play control to render — it's the cheapest
    // YouTube-specific control to wait on, and confirms the widget panel
    // recognised the URL as a YouTube source.
    const autoplayControl = page.locator(
      '.elementor-control-embedpress_pro_youtube_auto_play',
    );
    await expect(autoplayControl).toBeVisible({ timeout: 20_000 });

    // ── Configure 4 controls ────────────────────────────────────────────────
    // 1. Auto play → "yes"
    await autoplayControl.locator('label.elementor-switch').click();

    // 2. Display Controls → 0 (hidden)
    await page
      .locator('.elementor-control-embedpress_pro_youtube_display_controls select')
      .selectOption('0');

    // 3. Progress bar color → white
    await page
      .locator('.elementor-control-embedpress_pro_youtube_progress_bar_color select')
      .selectOption('white');

    // 4. End time → 120 seconds
    await page
      .locator('.elementor-control-embedpress_pro_youtube_end_time input')
      .fill('120');

    const frontUrl = await publishElementorPage(page);
    await page.goto(frontUrl || `/${SEEDED_SLUG}/`, { waitUntil: 'load' });

    const iframe = page.locator('iframe[src*="youtube"]').first();
    await expect(iframe).toBeVisible({ timeout: 30_000 });

    // ── Per-control assertions on the iframe src ────────────────────────────
    // The Pro YouTube provider maps the controls above onto query params.
    const src = (await iframe.getAttribute('src')) ?? '';
    expect(src, `unexpected iframe src: ${src}`).toMatch(/[?&]autoplay=1/);
    expect(src).toMatch(/[?&]controls=0/);
    expect(src).toMatch(/[?&]color=white/);
    expect(src).toMatch(/[?&]end=120/);
  });
});
