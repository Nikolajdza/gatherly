#!/usr/bin/env bash
# Ping the API health endpoint to reduce Render cold-start pain.
# Schedule via cron, e.g. every 10 minutes:
#   */10 * * * * /path/to/gatherly/scripts/warm-api.sh
set -euo pipefail
API_URL="${GATHERLY_API_URL:-https://gatherly-api.onrender.com}/api/v1/health"
curl -fsS --max-time 45 "$API_URL" >/dev/null
echo "warmed $API_URL"
