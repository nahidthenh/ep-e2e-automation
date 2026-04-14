#!/usr/bin/env bash
# Installs WordPress, activates plugins, and imports seed data.
# Run from the repo root AFTER `docker-compose up -d` and the WP container
# reports healthy (or after wait-for-wp.sh passes).
set -euo pipefail

WP_URL="${WP_URL:-http://localhost:8080}"
WP_ADMIN_USER="${WP_ADMIN_USER:-admin}"
WP_ADMIN_PASS="${WP_ADMIN_PASS:-admin}"
WP_ADMIN_EMAIL="${WP_ADMIN_EMAIL:-admin@example.com}"
WP_TITLE="${WP_TITLE:-EmbedPress E2E}"

MYSQL_USER="${MYSQL_USER:-wpuser}"
MYSQL_PASS="${MYSQL_PASSWORD:-wppass}"
MYSQL_DB="${MYSQL_DATABASE:-wordpress}"

WP_CONTAINER="ep_e2e_wp"
DB_CONTAINER="ep_e2e_db"

wp_cli() {
  docker exec "$WP_CONTAINER" wp "$@" --path=/var/www/html --allow-root
}

echo "━━━ Installing WordPress core ━━━"
wp_cli core install \
  --url="$WP_URL" \
  --title="$WP_TITLE" \
  --admin_user="$WP_ADMIN_USER" \
  --admin_password="$WP_ADMIN_PASS" \
  --admin_email="$WP_ADMIN_EMAIL" \
  --skip-email

echo "━━━ Installing & activating plugins ━━━"

# Classic Editor (needed for classic-editor tests)
wp_cli plugin install classic-editor --activate

# Elementor
wp_cli plugin install elementor --activate

# EmbedPress — install from wordpress.org (free version)
# If you have a local zip, use: --force path/to/embedpress.zip
wp_cli plugin install embedpress --activate

echo "━━━ Setting permalink structure ━━━"
wp_cli rewrite structure '/%postname%/' --hard

echo "━━━ Importing seed data ━━━"
docker exec -i "$DB_CONTAINER" \
  mysql -u"$MYSQL_USER" -p"$MYSQL_PASS" "$MYSQL_DB" \
  < seed/seed.sql

echo "━━━ Flushing rewrite rules ━━━"
wp_cli rewrite flush

echo ""
echo "✓ Setup complete. WordPress is ready at $WP_URL"
echo "  Admin: $WP_ADMIN_USER / $WP_ADMIN_PASS"
