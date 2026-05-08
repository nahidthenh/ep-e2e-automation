import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-elementor-youtube-channel-controls';

// Same control matrix as the Gutenberg variant. Note Elementor passes
// `gapbetweenvideos` as `{ unit: "px", size: 10 }` in widget settings; the
// rendered DOM still ends up with `data-pagesize="3"` and the same hidden
// pagination, so the front-end assertions are identical.
test.describe('Elementor verify — YouTube Channel (controls toggled)', () => {
  test('seeded page honours pagesize, ispagination, gapbetweenvideos', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();

    const wrapper = page.locator('[data-embed-type="YoutubeChannel"]').first();
    await expect(wrapper).toBeVisible({ timeout: 30_000 });
    await expect(wrapper.locator('.ep-player-wrap.layout-gallery')).toBeVisible();

    const cards = wrapper.locator('.content__wrap > .item[data-vid]');
    await expect(cards).toHaveCount(3);

    const pagination = wrapper.locator('.ep-youtube__content__pagination').first();
    await expect(pagination).toBeHidden();

    await expect(wrapper.locator('.ep-prev')).toHaveAttribute('data-pagesize', '3');
  });
});
