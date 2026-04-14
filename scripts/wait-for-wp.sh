#!/usr/bin/env bash
# Polls WordPress until the login page responds with HTTP 200.
set -euo pipefail

URL="${1:-http://localhost:8080/wp-login.php}"
MAX_TRIES=60
INTERVAL=5

echo "Waiting for WordPress at $URL ..."
for i in $(seq 1 $MAX_TRIES); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null || true)
  if [ "$STATUS" = "200" ]; then
    echo "WordPress is ready (attempt $i)."
    exit 0
  fi
  echo "  attempt $i/$MAX_TRIES — HTTP $STATUS, retrying in ${INTERVAL}s..."
  sleep "$INTERVAL"
done

echo "ERROR: WordPress did not respond after $((MAX_TRIES * INTERVAL))s." >&2
exit 1
