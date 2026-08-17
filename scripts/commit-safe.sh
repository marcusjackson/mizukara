#!/usr/bin/env bash
set -euo pipefail
# Usage: scripts/commit-safe.sh "<commit message>"
MSG="${1:-}"
if [ -z "$MSG" ]; then
  echo "Usage: $0 \"commit message\""
  exit 2
fi
# Stage all changes first
git add -A
if printf '%s' "$MSG" | grep -q $'\n'; then
  tmp=$(mktemp)
  printf '%s\n' "$MSG" > "$tmp"
  git commit -F "$tmp"
  rm -f "$tmp"
else
  git commit -m "$MSG"
fi
