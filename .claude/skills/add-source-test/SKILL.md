---
name: add-source-test
description: Generate Playwright verification specs for a single EmbedPress source (Gutenberg + Elementor). The seed pipeline already publishes the embedded pages, so generated specs only visit `/ep-<editor>-<slug>/` and assert the iframe rendered correctly — no editor automation. Skips Pro-only sources when Pro isn't active. Triggers on phrases like "add a test for YouTube", "write tests for Spotify Playlist", "/add-source-test <name>".
---

# add-source-test

Generates two Playwright **verification** specs for a given EmbedPress source — one each for the seeded Gutenberg and Elementor pages. Tests do **not** drive the editor. They visit the already-seeded front-end URL and assert the embed renders.

**Why no editor flow:** the seed pipeline (`seed/index.ts`) inserts the page rows directly into the DB with the source URL embedded. Re-driving the editor on every CI run is slow, brittle (welcome modals, command-palette overlays, Elementor panel races), and adds nothing — if the embed renders on the seeded page, the integration is healthy. Editor coverage belongs in plugin-level tests, not in this E2E harness.

## Inputs

- **Source name** (required) — must match the `source` field of an entry in `sources.json` (case-insensitive). Examples: `YouTube`, `Google Maps`, `Spotify Playlist`.

If the user invokes the skill without a name, ask: *"Which source from `sources.json`?"*

## Outputs

- `tests/gutenberg/<slug>.spec.ts` — NEW file
- `tests/elementor/<slug>.spec.ts` — NEW file
- One re-seed of the source's pages (idempotent)
- A smoke run of the new specs

`<slug>` follows `seed/sources.ts:slugify` — lowercase, non-alphanumeric → `-`, trim leading/trailing `-`. E.g. `Spotify Playlist` → `spotify-playlist`.

The seeded page slugs are `ep-gutenberg-<slug>` and `ep-elementor-<slug>` (see `seed/sources.ts:pageSlug`).

---

## Workflow

### Step 1 — Validate the source

1. Read `sources.json`.
2. Find the entry whose `source` matches the input case-insensitively. If none, abort with: *"`<name>` not found in sources.json. Add it via the `update-sources` skill first."*
3. If `url` is `null`, abort with: *"`<name>` has no URL — cannot generate tests."*
4. Compute `<slug>` and capture the `url` for use in the assertions.

### Step 2 — Determine if the source requires Pro to render

Some sources only render when EmbedPress Pro is active (the seeded page exists either way, but the front-end shows a "Pro required" notice instead of an iframe). The skill needs this to decide whether to emit a Pro-detection skip block.

Read `EP_FREE_PLUGIN_PATH` and `EP_PRO_PLUGIN_PATH` from `.env` (fallback to `.env.example`). Defaults if unset:
- Free: `../EmbedPress/embedpress`
- Pro:  `../EmbedPress/embedpress-pro`

Search the plugin source for the source's identifier (try several forms: full name, slug, short slug like `youtube` or `googlemaps`):

- Registration appears **only** under the Pro path → `PRO_REQUIRED = true`
- Found in Free → `PRO_REQUIRED = false`
- If you can't find any registration, ask the user before guessing

Common patterns to grep for:
- `register_block_type`, `embedpress/<slug>`, or `Blocks/<Slug>` directories
- `widget_type` or class names ending in `_Elementor` / `_Widget`
- Display name vs. internal name often differ (e.g. `Google Maps` may register as `Gmap` or `Google_Maps`)

If the plugin paths don't exist on disk, warn the user and ask whether to default `PRO_REQUIRED` to `false` or `true` — the skill should not silently guess.

### Step 3 — Identify a stable iframe selector and assertion

The verification spec needs **one** robust selector for the rendered iframe and **one** assertion that proves the right content loaded. Pick from the source URL whatever uniquely identifies the embed (video id, channel slug, place id, track id, etc.) and assert it appears in the iframe `src` (or in a recognisable text node for sources that render server-side).

Examples:
- YouTube `https://www.youtube.com/watch?v=5zWTInJqD5k` → selector `iframe[src*="youtube"]`, assertion `src` contains `5zWTInJqD5k`.
- Google Maps `…&q=Eiffel+Tower` → selector `iframe[src*="google.com/maps"]`, assertion `src` contains `Eiffel`.
- Spotify Playlist `…/playlist/<id>` → selector `iframe[src*="spotify.com/embed"]`, assertion `src` contains the playlist id.

If the source renders without an iframe (rare — some Pro sources inline content), pick a stable DOM marker instead. State this clearly when reporting back.

### Step 4 — Generate the spec files

Use the templates below. Both specs are tiny on purpose. Do not reintroduce editor helpers (`goToNewGutenbergPage`, `openWithElementor`, etc.) — they're not needed for verification.

Naming:
- `tests/gutenberg/<slug>.spec.ts`
- `tests/elementor/<slug>.spec.ts`

If a file already exists, ask before overwriting.

### Step 5 — Re-seed the source

After writing the specs, run:

```bash
npm run seed -- --source "<source name>"
```

