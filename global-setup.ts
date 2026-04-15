/**
 * Runs once before the entire test suite.
 * Logs into WordPress and persists the session cookies so every
 * test file can reuse them without going through the UI login form.
 */
import { chromium, FullConfig } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

export const AUTH_STATE = path.resolve(__dirname, '.auth/state.json');

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const baseURL = process.env.WP_URL ?? 'http://localhost:8080';
  const adminUser = process.env.WP_ADMIN_USER ?? 'admin';
  const adminPass = process.env.WP_ADMIN_PASS ?? 'admin';

  // Ensure .auth dir exists
  fs.mkdirSync(path.dirname(AUTH_STATE), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  await page.goto('/wp-login.php');
  await page.waitForLoadState('domcontentloaded');

  // Fill username
  await page.locator('#user_login').fill(adminUser);

  // Set password value directly via evaluate — avoids WP 6.7+ toggle/autocomplete
  // interference. Native HTML forms read el.value at submit time, so this is safe.
  await page.locator('input[name="pwd"]').evaluate(
    (el: HTMLInputElement, val: string) => { el.value = val; },
    adminPass
  );

  await page.locator('#wp-submit').click();
  await page.waitForURL(/wp-admin/, { timeout: 20_000 });

  await context.storageState({ path: AUTH_STATE });
  await browser.close();

  console.log(`✓ Auth state saved to ${AUTH_STATE}`);
}
