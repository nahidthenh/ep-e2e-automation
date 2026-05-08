import { test, expect } from '@playwright/test';

const SOURCE_NAME  = 'Google Calendar';
const SOURCE_URL   = 'https://calendar.google.com/calendar/embed?src=en.bd%23holiday%40group.v.calendar.google.com&ctz=Asia%2FDhaka';
const SEEDED_SLUG  = 'ep-elementor-google-calendar';
const IFRAME_SEL   = 'iframe[src*="calendar.google.com/calendar/embed"]';
const URL_MARKER   = 'en\\.bd%23holiday';

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
