import { Page, expect } from '@playwright/test';

/**
 * Ensures the browser is on a WP admin page.
 *
 * Authentication is handled by the storageState set in playwright.config.ts
 * (populated by global-setup.ts before the suite runs). This function simply
 * navigates to /wp-admin/ and lets the stored session cookies do the work.
 *
 * It will throw if WordPress redirects back to the login page, which means
 * the global setup failed or the session expired.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  // Already on an admin page — nothing to do
  if (page.url().includes('/wp-admin')) return;

  await page.goto('/wp-admin/');
  await expect(page).toHaveURL(/wp-admin/, { timeout: 20_000 });
}
