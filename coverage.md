# Test coverage

Snapshot of what the Playwright suite verifies today and what is still missing. Update this file as specs are added.

## Approach

Tests are **verification-only**. The seed pipeline (`seed/index.ts`) publishes one Gutenberg page and one Elementor page per source in `sources.json`, and specs visit `/ep-<editor>-<slug>/` to assert the embed renders. No editor automation runs at test time. See `.claude/skills/add-source-test/SKILL.md` for how new specs are generated.

## Covered today

### Smoke (`tests/smoke/`)
| Spec | What it asserts |
| --- | --- |
| `plugins.spec.ts` | Elementor, EmbedPress, EmbedPress Pro are installed and active in `wp-admin/plugins.php`. |

### Per-source verification
| Source | Gutenberg | Elementor | Notes |
| --- | --- | --- | --- |
| YouTube | ✅ | ✅ | iframe present, src contains video id `5zWTInJqD5k`. |
| Google Docs | ✅ | ✅ | iframe present, src contains doc id `2PACX-1vQBdUB9bU8y9hnIrDv…`. |
| Google Slides | ✅ | ✅ | iframe present, src on `docs.google.com/presentation`, contains presentation id. |
| Google Sheets | ✅ | ✅ | iframe present, src on `docs.google.com/spreadsheets`, contains spreadsheet id. |
| Google Forms | ✅ | ✅ | iframe present, src on `docs.google.com/forms`, contains form id. |
| Google Maps | ✅ | ✅ | iframe present, src on `maps.google.com/maps`, contains `q=WPDeveloper`. |
| Google Drawing | ✅ | ✅ | Renders as `<img>` (not iframe), src on `docs.google.com/drawings`, contains drawing id. |
| Google Calendar | ✅ | ✅ | iframe present, src on `calendar.google.com/calendar/embed`, contains `en.bd%23holiday`. |
| YouTube Live | ✅ | ✅ | iframe present, src on `youtube`, contains video id `WGBm9X4vLPw`. First Gutenberg run flaked once on cold oEmbed; passed on re-run. |
| YouTube Channel | ⚠️ | ⚠️ | Asserts wrapper `[data-embed-type="YoutubeChannel"]` only — channel content is gated behind a YouTube Data API key the test env doesn't set, so EmbedPress emits a placeholder. Wrapper-only assertion confirms URL recognition. |
| YouTube Live (Channel) | ✅ | ✅ | iframe present, src on `embed/live_stream`, contains `channel=UCos52azQNBgW63_9uDJoPDA`. oEmbed resolves `/live` without needing the API key. |

**11 of 92** sources with a URL in `sources.json` have verification specs.

## Not yet covered

### Sources missing both Gutenberg and Elementor verification specs (81)

Grouped by family for planning. Each row needs `tests/gutenberg/<slug>.spec.ts` and `tests/elementor/<slug>.spec.ts`.

**Google suite** — *all covered* ✅

**YouTube family (sibling sources)** — *all covered* ✅

**Social**
- Facebook Post, Facebook Video, Instagram, Twitter Feed, Tumblr, BlueskySocial, Behance

**Audio / podcasts**
- Spotify Playlist, Spotify Album, Spotify Artist, Spotify Single
- Apple Podcast Playlist, Apple Podcast Single
- Soundcloud, MixCloud, Audiomack, Hearthis, NRK Radio, Audioboom, iHeartRadio, Acast, Audiocom, Audiocom (New), Audiomeans, AudioClip, AnnieMusic, Reverbnation Song, Reverbnation Collection, Boomplay Playlist, Boomplay Album, Boomplay Single

**Video hosts**
- Vimeo, Dailymotion, Twitch, Rumble, Wistia, Vidyard, Streamable, Coub, Afreecatv, PeerTubeTV, Pitchhub, VidMount, Videfit, Spotlightr, Adilo, Adilo (New)

**Images / galleries**
- Flickr, Giphy, Smugmug, Getty Images, Gyazo, 23hq, Cloudup

**Documents / presentations**
- Slideshare, SpeakerDeck, Sway, BeautifulAI, GitHub Gist, CodeSandbox

**Marketplaces / commerce / fundraising**
- Gumroad, ActBlue, OpenSea Collection, OpenSea Single

**Maps / 3D / interactive**
- Matterport, Padlet, LearningApps, Flourish, SocialExplorer, Archivos, Apester

