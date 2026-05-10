import { test, expect } from '@playwright/test';

const CANVAS = 'iframe[name="editor-canvas"]';

// ─── helpers ────────────────────────────────────────────────────────────────

async function openNewPost(page: import('@playwright/test').Page) {
  await page.goto('/wp-admin/post-new.php', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('button[aria-label="Block Inserter"]')).toBeVisible({ timeout: 20_000 });
  const dismiss = page.locator('button[aria-label="Close"], .edit-post-welcome-guide button').first();
  if (await dismiss.isVisible({ timeout: 3_000 }).catch(() => false)) await dismiss.click();
}

// ─── Tests ──────────────────────────────────────────────────────────────────

// KNOWN BUG — EmbedPress 4.5.2: PDF Gallery block crashes in the Gutenberg
// editor with "This block has encountered an error and cannot be previewed".
//
// Root cause: blocks.build.js (ver=1778250684) has `wrapFiltered()` incorrectly
// wrapping the result of `applyFilters('embedpress.galleryLayoutOptions', [...])`,
// which is used as the `options` prop for the Layout Type SelectControl.
// `wrapFiltered` calls `React.Children.toArray()` — which throws when it
// encounters plain `{label, value}` option objects instead of React elements.
//
// The source inspector.js is correct (no `wrapFiltered` around galleryLayoutOptions),
// so this is a stale/incorrect compiled build artifact.
//
// Fix required in embedpress: rebuild blocks.build.js so that
// `applyFilters('embedpress.galleryLayoutOptions', [...])` is passed directly
// to `SelectControl options={}` without wrapping in `wrapFiltered()`.
test.describe('Gutenberg editor — PDF Gallery block (EmbedPress 4.5.2 known bug)', () => {

  test('KNOWN BUG — PDF Gallery block throws React error on insert (wrapFiltered wraps SelectControl options)', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await openNewPost(page);

    // Insert the PDF Gallery block
    await page.locator('button[aria-label="Block Inserter"]').click();
    const search = page.locator('.block-editor-inserter__search input, .components-search-control__input, input[placeholder="Search"]').first();
    await expect(search).toBeVisible({ timeout: 10_000 });
    await search.fill('PDF Gallery');
    await page.locator('button:has-text("PDF Gallery"), .editor-block-list-item-embedpress-pdf-gallery').first().click();
    await page.waitForTimeout(2_000);

    // The block error notice appears in the outer editor page, not the canvas
    const blockError = page.locator('.block-editor-warning, :text("encountered an error")').first();
    await expect(blockError).toBeVisible({ timeout: 8_000 });

    // Confirm the specific React error is present in the console
    const reactChildError = consoleErrors.find(e =>
      e.includes('Objects are not valid as a React child') &&
      e.includes('label') &&
      e.includes('value')
    );
    expect(
      reactChildError,
      'Expected React child error about {label, value} objects — fix: remove wrapFiltered() from galleryLayoutOptions call in blocks.build.js'
    ).toBeTruthy();
  });

});
