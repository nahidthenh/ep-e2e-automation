#!/usr/bin/env bash
# Installs WordPress, activates plugins, and imports seed data.
# Run from the repo root AFTER `docker-compose up -d` and the WP container
# reports healthy (or after wait-for-wp.sh passes).
#
# Plugin resolution order (per plugin):
#   1. EP_FREE_PLUGIN_PATH / EP_PRO_PLUGIN_PATH env vars → local folder (docker cp)
#   2. Fallback → install from wordpress.org (free only; pro requires a local path)
set -euo pipefail

WP_URL="${WP_URL:-http://localhost:8080}"
WP_ADMIN_USER="${WP_ADMIN_USER:-admin}"
WP_ADMIN_PASS="${WP_ADMIN_PASS:-admin}"
WP_ADMIN_EMAIL="${WP_ADMIN_EMAIL:-admin@example.com}"
WP_TITLE="${WP_TITLE:-EmbedPress E2E}"

MYSQL_USER="${MYSQL_USER:-wpuser}"
MYSQL_PASS="${MYSQL_PASSWORD:-wppass}"
MYSQL_DB="${MYSQL_DATABASE:-wordpress}"

# Paths to local plugin checkouts (optional; falls back to wordpress.org)
EP_FREE_PLUGIN_PATH="${EP_FREE_PLUGIN_PATH:-}"
EP_PRO_PLUGIN_PATH="${EP_PRO_PLUGIN_PATH:-}"

WP_CONTAINER="ep_e2e_wp"
DB_CONTAINER="ep_e2e_db"

wp_cli() {
  docker exec "$WP_CONTAINER" wp "$@" --path=/var/www/html --allow-root
}

# ── Helper: install a plugin from a local directory ──────────────────────────
install_plugin_from_path() {
  local slug="$1"
  local src_path="$2"

  # Resolve relative paths from repo root (where this script is called from)
  local abs_path
  abs_path="$(cd "$(dirname "$src_path")" 2>/dev/null && pwd)/$(basename "$src_path")"

  if [ ! -d "$abs_path" ]; then
    echo "  WARNING: $abs_path not found — skipping local install of $slug"
    return 1
  fi

  echo "  → Copying $slug from $abs_path"
  # Deactivate + remove any existing version first
  wp_cli plugin deactivate "$slug" 2>/dev/null || true
  wp_cli plugin delete    "$slug" 2>/dev/null || true

  # Copy into container
  docker exec "$WP_CONTAINER" mkdir -p "/var/www/html/wp-content/plugins/$slug"
  docker cp "$abs_path/." "$WP_CONTAINER:/var/www/html/wp-content/plugins/$slug/"
  return 0
}

# ─────────────────────────────────────────────────────────────────────────────
echo "━━━ Installing WordPress core ━━━"
wp_cli core install \
  --url="$WP_URL" \
  --title="$WP_TITLE" \
  --admin_user="$WP_ADMIN_USER" \
  --admin_password="$WP_ADMIN_PASS" \
  --admin_email="$WP_ADMIN_EMAIL" \
  --skip-email

echo "━━━ Installing Elementor ━━━"
wp_cli plugin install elementor --activate

echo "━━━ Installing EmbedPress (free) ━━━"
if [ -n "$EP_FREE_PLUGIN_PATH" ]; then
  if install_plugin_from_path "embedpress" "$EP_FREE_PLUGIN_PATH"; then
    wp_cli plugin activate embedpress
    echo "  ✓ EmbedPress free activated from local path"
  else
    echo "  Falling back to wordpress.org..."
    wp_cli plugin install embedpress --activate
  fi
else
  echo "  EP_FREE_PLUGIN_PATH not set — installing from wordpress.org"
  wp_cli plugin install embedpress --activate
fi

echo "━━━ Installing EmbedPress Pro ━━━"
if [ -n "$EP_PRO_PLUGIN_PATH" ]; then
  if install_plugin_from_path "embedpress-pro" "$EP_PRO_PLUGIN_PATH"; then
    wp_cli plugin activate embedpress-pro
    echo "  ✓ EmbedPress Pro activated from local path"
  else
    echo "  WARNING: EmbedPress Pro not installed (local path missing)"
  fi
else
  echo "  EP_PRO_PLUGIN_PATH not set — skipping Pro install"
fi

echo "━━━ Setting permalink structure ━━━"
wp_cli rewrite structure '/%postname%/' --hard
wp_cli rewrite flush

echo "━━━ Running WordPress DB upgrade (if needed) ━━━"
wp_cli core update-db

echo "━━━ Fixing wp-content ownership ━━━"
# wp-cli ran as root, so plugin/theme files are root-owned. Apache runs as
# www-data — without this chown, deletes from the WP dashboard fail with
# "Could not fully remove the plugin/theme".
docker exec "$WP_CONTAINER" chown -R www-data:www-data /var/www/html/wp-content

echo "━━━ Seeding test pages from sources.json ━━━"
bash scripts/seed-pages.sh

echo "━━━ Flushing rewrite rules ━━━"
wp_cli rewrite flush

echo ""
echo "✓ Setup complete."
echo "  URL:    $WP_URL"
echo "  Admin:  $WP_ADMIN_USER / $WP_ADMIN_PASS"
wp_cli plugin list --fields=name,version,status 2>/dev/null | grep -v "^Deprecated\|^\[.*Dep" || true
