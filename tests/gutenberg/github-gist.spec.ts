import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-github-gist';
const WRAPPER_SEL = '[data-embed-type="GitHub"]';

// GitHub Gists are injected via a `<script>` that pulls the gist content client-side; the server response carries only the wrapper.
test.describe('Gutenberg verify — GitHub Gist (wrapper only)', () => {
  test('seeded page emits the source wrapper', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const wrapper = page.locator(WRAPPER_SEL).first();
    await expect(wrapper).toBeVisible({ timeout: 30_000 });
  });
});
