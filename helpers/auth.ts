import { Page, expect } from '@playwright/test';

const ADMIN_USER  = process.env.WP_ADMIN_USER ?? 'admin';
const ADMIN_PASS  = process.env.WP_ADMIN_PASS ?? 'admin';

/**
 * Logs into WP admin.  Skips navigation if already on an /wp-admin/ page.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  if (page.url().includes('/wp-admin')) return;

  await page.goto('/wp-login.php');
  await page.locator('#user_login').fill(ADMIN_USER);
  await page.locator('#user_pass').fill(ADMIN_PASS);
  await page.locator('#wp-submit').click();

  await expect(page).toHaveURL(/wp-admin/, { timeout: 20_000 });
}

/**
 * Stores the authenticated session to a storage-state file so subsequent
 * test files can reuse it without re-logging in.
 */
export async function saveAuthState(page: Page, path: string): Promise<void> {
  await loginAsAdmin(page);
  await page.context().storageState({ path });
}
