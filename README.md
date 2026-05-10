# EmbedPress E2E Test Suite

Playwright + Docker regression tests for the EmbedPress WordPress plugin.

## Stack

| Layer | Tool |
|---|---|
| Browser automation | Playwright (TypeScript) |
| Runtime environment | Docker + docker-compose |
| WordPress management | WP-CLI (baked into image) |
| CI | GitHub Actions |

---

## Directory layout

```
.
├── Dockerfile                 # Latest WordPress on PHP 8.3 + WP-CLI
├── docker-compose.yml         # WordPress + MySQL services
├── .env.example               # Copy to .env and customise
├── sources.json               # source name + URL pairs driving seeded pages
├── scripts/
│   ├── setup-wp.sh            # One-shot local setup (WP install + plugins + seed)
│   ├── seed-pages.sh          # Generates and applies seed SQL into the DB
│   └── wait-for-wp.sh         # Polls until WP responds HTTP 200
├── seed/
│   ├── index.ts               # Seed SQL generator (reads sources.json)
│   ├── sources.ts             # Source loader, slug + title helpers
│   └── editors/
│       ├── gutenberg.ts       # Builds <!-- wp:embedpress/embedpress --> markup
│       └── elementor.ts       # Builds _elementor_data JSON (embedpres widget)
├── playwright.config.ts
├── helpers/
│   ├── auth.ts                # loginAsAdmin()
│   ├── wp-admin.ts            # Editor navigation + publish helpers
│   └── page-utils.ts          # Embed verification + Elementor helpers
└── tests/
    ├── gutenberg/             # Gutenberg specs (one per source — added via skill)
    └── elementor/             # Elementor specs (one per source — added via skill)
```

---

## Local quick-start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running
- Node.js 20+
- Git access to both private plugin repos (`WPDevelopers/embedpress` and `WPDevelopers/embedpress-pro`)

### 1. Clone the plugin repos

The setup script installs EmbedPress from your local checkouts rather than
wordpress.org, so both repos need to be cloned alongside this one first.

```bash
# Recommended layout — clone next to this repo
git clone https://github.com/WPDevelopers/embedpress     ../EmbedPress/embedpress
git clone https://github.com/WPDevelopers/embedpress-pro ../EmbedPress/embedpress-pro
```

You can clone them anywhere — just update `EP_FREE_PLUGIN_PATH` and
`EP_PRO_PLUGIN_PATH` in `.env` to match.

### 2. Environment

```bash
cp .env.example .env
```

Open `.env` and verify these two paths point to your local clones:

```dotenv
EP_FREE_PLUGIN_PATH=../EmbedPress/embedpress
EP_PRO_PLUGIN_PATH=../EmbedPress/embedpress-pro
```

Adjust `WP_PORT` if 8080 is already taken, and optionally set `YT_SECRET`
(YouTube Data API key) and `SLACK_BOT_TOKEN` / `SLACK_CHANNEL_ID` for
Slack reporting.

### 3. Install Node dependencies

`setup-wp.sh` calls `npx tsx` internally, so node_modules must exist before
you run it.

```bash
npm ci
npx playwright install --with-deps chromium
```

### 4. Start containers

```bash
docker-compose up -d --build
```

### 5. Wait for WordPress

```bash
bash scripts/wait-for-wp.sh
```

### 6. Install WordPress + plugins + seed data

```bash
bash scripts/setup-wp.sh
```

This single script:
- Installs WordPress core
- Installs and activates Elementor + Hello Elementor theme
- Copies EmbedPress free and Pro from your local clones into the container
- Writes the YouTube API key (if `YT_SECRET` is set)
- Uploads the PDF fixture and seeds all test pages from `sources.json`

### 7. Run tests

```bash
# All tests
npm test

# Single suite
npm run test:gutenberg
npm run test:elementor

# With headed browser (useful when writing new tests)
npx playwright test --headed

# Open HTML report after a run
npm run test:report
```

---

## Seed data

Pages are seeded dynamically from `sources.json`. For every source whose
`url` is non-null, `scripts/seed-pages.sh` creates two pages:

| Editor | Slug pattern | Title pattern |
|---|---|---|
| Gutenberg | `ep-gutenberg-{source-slug}` | `EP Gutenberg — {Source Name}` |
| Elementor | `ep-elementor-{source-slug}` | `EP Elementor — {Source Name}` |

Page IDs start at 1000 and increment per source — well above WordPress
defaults to avoid collisions.

```bash
# Seed everything (all sources, both editors)
npm run seed

# Just one source
bash scripts/seed-pages.sh --source YouTube

# Just one editor
npm run seed:gutenberg
npm run seed:elementor

# Pinpoint a single page
bash scripts/seed-pages.sh --source YouTube --editor elementor
```

Re-runs are idempotent — existing pages with matching slugs are deleted
before being re-inserted.

---

## Test strategy

Each spec file covers two scenarios:

1. **Seeded page** — navigate to the pre-created page and assert the YouTube
   embed renders. Fast, deterministic, great for smoke testing.
2. **Create flow** — create a new page via the editor UI, add the embed, publish,
   navigate to the front end, assert the iframe appears. Exercises the full
   author workflow.

---

## CI (GitHub Actions)

The workflow in `.github/workflows/e2e.yml`:

1. Builds the Docker image and starts services.
2. Polls `wait-for-wp.sh` until WordPress answers HTTP 200.
3. Runs WP-CLI to install core, activate plugins, set pretty permalinks.
4. Runs `scripts/seed-pages.sh` to seed pages from `sources.json`.
5. Runs `npx playwright test`.
6. Uploads the HTML report and failure artifacts on every run.

Playwright browsers are cached by `package-lock.json` hash to keep CI fast.

---

## Resetting the environment

```bash
# Wipe volumes and start fresh
docker-compose down -v
docker-compose up -d --build
bash scripts/wait-for-wp.sh && bash scripts/setup-wp.sh
```

> Ensure `npm ci` has been run at least once before `setup-wp.sh` — it
> depends on `npx tsx` being available in `node_modules`.
