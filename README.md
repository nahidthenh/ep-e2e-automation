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
├── Dockerfile                 # WordPress 6.4 + WP-CLI
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

- Docker Desktop running
- Node.js 20+
- EmbedPress zip (if testing a dev build — otherwise the free version is
  fetched from wordpress.org automatically)

### 1. Environment

```bash
cp .env.example .env
# Adjust WP_ADMIN_PASS and any port conflicts if needed
```

### 2. Start containers

```bash
docker-compose up -d --build
```

### 3. Wait for WordPress

```bash
bash scripts/wait-for-wp.sh
```

### 4. Install WordPress + plugins + seed data

```bash
bash scripts/setup-wp.sh
```

> **Custom EmbedPress zip**: edit `setup-wp.sh` and replace the
> `wp plugin install embedpress --activate` line with:
> ```bash
> docker cp /path/to/embedpress.zip ep_e2e_wp:/tmp/
> docker exec ep_e2e_wp wp plugin install /tmp/embedpress.zip \
>   --activate --path=/var/www/html --allow-root
> ```

### 5. Install Playwright

```bash
npm ci
npx playwright install --with-deps chromium
```

### 6. Run tests

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
