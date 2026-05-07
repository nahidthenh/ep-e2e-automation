---
name: add-source-test
description: Generate Playwright create-flow tests for a single EmbedPress source (Gutenberg + Elementor). Reads the EmbedPress plugin source to enumerate that source's actual controls, writes one spec per editor under tests/<editor>/<slug>.spec.ts, skips Pro-only sources when Pro isn't active, and re-runs the seed so the baseline page exists. Triggers on phrases like "add a test for YouTube", "write tests for Spotify Playlist", "/add-source-test <name>".
---

# add-source-test

Generates two Playwright **create-flow** specs for a given EmbedPress source — one for Gutenberg, one for Elementor.

## Inputs

- **Source name** (required) — must match the `source` field of an entry in `sources.json` (case-insensitive). Examples: `YouTube`, `Google Maps`, `Spotify Playlist`.

If the user invokes the skill without a name, ask: *"Which source from `sources.json`?"*

## Outputs

- `tests/gutenberg/<slug>.spec.ts` — NEW file
- `tests/elementor/<slug>.spec.ts` — NEW file
- One re-seed of the source's pages (idempotent)
- A smoke run of the new specs

`<slug>` follows `seed/sources.ts:slugify` — lowercase, non-alphanumeric → `-`, trim leading/trailing `-`. E.g. `Spotify Playlist` → `spotify-playlist`.

---

## Workflow

### Step 1 — Validate the source

1. Read `sources.json`.
2. Find the entry whose `source` matches the input case-insensitively. If none, abort with: *"`<name>` not found in sources.json. Add it via the `update-sources` skill first."*
3. If `url` is `null`, abort with: *"`<name>` has no URL — cannot generate tests."*
4. Compute `<slug>` and capture the `url` for use in the spec.

### Step 2 — Locate EmbedPress plugin sources

Read `EP_FREE_PLUGIN_PATH` and `EP_PRO_PLUGIN_PATH` from `.env` (fallback to `.env.example`). Defaults if unset:
- Free: `../EmbedPress/embedpress`
- Pro:  `../EmbedPress/embedpress-pro`

Resolve relative to repo root. If a path doesn't exist on disk, warn the user — the skill can still proceed using the generic `embedpress/embedpress` block but **will not be able to enumerate source-specific controls**.

### Step 3 — Determine if the source is Pro-only

Search the plugin source for the source's identifier (try several forms: full name, slug, short slug like `youtube` or `googlemaps`):

- If the registration appears **only** under the Pro path → `PRO_REQUIRED = true`
- If found in Free → `PRO_REQUIRED = false`
- If you can't find any registration, ask the user before guessing

Common search patterns (use Grep / Explore agent):
- Block registration: files with `register_block_type`, `embedpress/<slug>`, or `Blocks/<Slug>` directories
- Elementor widget: files with `widget_type` or class names ending in `_Elementor` / `_Widget`
- Source label / class names sometimes differ from the display name (e.g. `Google Maps` may register under `Gmap` or `Google_Maps`)

### Step 4 — Enumerate controls (the heart of this skill)

For the source, find:
- **Block name** for Gutenberg (e.g. `embedpress/youtube-block`, or fall back to generic `embedpress/embedpress`)
- **Widget type** for Elementor (note the EmbedPress typos that **must be preserved**:
  - widget id often `embedpres_<slug>` (missing trailing `s` in "embedpress")
  - URL setting key is often `embedpress_embeded_link` (typo: "embeded"))
- **3–5 source-specific controls** worth testing — pick the ones a user would notice change. E.g. for YouTube: `autoplay`, `start_time`, `loop`, `controls`. For Google Maps: `zoom`, `map_type`. For Spotify Playlist: `theme`, `view`, `size`.

**Do not try to test all 30+ controls — keep specs focused.** Pick controls whose effect is observable on the rendered iframe (URL parameters, iframe attributes, or visible UI elements).

