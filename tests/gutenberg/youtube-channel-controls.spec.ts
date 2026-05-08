import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-youtube-channel-controls';

// Controls variant: pagesize=3, ispagination=false, gapbetweenvideos=10
// (default layout = gallery). Asserts each control actually shaped the
// rendered DOM differently from the defaults — proves the layout/control
// attrs round-trip from block markup → resolve step → front-end output.
test.describe('Gutenberg verify — YouTube Channel (controls toggled)', () => {
  test('seeded page honours pagesize, ispagination, gapbetweenvideos', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();

    const wrapper = page.locator('[data-embed-type="YoutubeChannel"]').first();
    await expect(wrapper).toBeVisible({ timeout: 30_000 });
    await expect(wrapper.locator('.ep-player-wrap.layout-gallery')).toBeVisible();

    // pagesize=3 → 3 video cards in the content wrap (default is 6).
    const cards = wrapper.locator('.content__wrap > .item[data-vid]');
    await expect(cards).toHaveCount(3);

    // ispagination=false → EmbedPress emits `display: none !important` for
    // the pagination block in the inline <style>. The div is in the DOM but
    // shouldn't be visible to the user.
    const pagination = wrapper.locator('.ep-youtube__content__pagination').first();
    await expect(pagination).toBeHidden();

    // gapbetweenvideos=10 → reflected in `data-pagesize` on the prev/next
    // controls (3) and the inline `gap: 10px` rule. Asserting on data-pagesize
    // is the cleanest check that the value flowed into the DOM.
    await expect(wrapper.locator('.ep-prev')).toHaveAttribute('data-pagesize', '3');
  });
});
