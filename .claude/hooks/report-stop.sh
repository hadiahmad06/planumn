#!/usr/bin/env bash
# Stop hook: if this run opened a PR, post it to Slack via the slack adapter.
# Substituted at scaffold time by init.sh. No-op if no PR URL or no adapter installed.
set -euo pipefail

SLACK_CHANNEL=""

input="$(cat)"
transcript="$(echo "$input" | jq -r '.transcript_path // empty' 2>/dev/null || true)"
project_dir="$(echo "$input" | jq -r '.cwd // empty' 2>/dev/null || true)"

[[ -z "$transcript" || ! -f "$transcript" ]] && exit 0

pr_url="$(grep -oE 'https://github\.com/[^ "]+/pull/[0-9]+' "$transcript" | tail -n1 || true)"
[[ -z "$pr_url" ]] && exit 0

adapter="$project_dir/.pipeline/adapters/slack/post.sh"
if [[ -n "$SLACK_CHANNEL" && -x "$adapter" ]]; then
  "$adapter" "$SLACK_CHANNEL" "Pipeline opened: $pr_url" || true
fi

exit 0
