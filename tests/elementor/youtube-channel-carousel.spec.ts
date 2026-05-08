import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-elementor-youtube-channel-carousel';
const PRO_REQUIRED = true;

test.beforeAll(async ({ browser }) => {
  if (!PRO_REQUIRED) return;
  const ctx = await browser.newContext({ storageState: '.auth/state.json' });
  const page = await ctx.newPage();
  await page.goto('/wp-admin/plugins.php');
  const proRow = page.locator('tr[data-plugin^="embedpress-pro/"]:has(.plugin-title)');
  const proActive = (await proRow.count()) === 1
    && (await proRow.evaluate((el) => el.classList.contains('active')));
  await ctx.close();
  test.skip(!proActive, 'EmbedPress Pro inactive — carousel layout requires Pro');
});

test.describe('Elementor verify — YouTube Channel (carousel layout, Pro)', () => {
  test('seeded page renders the carousel layout', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();

    const wrapper = page.locator('[data-embed-type="YoutubeChannel"]').first();
    await expect(wrapper).toBeVisible({ timeout: 30_000 });
    await expect(wrapper.locator('.ep-player-wrap.layout-carousel')).toBeVisible();
    await expect(wrapper.locator('.channel-name', { hasText: 'WPDeveloper' })).toBeVisible();
  });
});
