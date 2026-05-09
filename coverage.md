# Test coverage

Snapshot of what the Playwright suite verifies. Update as sources are added or coverage changes.

## Approach

Tests are **verification-only**. The seed pipeline (`seed/index.ts`) publishes one Gutenberg page and one Elementor page per source in `sources.json` (more for sources with declared variants — see [§ Variants](#variants)), and specs visit `/ep-<editor>-<slug>/` to assert the expected embed markup is present. No editor automation runs at test time. See `.claude/skills/add-source-test/SKILL.md` for how new specs are generated.

## Headline numbers

- **92 / 92** sources with a URL in `sources.json` have at least one verification spec.
- **195 specs total** (smoke 3 + Gutenberg 96 + Elementor 96).
- **194 passing, 1 skipped** (Elementor Archivos — see [§ Skipped / unsupported](#skipped--unsupported)).
- **5 layout/control variants** for YouTube Channel (gallery, list, grid, carousel, controls).
- **1 source without a URL** (`LottieFiles` — out of scope until URL is added).

## Coverage tiers

Each source's spec falls into one of these tiers based on what EmbedPress actually emits server-side. Tier dictates how strict the assertion is.

### ✅ Full embed (iframe / img / blockquote)
Spec asserts the rendered embed element exists with the expected `src` (or `data-*` for blockquotes) carrying a unique URL marker.

| Family | Sources |
| --- | --- |
| Google | Docs, Slides, Sheets, Forms, Maps, Drawing (img), Calendar |
| YouTube | YouTube, YouTube Live, YouTube Live (Channel) |
| YouTube Channel variants | gallery, list, grid (Pro), carousel (Pro), controls — 5 specs/editor |
| Spotify | Playlist, Album, Artist, Single |
| Social | Facebook Post, Facebook Video, Instagram, Twitter Feed, Tumblr, BlueskySocial, Behance |
| Audio / podcasts | Apple Podcast (Playlist + Single), Soundcloud, MixCloud, Audiomack, Hearthis, NRK Radio, Audioboom, iHeartRadio, Acast, Audiocom, Audiocom (New), Reverbnation Song, Boomplay (Playlist + Album + Single) |
| Video hosts | Vimeo, Dailymotion, Twitch, Streamable, Coub, PeerTubeTV, Adilo, Adilo (New), Pitchhub |
| Documents / presentations | Slideshare, SpeakerDeck, Sway, Cloudup |
| Maps / 3D / interactive | Padlet, LearningApps, Flourish, Apester |
| Images / galleries | Flickr (img), Giphy (img), Gyazo (img) |
| News / longform / talks | TED, Fader, iFixit, Meetup (img), Meetup Delete Event (img), UniversitePantheonSorbonne, CIGeography |

### ⚠️ Wrapper-only
Source emits a `[data-embed-type="…"]` (or similar) wrapper but the actual embed (iframe / image / canvas) is loaded client-side by JS, or is gated behind a Pro filter / API token the test env doesn't provision. Spec asserts the wrapper, not the player.

| Source | Reason |
| --- | --- |
| Instagram (Elementor) | Pro Instagram needs `is_allow_rander` + an authenticated graph token. Gutenberg Instagram resolves to a real iframe through the embedHTML resolver. |
| AudioClip | Player iframe is JS-injected. |
| AnnieMusic | Player iframe is JS-injected. |
| Reverbnation Collection | Only the wrapper renders. (`Reverbnation Song` does emit a real iframe.) |
| Vidyard | Player iframe is loaded by Vidyard's client script. |
| VidMount | Player iframe is JS-injected. |
| Videfit | Player iframe is JS-injected. |
| Spotlightr | Wrapper has `data-embed-type="cdn"` (no source-specific value); player loads via JS. |
| Afreecatv | Wrapper renders, no server-side iframe. |
| Getty Images | Embed is JS-injected. |
| BeautifulAI | Player iframe is JS-injected. |
| GitHub Gist | Gist content is fetched by a `<script>` tag client-side. |
| CodeSandbox | Player iframe is JS-injected. |
| ActBlue | Donate widget loads via its own script. |
| Matterport | 3D viewer loads via its own script. |
| Archivos (Gutenberg) | Wrapper renders; app loads via JS. |
| Gloria TV | Player iframe loads via JS. |
| OpenSea Collection | NFT cards are fetched from the OpenSea API; only the wrapper is in the response. |
| OpenSea Single | Same — API-fetched, wrapper-only on the server. |
| YouTube Channel base spec | Same shape as the variants — covers the gallery default. |

### 📝 URL fallback only
EmbedPress doesn't recognise the URL → the `[embedpress]URL[/embedpress]` shortcode falls back to rendering the URL as plain text inside the figure. Spec asserts the URL is in the rendered HTML. Not strictly "embedded" but proves the source URL round-trips through the seed/render pipeline.

| Source | Note |
| --- | --- |
| Audiomeans | No EmbedPress provider for this URL shape. |
| SmugMug | No EmbedPress provider for SmugMug photo pages in this build. |
| 23hq | Not recognised. |
| Gumroad | Not recognised. |
| Byzart | Not recognised. |
| Animoto | Not recognised. |
| Archivos (Elementor) | Unsupported in Elementor — Gutenberg renders the wrapper. |

### ❌ Skipped / unsupported

| Source | Reason |
| --- | --- |
| Elementor Archivos | Elementor renders no `data-embed-type` wrapper, no widget shell, and not even the URL — nothing meaningful to assert on. Skipped via `test.skip`. |

### LottieFiles
- `url: null` in `sources.json`. Add a URL via the `update-sources` skill before generating specs.

## Variants

Layout / control matrices per source. Each variant gets its own seeded page (slug suffix appended) and its own spec.

| Source | Variants | What's tested |
| --- | --- | --- |
| YouTube Channel | `gallery` (default), `list`, `grid` (Pro), `carousel` (Pro), `controls` (`pagesize=3`, `ispagination=false`, `gapbetweenvideos=10`) | Layout class on `.ep-player-wrap`, channel name, video-card count, pagination visibility |

## Coverage gaps beyond URL-renders

Things the current architecture deliberately does **not** exercise:

1. **Editor flows** — block insertion, widget drop, control toggles, save round-trip. Belongs in plugin tests.
2. **Source-specific Pro controls** — autoplay, loop, color, end-time, etc. (except YouTube Channel's layout/control matrix). Re-introducing means going back to editor automation OR adding more variants.
3. **PDF / document / calendar blocks** — these have dedicated render callbacks in `EmbedPressBlockRenderer` (`render_embedpress_pdf`, `render_document`, `render_pdf_gallery`, `render_embedpress_calendar`). No specs exist.
4. **Pro-only features** — content protection, password gating, ad manager, custom player, country restriction, lazy load, chapters / heatmap / email-capture. Untested.
5. **Front-end JS player init** — `ytiframeapi.js` and EmbedPress player init scripts load, but we don't assert the player becomes interactive (play/pause, time updates).
6. **Cross-browser** — Chromium only. Firefox / WebKit projects not enabled.
7. **Mobile viewport** — no responsive / mobile project configured.
8. **Failure modes** — invalid URLs, expired oEmbed responses, network errors, "Pro required" notice when Pro is inactive.
9. **Authentication / capabilities** — only admin storage state. No editor / author / subscriber roles.
10. **Source-specific API content** — OpenSea NFT cards, Instagram Pro feed, YouTube Live channel content (when no live stream is active). API-gated.

## Follow-ups (planned)

### More layout/control variants

YouTube Channel proved the variants infrastructure (`VARIANTS_BY_SOURCE` in `seed/index.ts` + `extraAttrs` in `seed/editors/{gutenberg,elementor}.ts` + `Shortcode::parseContent` in `scripts/resolve-gutenberg-embeds.php`). Next candidates:

- **Spotify Playlist / Album / Artist / Single** — theme (light/dark), view (compact/full), size variants.
- **Vimeo / Wistia / Vidyard** — autoplay, loop, custom controls (mostly Pro).
- **PDF / Document blocks** — viewer modes, toolbar, download button, watermark, page selection.
- **Google Calendar** — view mode (month/week/agenda).

The skill `.claude/skills/add-source-test/SKILL.md` doesn't yet teach how to declare variants — generalising it (or moving variants out to a sibling JSON file) is the next ergonomic improvement.

### Upgrade ⚠️ wrapper-only specs

Most wrapper-only specs would become full-embed specs if we either:
- Provision the source's API key / token in the test env (Instagram, YouTube Channel-style API gates), or
- Wait for EmbedPress to render iframes server-side instead of relying on client-side script injection.

Both are upstream changes.

### Investigate the SocialExplorer `marginmarginsrc` bug

EmbedPress emits `<iframe marginmarginsrc="…">` for SocialExplorer where it should emit `src="…"`. This looks like a string-replace bug in the provider. The current spec asserts on the raw HTML to work around it; once fixed upstream, switch to a normal iframe selector.

## Known infrastructure issues that affect coverage

1. **Partial-seed ID collision after a full seed has run** — `npm run seed -- --source <name>` fails with `Duplicate entry` if a full seed already ran. Workaround: full re-seed (`npm run seed`).
2. **`SEED_ID_START` must clear WP system posts** — bumped from 1000 to 10000 in `seed/index.ts` because WP creates auto-drafts / `wp_global_styles` / `wp_navigation` posts at IDs 1184+, which collided with the seed range when YouTube Channel variants pushed it past 1183.
3. **WP setup must precede seeding** — `npm run seed` fails with missing-table errors if `npm run setup` hasn't run.

## Adding coverage

Use the `add-source-test` skill: `/add-source-test <Source Name>`. It validates the source against `sources.json`, detects whether Pro is required to render, generates the two verification specs, re-seeds, and smoke-runs. See `.claude/skills/add-source-test/SKILL.md` for the full workflow.
