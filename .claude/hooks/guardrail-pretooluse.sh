#!/usr/bin/env bash
# PreToolUse guardrail: hard-enforced rules a system prompt alone can't guarantee.
# Substituted at scaffold time by init.sh.
set -euo pipefail

BRANCH_PREFIX="v2/hadi/"
REMOTE="hadiahmad06/planumn"

input="$(cat)"
command="$(echo "$input" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"
cwd="$(echo "$input" | jq -r '.cwd // empty' 2>/dev/null || true)"

[[ -z "$command" ]] && exit 0

deny() {
  echo "Blocked by pipeline guardrail: $1" >&2
  exit 2
}

case "$command" in
  *"push"*"origin main"*|*"push"*"origin master"*)
    deny "direct push to main/master is not allowed — open a PR instead" ;;
  *"push --force"*|*"push -f"*)
    deny "force push is not allowed" ;;
  *"rm -rf"*)
    deny "recursive force delete is not allowed" ;;
  *"branch -D"*)
    deny "force branch delete is not allowed" ;;
  *"git merge"*)
    deny "merging is not allowed from within the pipeline agent" ;;
esac

if [[ "$command" == "git checkout -b"* || "$command" == "git worktree add"* ]]; then
  if [[ -n "$BRANCH_PREFIX" && "$command" != *"$BRANCH_PREFIX"* ]]; then
    deny "branch name must use prefix '$BRANCH_PREFIX'"
  fi
fi

if [[ "$command" == "git push"* && -n "$cwd" ]]; then
  actual_remote="$(git -C "$cwd" remote get-url origin 2>/dev/null || echo "")"
  if [[ -n "$REMOTE" && "$actual_remote" != *"$REMOTE"* ]]; then
    deny "origin remote '$actual_remote' does not match allowlisted repo '$REMOTE'"
  fi
fi

exit 0