For each chosen control, record:
- The Gutenberg attribute name (camelCase or snake_case as the block uses it)
- The Elementor control id
- A non-default value to set
- An assertion that lets the test verify the control was applied (URL param, attribute, DOM)

### Step 5 — Generate the spec files

Use the templates below. Keep the spec self-contained — don't add new helpers unless a clear pattern emerges across multiple sources. The default helpers in `helpers/wp-admin.ts` and `helpers/page-utils.ts` cover the common path.

Naming:
- `tests/gutenberg/<slug>.spec.ts`
- `tests/elementor/<slug>.spec.ts`

If a file already exists, ask before overwriting.

### Step 6 — Re-seed the source

After writing the specs, run:

```bash
npm run seed -- --source "<source name>"
```

(Idempotent — wipes and re-inserts the two pages for that source.) This guarantees the baseline seeded pages exist when someone clones the repo and runs `npm run setup`. The CI workflow already calls `scripts/seed-pages.sh` after WP install, so no workflow changes are needed per source.

### Step 7 — Smoke run the new specs

```bash
npx playwright test tests/gutenberg/<slug>.spec.ts tests/elementor/<slug>.spec.ts
```

If a test fails:
- Don't blindly relax assertions. First confirm the control id/attribute by re-reading the EmbedPress source.
- If the fail is due to a UI selector drifting, fix the selector — don't replace it with `.first()` to mute the failure.
- If a Pro source fails because Pro is inactive, the `test.skip` block (Step 8) should already prevent it; revisit the detection logic.

### Step 8 — Pro detection block (template)

Every spec emits this `test.beforeAll` when `PRO_REQUIRED = true`:

```ts
const PRO_REQUIRED = true;

test.beforeAll(async ({ browser }) => {
  if (!PRO_REQUIRED) return;
  const ctx  = await browser.newContext({ storageState: '.auth/state.json' });
  const page = await ctx.newPage();
  await page.goto('/wp-admin/plugins.php');
  const proRow = page.locator('tr[data-plugin^="embedpress-pro/"]:has(.plugin-title)');
  const proActive = (await proRow.count()) === 1
    && (await proRow.evaluate((el) => el.classList.contains('active')));
  await ctx.close();
  test.skip(!proActive, 'EmbedPress Pro inactive — skipping Pro-only source');
});
```

For free sources, omit the block entirely — don't leave a no-op `test.beforeAll` behind.

---

## Spec template — Gutenberg

```ts
import { test, expect } from '@playwright/test';
import {
  goToNewGutenbergPage,
  setGutenbergTitle,
  insertBlock,
  publishGutenbergPage,
} from '../../helpers/wp-admin';

const SOURCE_NAME = '<Source Display Name>';
const SOURCE_URL  = '<URL from sources.json>';
const PRO_REQUIRED = <true|false>;

// (Pro detection beforeAll — only emit when PRO_REQUIRED is true)

test.describe(`Gutenberg create flow — ${SOURCE_NAME}`, () => {
  test('insert block, configure controls, publish, verify', async ({ page }) => {
    await goToNewGutenbergPage(page);
    await setGutenbergTitle(page, `EP Gutenberg create — ${SOURCE_NAME}`);

    // Insert the source-specific block (or generic "EmbedPress" block).
    await insertBlock(page, '<Block label as it appears in the inserter>');

    // Fill the URL placeholder.
    // Selector typically: input[type="url"] inside the block placeholder.
    // Confirm by inspecting EmbedPress source / running --headed.
    const urlInput = page.locator('input[placeholder*="URL"], input[type="url"]').first();
    await urlInput.fill(SOURCE_URL);
    await urlInput.press('Enter');

    // Configure 3–5 controls. Open the block sidebar (Settings panel) first.
    // Example pattern — adapt per control.
    // await page.getByRole('button', { name: '<Control panel toggle>' }).click();
    // await page.getByLabel('<Control label>').check();    // for toggles
    // await page.getByLabel('<Control label>').fill('42'); // for numeric

    const frontUrl = await publishGutenbergPage(page);
    await page.goto(frontUrl, { waitUntil: 'load' });

    // Iframe presence
    const iframe = page.locator('iframe').first();
    await expect(iframe).toBeVisible({ timeout: 30_000 });

    // Per-control assertions — verify each non-default value reached the iframe.
    // Example: await expect(iframe).toHaveAttribute('src', /autoplay=1/);
  });
});
```

