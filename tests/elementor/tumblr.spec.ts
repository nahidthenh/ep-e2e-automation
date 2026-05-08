import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-elementor-tumblr';
const POST_ID     = '776625642819256320';

test.describe('Elementor verify — Tumblr', () => {
  test('seeded page emits the tumblr embed scaffold', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'commit' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const html = await response!.text();
    expect(html, 'expected `data-embed-type="tumblr"` wrapper').toContain('data-embed-type="tumblr"');
    expect(html, `expected post id ${POST_ID} in tumblr-post data-href`).toMatch(
      new RegExp(`tumblr-post[^>]+data-href="[^"]*${POST_ID}`),
    );
  });
});
