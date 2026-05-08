import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-youtube-channel-grid';
const PRO_REQUIRED = true;

// Grid layout for YouTube Channel is gated by `apply_filters('embedpress/is_allow_rander')`,
// which only EmbedPress Pro sets to true. With Pro inactive, EmbedPress falls
// back to gallery and this assertion fails — so we Pro-skip preemptively.
test.beforeAll(async ({ browser }) => {
  if (!PRO_REQUIRED) return;
  const ctx = await browser.newContext({ storageState: '.auth/state.json' });
  const page = await ctx.newPage();
  await page.goto('/wp-admin/plugins.php');
  const proRow = page.locator('tr[data-plugin^="embedpress-pro/"]:has(.plugin-title)');
  const proActive = (await proRow.count()) === 1
    && (await proRow.evaluate((el) => el.classList.contains('active')));
  await ctx.close();
  test.skip(!proActive, 'EmbedPress Pro inactive — grid layout requires Pro');
});

test.describe('Gutenberg verify — YouTube Channel (grid layout, Pro)', () => {
  test('seeded page renders the grid layout', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();

    const wrapper = page.locator('[data-embed-type="YoutubeChannel"]').first();
    await expect(wrapper).toBeVisible({ timeout: 30_000 });
    await expect(wrapper.locator('.ep-player-wrap.layout-grid')).toBeVisible();
    await expect(wrapper.locator('.channel-name', { hasText: 'WPDeveloper' })).toBeVisible();
  });
});
