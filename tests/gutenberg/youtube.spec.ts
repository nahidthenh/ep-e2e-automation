import { test, expect } from '@playwright/test';
import {
  goToNewGutenbergPage,
  setGutenbergTitle,
  insertBlock,
  publishGutenbergPage,
} from '../../helpers/wp-admin';

const SOURCE_NAME = 'YouTube';
const SOURCE_URL  = 'https://www.youtube.com/watch?v=5zWTInJqD5k';
const VIDEO_ID    = '5zWTInJqD5k';

// YouTube is a Free source — Pro is not required for the basic create flow
// or for the layout attributes (width / height / lazy load) tested below.

test.describe(`Gutenberg create flow — ${SOURCE_NAME}`, () => {
  test('insert YouTube block, configure controls, publish, verify iframe', async ({ page }) => {
    await goToNewGutenbergPage(page);
    await setGutenbergTitle(page, `EP Gutenberg create — ${SOURCE_NAME}`);

    // Insert the source-specific block: embedpress/youtube-block (label "YouTube")
    await insertBlock(page, 'YouTube');

    // Fill the URL placeholder. The YouTube block's placeholder uses an
    // input[type="url"] inside the EmbedPress block scaffold.
    const urlInput = page.locator('input[type="url"], input[placeholder*="URL"]').first();
    await expect(urlInput).toBeVisible({ timeout: 15_000 });
    await urlInput.fill(SOURCE_URL);
    await urlInput.press('Enter');

    // Give EmbedPress a moment to fetch the embed.
    await page.waitForTimeout(2_000);

    // Open the Settings sidebar if a tab toggle is present (some WP versions).
    const settingsTab = page.getByRole('tab', { name: /^Settings$/ });
    if (await settingsTab.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await settingsTab.click();
    }

    // Width — numeric attribute (default 600).
    const widthInput = page.getByLabel(/^Width$/i).first();
    await expect(widthInput).toBeVisible({ timeout: 10_000 });
    await widthInput.fill('800');

    // Height — numeric attribute (default 450).
    const heightInput = page.getByLabel(/^Height$/i).first();
    await expect(heightInput).toBeVisible();
    await heightInput.fill('500');

    // Lazy load — boolean toggle (`enableLazyLoad`, default false).
    const lazyToggle = page.getByLabel(/lazy.?load/i).first();
    if (await lazyToggle.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await lazyToggle.check();
    }

    const frontUrl = await publishGutenbergPage(page);
    expect(frontUrl).toBeTruthy();
    await page.goto(frontUrl, { waitUntil: 'load' });

    // Iframe must point at YouTube and embed the right video id.
    const iframe = page.locator('iframe[src*="youtube"]').first();
    await expect(iframe).toBeVisible({ timeout: 30_000 });
    await expect(iframe).toHaveAttribute('src', new RegExp(VIDEO_ID));

    // Verify the layout attributes reached the rendered iframe.
    await expect(iframe).toHaveAttribute('width', /800/);
    await expect(iframe).toHaveAttribute('height', /500/);
  });
});
