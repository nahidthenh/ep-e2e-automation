#!/usr/bin/env bash
# Seeds EmbedPress test pages into the running WordPress container.
#
# For every source in sources.json with a non-null URL, creates one Gutenberg
# page and one Elementor page containing an EmbedPress block/widget pointing
# at that URL. Re-runs are idempotent: previously-seeded pages are wiped
# before insertion.
#
# Usage:
#   bash scripts/seed-pages.sh                          # everything
#   bash scripts/seed-pages.sh --source YouTube         # one source, both editors
#   bash scripts/seed-pages.sh --editor gutenberg       # all sources, Gutenberg only
#   bash scripts/seed-pages.sh --source YouTube --editor elementor
set -euo pipefail

# Load only the DB vars we actually need from .env, line by line. Avoids
# `source .env` choking on unquoted values that contain spaces (e.g.
# WP_TITLE=EmbedPress E2E).
if [ -f .env ]; then
  for key in MYSQL_USER MYSQL_PASSWORD MYSQL_DATABASE; do
    val="$(grep -E "^${key}=" .env | head -n1 | cut -d= -f2- \
            | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")"
    [ -n "$val" ] && export "${key}=${val}"
  done
fi

MYSQL_USER="${MYSQL_USER:-wpuser}"
MYSQL_PASS="${MYSQL_PASSWORD:-wppass}"
MYSQL_DB="${MYSQL_DATABASE:-wordpress}"
DB_CONTAINER="${DB_CONTAINER:-ep_e2e_db}"
WP_CONTAINER="${WP_CONTAINER:-ep_e2e_wp}"

# Generate SQL → pipe into MySQL inside the DB container
npx tsx seed/index.ts "$@" \
  | docker exec -i "$DB_CONTAINER" \
      mysql -u"$MYSQL_USER" -p"$MYSQL_PASS" "$MYSQL_DB"

# Resolve [embedpress] shortcodes in seeded Gutenberg pages and bake the iframe
# HTML into the embedpress/embedpress block (inner content + `embedHTML`
# attribute), matching what the editor saves. Required for dynamic providers
# (Instagram, OpenSea, Wistia, Google Photos) where the block's render callback
# only honours `embedHTML`; gives every other source authentic block markup too.
docker cp scripts/resolve-gutenberg-embeds.php "$WP_CONTAINER:/tmp/resolve-gutenberg-embeds.php" >/dev/null
docker exec "$WP_CONTAINER" wp eval-file /tmp/resolve-gutenberg-embeds.php \
  --path=/var/www/html --allow-root
docker exec "$WP_CONTAINER" rm /tmp/resolve-gutenberg-embeds.php >/dev/null 2>&1 || true

# WordPress caches permalinks aggressively; flush so new slugs resolve.
docker exec "$WP_CONTAINER" wp rewrite flush --path=/var/www/html --allow-root >/dev/null 2>&1 || true

echo "✓ Seed pages applied."
