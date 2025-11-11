# Contributing to Wishper

First off, thank you for considering contributing! We're excited to have your help in building this project. This document outlines our contribution workflow and the tools we use to keep things running smoothly.

## 🚀 Branching Workflow

Our repository uses a `dev` -> `master` Gitflow model.

1. **`master`**: This branch represents the stable, production-ready code. **Do not** push or open PRs directly to this branch (except for `dev` promotion).
2. **`dev`**: This is the main integration branch for all new features, bugfixes, and development. All PRs should be targeted at `dev`.
3. **Feature Branches**: Create your branch from `dev` (e.g., `git checkout -b feature/my-cool-thing dev`). When your work is complete, open a Pull Request back into the `dev` branch.

## 🤖 wishper-bot Command Reference

We use a bot named `wishper-bot` to help automate our workflow. You can interact with it by leaving comments on any Issue or Pull Request.

### General Commands (Issues & PRs)

These commands can be used on both Issues and Pull Requests.

| Command | Example | Action |
| --- | --- | --- |
| **Claim Issue** | `/claim` (or `/assign me`) | Assigns the issue or PR to you. |
| **Unclaim Issue** | `/unassign me` | Removes you as an assignee. |
| **Add Label** | `/label bug, frontend` | Adds specified labels (comma-separated). |

### Pull Request Commands (PRs Only)

These commands only work on Pull Requests.

| Command | Example | Action |
| --- | --- | --- |
| **Request Review** | `/review @username` | Requests a review from one or more GitHub users. |
| **Mark as Ready** | `/ready` | Marks the PR as ready for final review and merging. |
| **Rebase Branch** | `/rebase` | Updates your PR branch with the latest changes from `dev`. |
| **Promote Release** | `/promote` | (Maintainers Only) Marks a `dev`->`master` PR for production release. |
| **Flag Rollback** | `/rollback` | (Maintainers Only) Marks a PR as an emergency rollback. |

## Workflow Summary

1. Find an issue to work on or create a new one.
2. Comment `/claim` on the issue to get it assigned to you.
3. Create your feature branch: `git checkout -b my-feature dev`.
4. Write your code.
5. Open a Pull Request against the `dev` branch.
6. The bot will add labels and a checklist.
7. Comment `/review @team-backend` (or a specific person) to request a review.
8. Once your PR is approved and all checks pass, comment `/ready`.
9. Our merge bot (`Mergify`) will see the approval and `/ready` command and automatically merge your PR into `dev`.

---

Thank you for your contribution!
