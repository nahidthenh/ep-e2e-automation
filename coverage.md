# Test coverage

Snapshot of what the Playwright suite verifies. Update as sources are added or coverage changes.

## Approach

Tests are **verification-only**. The seed pipeline (`seed/index.ts`) publishes one Gutenberg page and one Elementor page per source in `sources.json` (more for sources with declared variants — see [§ Variants](#variants)), and specs visit `/ep-<editor>-<slug>/` to assert the expected embed markup is present. No editor automation runs at test time. See `.claude/skills/add-source-test/SKILL.md` for how new specs are generated.

## Headline numbers

- **92 / 92** sources with a URL in `sources.json` have at least one verification spec.
- **+1 synthetic source** (`PDF`, uploaded as a WP attachment at setup time, not in `sources.json`).
- **199 specs total** (smoke 3 + Gutenberg 98 + Elementor 98) — 4 new PDF specs since the audit.
- After the strict audit (2026-05-09): **~155 passing, ~38 failing, 1 skipped**.
- The 38 failing specs are **honest signals of broken EmbedPress integrations** in this build — not test-design defects. They were previously passing on wrapper-only assertions, which the user flagged as theater.

## Coverage tiers

Each source's spec falls into one of these tiers based on what EmbedPress actually emits, **including post-JS state** (vendor scripts get to run before assertions check). Tier dictates the assertion shape.

### ✅ Full embed (passing)
Spec asserts the rendered embed element exists with the expected `src` (or `data-*` for blockquotes) carrying a unique URL marker.

| Family | Sources |
| --- | --- |
| Google | Docs, Slides, Sheets, Forms, Maps, Drawing (img), Calendar |
| YouTube | YouTube, YouTube Live, YouTube Live (Channel), YouTube Channel base |
| YouTube Channel variants | gallery, list, grid (Pro), carousel (Pro), controls — 5 specs/editor |
| Spotify | Playlist, Album, Artist, Single |
| Social | Facebook Post, Facebook Video, Instagram (Gutenberg only), Twitter Feed, Tumblr, BlueskySocial, Behance |
| Audio / podcasts | Apple Podcast (Playlist + Single), Soundcloud, MixCloud, Audiomack, Hearthis, NRK Radio, Audioboom, iHeartRadio, Acast, Audiocom, Audiocom (New), Reverbnation Song, Boomplay (Playlist + Album + Single) |
| Video hosts | Vimeo, Dailymotion, Twitch, Streamable, Coub, PeerTubeTV, Adilo, Adilo (New), Pitchhub, Vidyard, VidMount, Spotlightr |
| Documents / presentations | Slideshare, SpeakerDeck, Sway, Cloudup |
| Maps / 3D / interactive | Padlet, LearningApps, Flourish, Apester |
| Images / galleries | Flickr (img), Giphy (img), Gyazo (img), Getty Images (Elementor only — img) |
| News / longform / talks | TED, Fader, iFixit, Meetup (img), Meetup Delete Event (img), UniversitePantheonSorbonne, CIGeography |

### ❌ Strict-fail (broken integration)
Spec asserts an iframe must appear inside the embedpress figure / widget within 15s. **Fails** as of the 2026-05-09 audit because no iframe ever renders — server response or post-JS. EmbedPress recognises the URL (emits a `data-embed-type` wrapper) but produces no working embed.

| Source | Both editors? | What renders |
| --- | --- | --- |
| Afreecatv | Yes | Wrapper + raw URL as text inside it |
| AudioClip | Yes | Wrapper only |
| AnnieMusic | Yes | Wrapper only |
| Reverbnation Collection | Gutenberg only (Elementor would also fail; check separately) | Wrapper only |
| Videfit | Yes | Wrapper only |
| BeautifulAI | Yes | Wrapper only |
| GitHub Gist | Yes | Wrapper only — missing the gist.github.com `<script>` tag |
| CodeSandbox | Yes | Wrapper only |
| ActBlue | Yes | Wrapper only |
| Matterport | Yes | Wrapper only |
| Gloria TV | Yes | Wrapper only |
| OpenSea Collection | Yes | Wrapper only — depends on OpenSea API content fetch that EmbedPress doesn't successfully complete in this env |
| OpenSea Single | Yes | Wrapper only — same |
| Archivos | Gutenberg only (Elementor is skipped — see below) | Wrapper only |
| Getty Images | Gutenberg only (Elementor renders an iframe) | Wrapper only |

Plus URL-fallback sources where EmbedPress doesn't even produce a wrapper:

| Source | Both editors? | What renders |
| --- | --- | --- |
| Audiomeans | Yes | URL as plain text inside `<figure>`, no wrapper |
| SmugMug | Yes | Same |
| 23hq | Yes | Same |
| Gumroad | Yes | Same |
| Byzart | Yes | Same |
| Animoto | Yes | Same |

### ⏭️ Skipped

| Source | Reason |
| --- | --- |
| Elementor Archivos | Elementor renders no `data-embed-type` wrapper, no widget shell, and not even the URL — nothing to assert on. Skipped via `test.skip`. |

### LottieFiles
- `url: null` in `sources.json`. Add a URL via the `update-sources` skill before generating specs.

## Variants

| Source | Variants | What's tested |
| --- | --- | --- |
| YouTube Channel | `gallery` (default), `list`, `grid` (Pro), `carousel` (Pro), `controls` (`pagesize=3`, `ispagination=false`, `gapbetweenvideos=10`) | Layout class on `.ep-player-wrap`, channel name, video-card count, pagination visibility |
| PDF (synthetic — uploaded fixture, not in `sources.json`) | `default`, `no-download` | `iframe.embedpress-embed-document-pdf` is visible; base64 `#key=…` payload contains `download=true\|yes` (default) or `download=false\|''\|no` (no-download). Gutenberg uses `download` (boolean) attr; Elementor uses `pdf_print_download` (SWITCHER `'yes'` / `''`). |

## Coverage gaps beyond URL-renders

Things the current architecture deliberately does **not** exercise:

1. **Editor flows** — block insertion, widget drop, control toggles, save round-trip. Belongs in plugin tests.
2. **Source-specific Pro controls** — autoplay, loop, color, end-time, etc. (except YouTube Channel's layout/control matrix).
3. **Document / calendar blocks** — `embedpress/document` and `embedpress/embedpress-calendar` have dedicated render callbacks in `EmbedPressBlockRenderer` and aren't covered yet (PDF block now is — see [§ Variants](#variants)).
4. **Pro-only features** — content protection, password gating, ad manager, custom player, country restriction, lazy load, chapters / heatmap / email-capture.
5. **Front-end JS player init** — we don't assert the player becomes interactive (play/pause, time updates).
6. **Cross-browser** — Chromium only.
7. **Mobile viewport** — no responsive / mobile project configured.
8. **Failure modes** — invalid URLs, expired oEmbed responses, network errors.
9. **Authentication / capabilities** — only admin storage state.
10. **Source-specific API content** — OpenSea NFT cards, Instagram Pro feed, YouTube Live channel content (when no live stream is active). API-gated.

## Follow-ups (planned)

### Fix the strict-fail tier upstream

Each ❌ source above is a real EmbedPress integration that should be producing an iframe / image / blockquote and isn't. Triage candidates by impact (most-used sources first):

- **GitHub Gist** — the fix is just emitting the standard `<script src="https://gist.github.com/.../<hash>.js"></script>` tag. The browser does the rest.
- **CodeSandbox / BeautifulAI / Matterport / ActBlue / Gloria TV** — these all have well-known iframe embed URLs the EmbedPress provider should produce.
- **OpenSea (Collection + Single)** — needs OpenSea API fetch logic to actually populate NFT cards. Currently the wrapper renders but content is empty.
- **Afreecatv / Audiomeans / SmugMug / 23hq / Gumroad / Byzart / Animoto / Archivos** — provider may need to be added or rewritten.

### Suite-runtime concerns

The current suite takes 20-25 min when most failures hit their 15s timeout. Tightening the strict timeout (e.g. 5s — the iframe either appears in the first second or never) would cut that to ~12 min. Files to adjust: any spec containing `EmbedPress did not produce an iframe`. Tradeoff: a few sources legitimately need a few seconds for vendor JS to inject, so 5s might add false negatives.

### More layout/control variants

YouTube Channel proved the variants infrastructure (`VARIANTS_BY_SOURCE` in `seed/index.ts` + `extraAttrs` in `seed/editors/{gutenberg,elementor}.ts` + `Shortcode::parseContent` in `scripts/resolve-gutenberg-embeds.php`). Next candidates:

- **Spotify Playlist / Album / Artist / Single** — theme (light/dark), view (compact/full), size variants.
- **Vimeo / Wistia / Vidyard** — autoplay, loop, custom controls (mostly Pro).
- **PDF / Document blocks** — viewer modes, toolbar, download button, watermark, page selection.
- **Google Calendar** — view mode (month/week/agenda).

The skill `.claude/skills/add-source-test/SKILL.md` doesn't yet teach how to declare variants — generalising it (or moving variants out to a sibling JSON file) is the next ergonomic improvement.

### Investigate the SocialExplorer `marginmarginsrc` bug

EmbedPress emits `<iframe marginmarginsrc="…">` for SocialExplorer where it should emit `src="…"`. Looks like a string-replace bug in the provider. Current spec asserts on the raw HTML to work around it; once fixed upstream, switch to a normal iframe selector.

### Suite reliability

In a long-running pass (90+ min of the suite), `elementor/google-forms` and `elementor/nrk-radio` flaked even though they pass cleanly in isolation. Likely Chromium / WP container resource pressure rather than a test defect. Worth investigating if the suite is run more frequently. Mitigation: parallel workers (currently 1) or per-shard runs in CI.

## Known infrastructure issues that affect coverage

1. **Partial-seed ID collision after a full seed has run** — `npm run seed -- --source <name>` fails with `Duplicate entry` if a full seed already ran. Workaround: full re-seed (`npm run seed`).
2. **`SEED_ID_START` must clear WP system posts** — bumped from 1000 to 10000 in `seed/index.ts` because WP creates auto-drafts / `wp_global_styles` / `wp_navigation` posts at IDs 1184+, which collided with the seed range when YouTube Channel variants pushed it past 1183.
3. **WP setup must precede seeding** — `npm run seed` fails with missing-table errors if `npm run setup` hasn't run.

## Adding coverage

Use the `add-source-test` skill: `/add-source-test <Source Name>`. It validates the source against `sources.json`, detects whether Pro is required to render, generates the two verification specs, re-seeds, and smoke-runs. See `.claude/skills/add-source-test/SKILL.md` for the full workflow.
