import { test } from '@playwright/test';

const SEEDED_SLUG = 'ep-elementor-archivos';

// Archivos isn't recognised by EmbedPress's Elementor widget in this build —
// the rendered page contains no `data-embed-type` wrapper, no widget shell,
// and not even the source URL. Nothing meaningful to assert on. Skipping
// rather than passing trivially.
test.describe('Elementor verify — Archivos (skipped — unsupported)', () => {
  test.skip(true, `Archivos has no Elementor render path. Seeded page exists at /${SEEDED_SLUG}/ but produces no embed-related markup.`);
  test('placeholder', () => {});
});
