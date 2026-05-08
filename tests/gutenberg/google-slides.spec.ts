import { test, expect } from '@playwright/test';

const SOURCE_NAME  = 'Google Slides';
const SOURCE_URL   = 'https://docs.google.com/presentation/d/e/2PACX-1vQ3rsCWkulDES2YgcuXvTy36o2n6NDu0nNzbV_YQ3Rpc1fM_BdTyWTEEfzlwdwWPtyrXFvXNsEnAso3/pub?start=true&loop=true&delayms=3000';
const SEEDED_SLUG  = 'ep-gutenberg-google-slides';
const IFRAME_SEL   = 'iframe[src*="docs.google.com/presentation"]';
const URL_MARKER   = '2PACX-1vQ3rsCWkulDES2YgcuXvTy36';

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
