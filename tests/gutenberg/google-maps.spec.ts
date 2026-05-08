import { test, expect } from '@playwright/test';

const SOURCE_NAME  = 'Google Maps';
const SOURCE_URL   = 'https://www.google.com/maps/place/WPDeveloper/@23.8370908,90.3682914,17z/data=!3m1!4b1!4m5!3m4!1s0x3755c1db6c43cad1:0xc20b691836497f19!8m2!3d23.8370859!4d90.3704801?shorturl=1';
const SEEDED_SLUG  = 'ep-gutenberg-google-maps';
const IFRAME_SEL   = 'iframe[src*="maps.google.com/maps"]';
const URL_MARKER   = 'q=WPDeveloper';

test.describe(`Gutenberg verify — ${SOURCE_NAME}`, () => {
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
