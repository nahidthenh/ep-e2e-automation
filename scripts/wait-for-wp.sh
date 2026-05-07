#!/usr/bin/env bash
# Polls WordPress until it's reachable. Accepts any 2xx/3xx response:
#   200 → core is already installed (subsequent runs)
#   302 → core not installed yet, WP redirects /wp-login.php → /wp-admin/install.php
# Both mean PHP + Apache + MySQL are wired up and ready for `wp core install`.
set -euo pipefail

URL="${1:-http://localhost:8080/wp-login.php}"
MAX_TRIES=60
INTERVAL=5

echo "Waiting for WordPress at $URL ..."
for i in $(seq 1 $MAX_TRIES); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null || true)
  case "$STATUS" in
    2??|3??)
      echo "WordPress is ready (HTTP $STATUS, attempt $i)."
      exit 0
      ;;
  esac
  echo "  attempt $i/$MAX_TRIES — HTTP $STATUS, retrying in ${INTERVAL}s..."
  sleep "$INTERVAL"
done

echo "ERROR: WordPress did not respond after $((MAX_TRIES * INTERVAL))s." >&2
exit 1
