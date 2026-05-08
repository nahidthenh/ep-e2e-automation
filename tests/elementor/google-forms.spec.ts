import { test, expect } from '@playwright/test';

const SOURCE_NAME  = 'Google Forms';
const SOURCE_URL   = 'https://docs.google.com/forms/d/e/1FAIpQLSfR8KPBrMpWL3tor4XOeQ1sqT_-O-dQCyW9uDIzBGGr6xpCbA/viewform?embedded=true';
const SEEDED_SLUG  = 'ep-elementor-google-forms';
const IFRAME_SEL   = 'iframe[src*="docs.google.com/forms"]';
const URL_MARKER   = '1FAIpQLSfR8KPBrMpWL3tor4XOeQ1sqT';

test.describe(`Elementor verify — ${SOURCE_NAME}`, () => {
  test('seeded page renders the embed', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(
      response?.ok(),
      `seeded page not found — run \`npm run seed -- --source "${SOURCE_NAME}"\``,
    ).toBeTruthy();

    const iframe = page.locator(IFRAME_SEL).first();
    await expect(iframe).toBeVisible({ timeout: 30_000 });
    await expect(iframe).toHaveAttribute('src', new RegExp(URL_MARKER));
  });
});
