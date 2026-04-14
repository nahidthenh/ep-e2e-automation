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
├── scripts/
│   ├── setup-wp.sh            # One-shot local setup helper
│   └── wait-for-wp.sh         # Polls until WP responds HTTP 200
├── seed/
│   └── seed.sql               # Pre-created test pages (imported after WP install)
├── playwright.config.ts
├── helpers/
│   ├── auth.ts                # loginAsAdmin()
│   ├── wp-admin.ts            # Editor navigation + publish helpers
│   └── page-utils.ts          # Embed verification + Elementor helpers
└── tests/
    ├── gutenberg.spec.ts
    ├── classic-editor.spec.ts
    └── elementor.spec.ts
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
npm run test:classic
npm run test:elementor

# With headed browser (useful when writing new tests)
npx playwright test --headed

# Open HTML report after a run
npm run test:report
```

---

## Seed data

`seed/seed.sql` is imported **after** `wp core install` and creates three
pages using fixed IDs (100–102) to avoid collisions with WordPress defaults.

| ID | Slug | Editor |
|---|---|---|
| 100 | `ep-gutenberg-youtube-test` | Gutenberg — EmbedPress block |
| 101 | `ep-classic-youtube-test` | Classic Editor — shortcode |
| 102 | `ep-elementor-youtube-test` | Elementor — EmbedPress widget |

To re-import a fresh copy at any time:

```bash
docker exec -i ep_e2e_db \
  mysql -uwpuser -pwppass wordpress < seed/seed.sql
```

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
4. Imports `seed/seed.sql`.
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
