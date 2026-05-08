import { test, expect } from '@playwright/test';

const SOURCE_NAME  = 'Google Docs';
const SOURCE_URL   = 'https://docs.google.com/document/d/e/2PACX-1vQBdUB9bU8y9hnIrDvMPHM8TZDkN7TQLPEYLnc-J8gQJEI5H08cFDW6m1nXRpG6QEyclbIT3SzqD1MS/pub';
const SEEDED_SLUG  = 'ep-elementor-google-docs';
const IFRAME_SEL   = 'iframe[src*="docs.google.com/document"]';
const URL_MARKER   = '2PACX-1vQBdUB9bU8y9hnIrDv';

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
