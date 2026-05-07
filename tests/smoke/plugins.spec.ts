import { test, expect } from '@playwright/test';

/**
 * Verifies the three plugins our tests depend on are installed AND active
 * in the WP dashboard. Matches by the directory portion of `data-plugin`
 * (e.g. `embedpress-pro/anything.php`) so it's resilient to whatever the
 * main PHP file is named inside each plugin.
 */
const REQUIRED_PLUGINS = [
  { dir: 'elementor',      label: 'Elementor' },
  { dir: 'embedpress',     label: 'EmbedPress' },
  { dir: 'embedpress-pro', label: 'EmbedPress Pro' },
];

test.describe('Required plugins', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wp-admin/plugins.php');
    // If storageState expired we'd land on wp-login.php — fail fast.
    await expect(page).toHaveURL(/plugins\.php/);
  });

  for (const plugin of REQUIRED_PLUGINS) {
    test(`${plugin.label} is installed and active`, async ({ page }) => {
      // `:has(.plugin-title)` excludes the "update available" / "deleted"
      // notice rows that also carry the same data-plugin attribute.
      const row = page.locator(
        `tr[data-plugin^="${plugin.dir}/"]:has(.plugin-title)`,
      );
      await expect(row, `${plugin.label} not installed`).toHaveCount(1);
      await expect(row, `${plugin.label} not active`).toHaveClass(/\bactive\b/);
    });
  }
});