**News / longform / talks**
- TED, Fader, iFixit, Gloria TV, Meetup, Meetup Delete Event, UniversitePantheonSorbonne, Byzart, CIGeography, Animoto

### Sources with no URL (cannot test)
- **LottieFiles** — `url: null` in `sources.json`. Add a URL via the `update-sources` skill before generating specs.

### Coverage gaps beyond URL-renders

Things the current verify-only architecture deliberately does **not** exercise:

1. **Editor flows** — block insertion, widget drop, control toggles, save round-trip. Belongs in plugin tests, not this harness.
2. **Source-specific Pro controls** — autoplay, loop, color, end-time, etc. These were exercised by the old YouTube Elementor spec; they were dropped on purpose. Re-introducing them means going back to editor automation.
3. **PDF / document / calendar blocks** — these have dedicated render callbacks in `EmbedPressBlockRenderer` (`render_embedpress_pdf`, `render_document`, `render_embedpress_calendar`, `render_pdf_gallery`). No specs exist. Open question: should the seed produce these via shortcode or block markup?
4. **Pro-only features** — content protection, password gating, ad manager, custom player, country restriction, lazy load, chapters / heatmap / email-capture. Front-end behaviour for any of these is untested.
5. **Carousel / gallery blocks** — `embedpress-carousel-vendor-css` is loaded on every seeded page, but no spec validates a carousel/gallery actually renders.
6. **Front-end JS player init** — `ytiframeapi.js` and the EmbedPress player init scripts load, but we never assert the player becomes interactive (play/pause, time updates).
7. **Cross-browser** — Playwright config currently runs Chromium only. Firefox / WebKit projects are not enabled.
8. **Mobile viewport** — no responsive / mobile project configured.
9. **Failure modes** — no specs for invalid URLs, expired oEmbed responses, network errors, or "Pro required" notice rendering when Pro is inactive.
10. **Authentication / capabilities** — only the admin storage state is used. No editor / author / subscriber roles are exercised.

## Follow-ups (planned)

### Layout & control variants per source

Several sources expose multiple **layouts** and rich control sets in the EmbedPress block — today we only verify the default render. Examples:

- **YouTube Channel** — list / grid / carousel / slider, plus thumbnail size, sort order, results count, autoplay, etc. Today's spec only asserts the wrapper (`[data-embed-type="YoutubeChannel"]`) because (a) the seed stores only the URL and (b) channel content needs a YouTube Data API key the test env doesn't provide.
- **Spotify Playlist / Album** — theme (light/dark), view (compact/full), size variants.
- **Carousel-capable sources** — anything that can be wrapped in EmbedPress's gallery/carousel block (loaded JS suggests it; no spec exists).
- **PDF / Document blocks** — viewer modes, toolbar, download button, watermark, page selection.

Concrete plan when this is picked up:

1. Extend `sources.json` (or a sibling `variants.json`) to allow **multiple variants per source**, each with a `gutenbergAttrs` / `elementorSettings` payload. Slug becomes `<source-slug>-<variant>` (e.g. `ep-gutenberg-youtube-channel-grid`).
2. Teach the seed to honour those attributes (Gutenberg: stuff into block `attrs` and re-resolve via `scripts/resolve-gutenberg-embeds.php`; Elementor: extend `seed/editors/elementor.ts` per-source).
3. Wire test-env API keys (`EP_YOUTUBE_API_KEY`, etc.) via `wp option update embedpress_settings ...` in `setup.sh` so YouTube Channel and similar API-gated sources actually render.
4. One spec per variant, asserting layout-specific DOM (e.g. `.ep-youtube-channel-grid`, video-card count, dark-theme class on Spotify).

Estimate: 1–2 days for YouTube Channel + sibling gallery sources; another 1–2 for Spotify / PDF families.

## Known infrastructure issues that affect coverage

Carried from the skill notes — these are pre-existing problems, not test gaps.

1. **Partial-seed ID collision** (`npm run seed -- --source <name>` after a full seed has run) — fails with `Duplicate entry '1000' for key 'wp_posts.PRIMARY'`. Workaround: full re-seed (`npm run seed`).
2. **WP must be installed before seeding** — `npm run seed` fails with missing-table errors if `npm run setup` hasn't run.

## Adding coverage

Use the `add-source-test` skill: `/add-source-test <Source Name>`. It validates the source against `sources.json`, detects whether Pro is required to render, generates the two verification specs, re-seeds, and smoke-runs. See `.claude/skills/add-source-test/SKILL.md` for the full workflow.