## Spec template — Elementor

The seeded `ep-elementor-<slug>` page already contains the EmbedPress widget pre-populated with the source's URL. For a true *create flow*, open the page in Elementor, **delete** the existing widget, drop a fresh one, configure controls, save.

```ts
import { test, expect } from '@playwright/test';
import {
  openWithElementor,
  addElementorWidget,
  setEmbedPressUrl,
  publishElementorPage,
  verifyYouTubeEmbedOnPage,
} from '../../helpers/page-utils';

const SOURCE_NAME = '<Source Display Name>';
const SOURCE_URL  = '<URL from sources.json>';
const SEEDED_SLUG = 'ep-elementor-<slug>';
const PRO_REQUIRED = <true|false>;

// (Pro detection beforeAll — only emit when PRO_REQUIRED is true)

test.describe(`Elementor create flow — ${SOURCE_NAME}`, () => {
  test('drop widget, configure controls, save, verify', async ({ page }) => {
    // Resolve the seeded page's ID (slug → ID via REST API).
    await page.goto(`/${SEEDED_SLUG}/`);
    const postId = await page.evaluate(
      () => (document.body.className.match(/postid-(\d+)/) ?? [])[1],
    );
    expect(postId, 'seeded page not found — run `npm run seed`').toBeTruthy();

    await openWithElementor(page, Number(postId));

    // (Optional) Clear existing widget to truly "create" fresh.
    // await page.locator('.elementor-widget-embedpres_elementor').first()
    //   .click({ button: 'right' }); // … then "Delete" via context menu.

    await addElementorWidget(page, '<Widget label in panel>');
    await setEmbedPressUrl(page, SOURCE_URL);

    // Configure 3–5 controls in the Elementor panel.
    // await page.locator('[data-setting="<setting_id>"] input').fill('<value>');

    const frontUrl = await publishElementorPage(page);
    await page.goto(frontUrl, { waitUntil: 'load' });

    const iframe = page.locator('iframe').first();
    await expect(iframe).toBeVisible({ timeout: 30_000 });

    // Per-control assertions
    // await expect(iframe).toHaveAttribute('src', /<param>=<value>/);
  });
});
```

---

## Pitfalls & rules

- **Preserve EmbedPress typos** — `embedpres_elementor` (no trailing s) and `embedpress_embeded_link` (one d) are intentional bugs in the plugin. Do not "correct" them in selectors.
- **Don't add helpers prematurely.** If the same logic appears in 3+ generated specs, then refactor into `helpers/` — not before.
- **Don't tweak `sources.json`.** Use the `update-sources` skill if a URL or name needs to change.
- **Don't modify the seed pipeline (`seed/`)** per source — seeding is generic and already covers every entry in `sources.json`.
- **Don't commit.** Generate the files and report what was created; the user commits when they're satisfied.
- **One source per file.** Never combine multiple sources into a single spec.
- **Generic block as fallback.** If a source-specific Gutenberg block doesn't exist (only `embedpress/embedpress`), control coverage drops to URL + a couple of generic controls. State this clearly when reporting back.

## Reporting back

After running, summarise in ≤ 5 lines:
1. Files created (paths)
2. Pro required: yes/no
3. Controls covered: list 3–5
4. Smoke result: passed / failed (count)
5. Anything the user must do next (e.g. "Pro plugin path missing — controls inferred from public docs")
