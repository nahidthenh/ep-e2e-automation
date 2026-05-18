import { test, expect } from '@playwright/test';

// Security regression for FBS-81533:
// YouTube API fields (title, description, statistics) must be HTML-escaped
// before they are injected into the DOM via the `fetch_video_description`
// AJAX action. Without the fix, a YouTube video whose title contains
// `<img src=x onerror=alert(1)>` would execute JS in the visitor's browser.

const LIST_SLUG = 'ep-gutenberg-youtube-channel-list';

// Minimal mock of what the PATCHED PHP returns for a video whose title and
// description contain raw HTML payloads. esc_html() turns `<` → `&lt;` etc.,
// so the browser text-renders the angle brackets rather than executing them.
const MOCK_RESPONSE = {
  success: true,
  data: {
    description: `
      <div class="video-description">
        <div class='youtube-video-description'>
          <div class='youtube-video-header'>
            <h1>&lt;img src=x onerror=alert(document.cookie)&gt;</h1>
            <div class='youtube-video-meta'>
              <span>1000 views</span>
              <span>Jan 1, 2026</span>
            </div>
          </div>
          <div class='youtube-video-body'>
            <p>&lt;script&gt;alert(1)&lt;/script&gt;</p>
          </div>
          <div class='youtube-video-footer'>
            <div class='youtube-video-stats'>
              <span>10</span>
              <span>2</span>
            </div>
          </div>
        </div>
      </div>`,
  },
};

test.describe('Security — YouTube API output escaping (FBS-81533)', () => {
  test('list layout: video titles are plain text, no nested HTML elements', async ({ page }) => {
    const response = await page.goto(`/${LIST_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();

    const wrapper = page.locator('[data-embed-type="YoutubeChannel"]').first();
    await expect(wrapper).toBeVisible({ timeout: 30_000 });
    await expect(wrapper.locator('.ep-player-wrap.layout-list')).toBeVisible();

    // Finding 2: list layout echoes $item->snippet->title — must be escaped.
    // Each .item in the list has a .body > p holding the video title.
    // If unescaped, a malicious title would create child elements inside <p>.
    const titleCells = wrapper.locator('.item .body p');
    const count = await titleCells.count();
    expect(count, 'expected at least one video title cell in list layout').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const cell = titleCells.nth(i);

      // WordPress core converts emoji characters to <img class="emoji"> tags.
      // Those are legitimate — only flag injected elements that aren't emoji imgs
      // or that carry event-handler attributes (onerror, onload, etc.).
      const suspiciousChildCount = await cell.evaluate((el) => {
        let count = 0;
        el.querySelectorAll('*').forEach((child) => {
          const isWpEmoji = child.tagName === 'IMG' && child.classList.contains('emoji');
          if (isWpEmoji) return;
          // Any non-emoji child element, or any element with an event-handler attr, is suspicious.
          const hasEventHandler = Array.from(child.attributes).some((a) =>
            a.name.startsWith('on'),
          );
          if (child.tagName === 'SCRIPT' || hasEventHandler) count++;
        });
        return count;
      });

      expect(
        suspiciousChildCount,
        `video title cell ${i} contains injected <script> or event-handler elements — XSS not neutralised`,
      ).toBe(0);
    }
  });

  test('description popup: AJAX response is rendered as text, HTML payloads are not executed', async ({ page }) => {
    // Intercept the fetch_video_description AJAX call and return the mock
    // response that simulates what the PATCHED PHP emits (entities escaped).
    await page.route('**/wp-admin/admin-ajax.php', async (route, request) => {
      const postData = request.postData() ?? '';
      if (postData.includes('action=fetch_video_description')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_RESPONSE),
        });
      } else {
        await route.continue();
      }
    });

    const response = await page.goto(`/${LIST_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();

    const wrapper = page.locator('[data-embed-type="YoutubeChannel"]').first();
    await expect(wrapper).toBeVisible({ timeout: 30_000 });

    // Click the first list item to open the video popup.
    const firstItem = wrapper.locator('.layout-list .item').first();
    await expect(firstItem).toBeVisible();
    await firstItem.click();

    // Popup should appear.
    const popup = page.locator('#videoPopup');
    await expect(popup).toBeVisible({ timeout: 15_000 });

    const descContainer = popup.locator('#videoDescription');
    await expect(descContainer).toBeVisible();

    // Wait for the AJAX response to be injected.
    await expect(descContainer.locator('.youtube-video-description')).toBeVisible({ timeout: 10_000 });

    const h1 = descContainer.locator('h1');
    await expect(h1).toBeVisible();

    // The title payload must be rendered as text, not executed as HTML.
    // Text content should contain the raw angle-bracket characters.
    const titleText = await h1.textContent();
    expect(titleText).toContain('<img');

    // No actual <img> element must exist inside h1 — if one did, the
    // onerror handler could fire and the fix would be ineffective.
    const injectedImg = h1.locator('img');
    await expect(injectedImg).toHaveCount(0);

    // No <script> elements anywhere inside the description block.
    const injectedScript = descContainer.locator('script');
    await expect(injectedScript).toHaveCount(0);
  });
});
