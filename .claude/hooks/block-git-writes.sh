#!/usr/bin/env bash
# PreToolUse hook for Claude Code (matcher: Bash).
# Blocks every git and GitHub write from an agent. Only Rolf commits, tags, merges and pushes.
# Read-only git (status, diff, log, show, blame, rev-parse, ls-files, grep, describe, shortlog) is allowed.
#
# Why a hook as well as permissions.deny: deny rules match the command text Claude writes, so
# `git -C . push`, `sh -c 'git push'` or `git 'push'` slip past `Bash(git push *)`. This scans the whole
# command, including subshells and quoted forms. Exit code 2 blocks the call and shows stderr to Claude.

input="$(cat)"

# Use jq when present to get just the command; otherwise scan the raw JSON (still safe, may over-match).
if command -v jq >/dev/null 2>&1; then
  cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null)"
  [ -z "$cmd" ] && cmd="$input"
else
  cmd="$input"
fi

# git, then any global options (-C <path>, -c <k=v>, --long[=v], -x), then a write subcommand,
# optionally quoted or JSON-escaped.
git_write='(^|[^[:alnum:]_.-])git([[:space:]]+(-C[[:space:]]+[^[:space:]]+|-c[[:space:]]+[^[:space:]]+|--[[:alnum:]-]+(=[^[:space:]]+)?|-[[:alpha:]]))*[[:space:]]+\\?["'"'"']?(commit|push|tag|merge|rebase|reset|revert|cherry-pick|am|apply|stash|checkout|switch|branch|remote|config|filter-branch|filter-repo|replace|notes|update-ref|symbolic-ref|add|rm|mv|restore|clean|gc|prune|worktree|submodule|subtree|init|clone|pull)([^[:alnum:]_-]|$)'

gh_write='(^|[^[:alnum:]_.-])gh[[:space:]]+(pr[[:space:]]+(create|merge|close|reopen|edit|comment|review|ready)|repo[[:space:]]+(create|delete|edit|fork|sync|rename|archive)|release|api|workflow[[:space:]]+run|issue[[:space:]]+(create|close|edit|comment))'

if printf '%s' "$cmd" | grep -Eq "$git_write"; then
  {
    echo "Blocked by .claude/hooks/block-git-writes.sh: agents must not change git state."
    echo "Rolf commits and pushes. Leave your changes in the working tree, then report:"
    echo "  - the files you changed, and"
    echo "  - a suggested commit message with NO Co-Authored-By, 'Generated with', or session trailers."
    echo "Read-only git is fine: status, diff, log, show, blame, rev-parse, ls-files, grep."
  } >&2
  exit 2
fi

if printf '%s' "$cmd" | grep -Eq "$gh_write"; then
  echo "Blocked by .claude/hooks/block-git-writes.sh: agents must not write to GitHub (PRs, repos, releases, issues, API). Ask Rolf." >&2
  exit 2
fi

exit 0
