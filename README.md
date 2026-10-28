# SeaBed Lens

The public website for **SeaBed-Net: Multicolor Hybrid CNN-ViT for Dual-Task Underwater Object Detection and Instance
Segmentation** (Rolf Genree L. Garces, University of the Philippines Tacloban, 2026). Visitors can run the model on
deep-sea ROV images, compare it with its ablated variants, and read the thesis results.

## Status

Planning complete; nothing is built yet. The work is specified feature by feature in [`specs/`](specs/README.md).

| Read | For |
|---|---|
| [`docs/design-system.md`](docs/design-system.md) | The visual system ("Quiet Scientific") |
| [`.specify/memory/constitution.md`](.specify/memory/constitution.md) | Project rules every change must follow |
| [`specs/README.md`](specs/README.md) | Roadmap, build order and the spec-driven workflow |
| [`CLAUDE.md`](CLAUDE.md) | Instructions for coding agents |

## One-time setup on your machine (Rolf)

```sh
# 1. Commit under your own identity (use your GitHub noreply address if you keep your email private)
git config user.name  "Rolf Genree L. Garces"
git config user.email "<your GitHub email or ID+username@users.noreply.github.com>"

# 2. Install the guardrails: Claude Code settings + hook into .claude/, and git hooks via core.hooksPath
sh setup/install-guardrails.sh

# 3. Agents' hook uses jq if present (recommended)
brew install jq
```

## Who commits

Only Rolf. After every spec or change, the orchestrating agent leaves the files in the working tree and gives a
copy-paste-ready block:

```sh
git add docs/design-system.md
git commit -m "fix: correct secondary text contrast rule"
```

Types: `feat` (new), `fix` (correction), `refactor` (restructure, same meaning), `del` (removal). Rolf reviews
`git diff`, runs the block and pushes. See `CLAUDE.md` §1 for the full rules and how they're enforced.
