#!/bin/sh
# One-time setup, run by Rolf from the repository root:   sh setup/install-guardrails.sh
#
# 1. Installs the Claude Code project settings and the git-write-blocking hook into .claude/
#    (remote agents can't write to .claude/, so they are staged in setup/claude/).
# 2. Points git at the repository's hooks in .githooks/ (strip AI trailers on commit, refuse AI-authored pushes).
# 3. Shows your git identity so you can confirm commits will be yours.
set -eu

root="$(git rev-parse --show-toplevel)"
cd "$root"

mkdir -p .claude/hooks
cp setup/claude/settings.json .claude/settings.json
cp setup/claude/hooks/block-git-writes.sh .claude/hooks/block-git-writes.sh
chmod +x .claude/hooks/block-git-writes.sh .githooks/commit-msg .githooks/pre-push

git config core.hooksPath .githooks

echo "Installed .claude/settings.json and .claude/hooks/block-git-writes.sh"
echo "git core.hooksPath = $(git config core.hooksPath)"
echo "git user.name      = $(git config user.name || echo '(not set)')"
echo "git user.email     = $(git config user.email || echo '(not set)')"
command -v jq >/dev/null 2>&1 || echo "Tip: install jq (brew install jq) so the agent hook reads commands precisely."
echo "Done. Restart any running Claude Code session in this folder, then run /status to confirm the project settings loaded."
