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
4. **Publish** — pushing the tag fans out to three workflows in parallel:
   - [`release.yml`](../.github/workflows/release.yml) → GitHub release with git-cliff notes.
   - [`publish-container.yml`](../.github/workflows/publish-container.yml) → multi-arch server image to GHCR.
   - [`publish-extension.yml`](../.github/workflows/publish-extension.yml) → Chrome Web Store + Firefox AMO, and attaches the zips to the release.

> The release PR is created with `GITHUB_TOKEN`, so it does not itself trigger other
> workflows; re-run CI on it manually if you want checks before merging. The **tag**
> push (done by a human) does trigger the publish workflows above.

## Release artifacts

| Target | Workflow | Auth | Secrets |
|---|---|---|---|
| GitHub release | `release.yml` | `GITHUB_TOKEN` | none |
| Server image (GHCR) | `publish-container.yml` | `GITHUB_TOKEN` (`packages: write`) | **none** — trusted publishing |
| Chrome Web Store | `publish-extension.yml` | OAuth2 refresh token | `CHROME_*` (4) |
| Firefox AMO | `publish-extension.yml` | JWT API key | `FIREFOX_JWT_*` (2) |

Neither web store supports OIDC/trusted publishing, so their API credentials are the
only secrets the pipeline needs. GHCR uses the built-in token — nothing to configure.

## First-time store setup (one-time, human)

Do this once before the first tagged release. Afterwards every release is fully
automatic on tag.

### Chrome Web Store
1. Register a [Chrome Web Store developer account](https://chrome.google.com/webstore/devconsole) ($5 one-time fee).
2. **Create the item once by hand** — upload any built `…-chrome.zip` (from a CI
   run's `extension-zips` artifact, or `bun run --filter @shiba/extension zip`) in
   the dashboard; the API cannot create a brand-new item. Copy the **Extension ID**
   and fill the store listing (description, screenshots, privacy).
3. In [Google Cloud](https://console.cloud.google.com): enable the **Chrome Web Store
   API**, create an **OAuth client (Desktop)**, then generate a **refresh token**
   (see [publish-browser-extension's guide](https://github.com/aklinker1/publish-browser-extension#chrome-web-store)).
4. Add repo secrets: `CHROME_EXTENSION_ID`, `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`,
   `CHROME_REFRESH_TOKEN`.

### Firefox AMO
5. Create an [addons.mozilla.org](https://addons.mozilla.org) account. The add-on id
   (`shiba@justinchung.net`) is already set in `wxt.config.ts`.
6. **Create the listing once** (name, summary, categories); later versions upload via
   API automatically. Generate API credentials at *Developer Hub → Manage API Keys*.
7. Add repo secrets: `FIREFOX_JWT_ISSUER`, `FIREFOX_JWT_SECRET`.

### GHCR
Nothing to configure — the container push authenticates with `GITHUB_TOKEN`. After the
first tag pushes the image, optionally make the package **public** and link it to the
repo in the GHCR package settings (Packages → shiba-server → Package settings).

Add secrets under **Settings → Secrets and variables → Actions**.