(Idempotent — wipes and re-inserts the two pages for that source.) This guarantees the baseline seeded pages exist when someone clones the repo and runs `npm run setup`. The CI workflow already calls `scripts/seed-pages.sh` after WP install, so no workflow changes are needed per source.

### Step 6 — Smoke run the new specs

```bash
npx playwright test tests/gutenberg/<slug>.spec.ts tests/elementor/<slug>.spec.ts
```

If a test fails:
- First confirm the seeded page actually exists: `curl -sI <site>/ep-gutenberg-<slug>/` should return 200, not 404. If 404, re-run Step 5.
- If the page loads but the iframe selector misses, open the URL in a browser and inspect what EmbedPress actually rendered. Update the selector — don't loosen the assertion to `iframe` first-match unless the source genuinely has no distinguishing attribute.
- If a Pro source fails because Pro is inactive, the `test.skip` block should already prevent it; revisit the detection logic in Step 2.

### Step 7 — Pro detection block (template)

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

const SOURCE_NAME  = '<Source Display Name>';
const SOURCE_URL   = '<URL from sources.json>';
const SEEDED_SLUG  = 'ep-gutenberg-<slug>';
const IFRAME_SEL   = '<iframe[src*="…"]>';
const URL_MARKER   = '<unique substring from SOURCE_URL>';
const PRO_REQUIRED = <true|false>;

// (Pro detection beforeAll — only emit when PRO_REQUIRED is true)

test.describe(`Gutenberg verify — ${SOURCE_NAME}`, () => {
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
```

## Spec template — Elementor

```ts
import { test, expect } from '@playwright/test';

const SOURCE_NAME  = '<Source Display Name>';
const SOURCE_URL   = '<URL from sources.json>';
const SEEDED_SLUG  = 'ep-elementor-<slug>';
const IFRAME_SEL   = '<iframe[src*="…"]>';
const URL_MARKER   = '<unique substring from SOURCE_URL>';
const PRO_REQUIRED = <true|false>;

// (Pro detection beforeAll — only emit when PRO_REQUIRED is true)

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
```

The two templates are intentionally near-identical. The split per editor exists so a single editor's regression doesn't mask the other — Gutenberg and Elementor render through different code paths in EmbedPress.

---

## Pitfalls & rules

- **Don't reintroduce editor automation.** No `goToNewGutenbergPage`, no `openWithElementor`, no `insertBlock`, no widget-drop logic. Editor flows live in plugin tests, not here. If you find yourself wanting to test a control, that's a sign the request belongs in the EmbedPress plugin repo, not this harness.
- **Don't tweak `sources.json`.** Use the `update-sources` skill if a URL or name needs to change.
- **Don't modify the seed pipeline (`seed/`)** per source — seeding is generic and already covers every entry in `sources.json`.
- **Don't commit.** Generate the files and report what was created; the user commits when they're satisfied.
- **One source per file.** Never combine multiple sources into a single spec.
- **Preserve EmbedPress typos** if you ever need to reference internal class names (`embedpres_elementor` — no trailing s — and `embedpress_embeded_link` — one d). They're intentional bugs in the plugin. Verification specs rarely touch these, but Pro-detection or DOM-marker fallbacks might.

## Reporting back

After running, summarise in ≤ 5 lines:
1. Files created (paths)
2. Pro required: yes/no
3. Iframe selector + URL marker used
4. Smoke result: passed / failed (count)
5. Anything the user must do next (e.g. "Pro plugin path missing — Pro-required defaulted to true; confirm")

---

## Known limitations

### 1. Partial-seed ID collision after a full seed has run

**Symptom:** `npm run seed -- --source <name>` fails with `ERROR 1062 (23000) … Duplicate entry '1000' for key 'wp_posts.PRIMARY'` if a full seed already ran. The DELETE clause removes the named source's pages by slug, but the INSERT counter restarts at `SEED_ID_START` (1000), where another source's page still lives.

**Right fix (deferred):** make IDs deterministic per (source, editor) pair instead of sequential:
```ts
// in seed/index.ts
const sourceIndex = allSourcesWithUrl.findIndex((x) => x.source === s.source);
const id = SEED_ID_START + sourceIndex * 2 + (editor === 'gutenberg' ? 0 : 1);
```
With deterministic IDs, partial re-seed always overwrites the same rows the full seed assigned, so DELETE-by-slug is enough.

**Workaround:** when re-seeding a single source after a full seed, run `npm run seed` (no flag) to refresh everything. Slow but safe.

### 2. WP setup must precede the skill's smoke step

**Symptom:** `npm run seed` succeeds at SQL generation but the MySQL pipe fails with `Table 'wordpress.wp_postmeta' doesn't exist`.

**Cause:** WordPress core wasn't installed (or the volume was reset since the last `npm run setup`).

**Right fix (deferred):** add a precondition probe to step 5:
```bash
docker exec ep_e2e_wp wp core is-installed --path=/var/www/html --allow-root \
  || { echo "WP not installed — run 'npm run setup' first"; exit 1; }
```

**Workaround:** if seeding fails with a missing-table error, run `npm run setup` and try again.
