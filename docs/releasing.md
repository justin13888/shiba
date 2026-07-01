# Releasing

How the toolchain enforces Conventional Commits and ships releases. Configured by
[`mise.toml`](../mise.toml), [`hk.pkl`](../hk.pkl), [`cliff.toml`](../cliff.toml),
and the `release-pr` / `release` workflows under [`.github/workflows`](../.github/workflows).

## Toolchain (mise)

[mise](https://mise.jdx.dev) provisions Bun (the package manager) plus the
commit/release tools — `hk`, `pkl`, `convco`, `git-cliff` — pinned in `mise.toml`.
Node stays on `.nvmrc`.

```bash
mise install   # provision tools AND install git hooks (postinstall → `hk install`)
```

The `postinstall` hook runs `hk install` on every `mise install`, so a fresh clone
wires up its git hooks in one step — no separate command to remember. Make sure mise
is **activated** (or its shims are on `PATH`) so the hooks can find `hk`/`convco`;
otherwise commits fail with `hk: command not found`. See
[mise activation](https://mise.jdx.dev/getting-started.html).

## Git hooks (hk)

[hk](https://hk.jdx.dev) runs the hooks defined in `hk.pkl`:

| Hook | Action |
|---|---|
| `commit-msg` | `convco` rejects non–Conventional-Commit messages |
| `pre-commit` | Biome formats + lints staged files (auto-fix) |
| `pre-push`   | Biome check (no mutation) |

`hk check` / `hk fix` run the linters over the whole tree on demand. Set `HK=0` to
bypass hooks for a single command (CI does this).

## Commit conventions

Messages follow [Conventional Commits](https://www.conventionalcommits.org):
`type(scope): summary`. Types in use: `feat`, `fix`, `perf`, `refactor`, `docs`,
`test`, `build`, `ci`, `style`, `chore`. `feat` → minor bump, `fix` → patch,
`!` / `BREAKING CHANGE` → major. Type and scope also drive changelog grouping
(`cliff.toml`).

## Changelog (git-cliff)

[`cliff.toml`](../cliff.toml) renders `CHANGELOG.md` from commit history (Keep a
Changelog layout; pre-convention commits are filtered out). Regenerate locally:

```bash
git-cliff -o CHANGELOG.md     # full changelog
git-cliff --unreleased        # preview the pending section
```

## Release flow

1. **Release PR** — `release-pr.yml` runs on pushes to `master`: `convco version
   --bump` computes the next version, `git-cliff` regenerates the changelog, and the
   bump (`package.json` + `CHANGELOG.md`) is opened as a `chore(release): vX.Y.Z` PR
   that refreshes as more commits land.
2. **Merge** the release PR when ready to cut the version.
3. **Tag** the merge commit to publish:
   ```bash
   git switch master && git pull
   git tag vX.Y.Z && git push origin vX.Y.Z
   ```
4. **Publish** — `release.yml` renders the tag's notes with git-cliff and creates the
   GitHub release.

> The release PR is created with `GITHUB_TOKEN`, so it does not itself trigger other
> workflows; re-run CI on it manually if you want checks before merging.
