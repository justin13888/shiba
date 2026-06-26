# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com), this
project adheres to [Semantic Versioning](https://semver.org), and commits follow
[Conventional Commits](https://www.conventionalcommits.org).

## [Unreleased]

### Features

- **extension:** Migrate styling to Tailwind CSS v4 ([9ae6578](https://github.com/justin13888/shiba/commit/9ae65783ccd3a2d83b6dec967493d70a00824eb5))
- **extension:** Wire end-to-end encrypted sync into the app ([d7816f5](https://github.com/justin13888/shiba/commit/d7816f56a0b2082fff4c280ebf8761e978fdef74))
- **sync:** End-to-end encrypted sync engine and self-hostable server ([88dbb0a](https://github.com/justin13888/shiba/commit/88dbb0a4b28dd94e220b8f2e3de54e70ba920f0c))
- **extension:** CRDT-backed reactive store and saved-tabs UI ([028167a](https://github.com/justin13888/shiba/commit/028167a81bd14297280e93675406a86c3ca3702e))
- **adapters:** Yjs CRDT, WebCrypto envelope, and IndexedDB persistence ([c0a5ae5](https://github.com/justin13888/shiba/commit/c0a5ae5fe3596ecb337454e6108f89107eec6870))
- **core:** Document operations, selectors, reconcile, and pure subsystems with tests ([f12458e](https://github.com/justin13888/shiba/commit/f12458ecef5d46b6e92f14dbdf7437c8de0dfc39))
- **core:** Model, ports, and document API contracts ([a84e045](https://github.com/justin13888/shiba/commit/a84e045bf2a8f5c251e43938b118bfeeab9df39c))
- **search:** Populate saved-tab search suggestions from real tabs ([78acbc9](https://github.com/justin13888/shiba/commit/78acbc9b29f7d2b628de32abab3583b6289ec36f))

### Documentation

- Correct test-count reference in README ([2b9a40b](https://github.com/justin13888/shiba/commit/2b9a40be5035175d293226acc5920200ef7a40b7))
- Rewrite README with architecture decisions and self-hosting guide ([1fe662a](https://github.com/justin13888/shiba/commit/1fe662afbb234cb4e8b3ad6f866bbb3af3bc46c2))

### Testing

- **deps:** Upgrade Vitest to v4 and test libraries ([075e11c](https://github.com/justin13888/shiba/commit/075e11ce50c605cb7c4454d4589b3864a65b9269))

### Build System

- **mise:** Provision commit/release toolchain with auto-installed hooks ([81bee95](https://github.com/justin13888/shiba/commit/81bee95ba78542b458e7cc4825633a209036abd8))

### CI

- **hooks:** Enforce conventional commits and run Biome via hk ([332cbdc](https://github.com/justin13888/shiba/commit/332cbdcefa81cd34dee5b0508c835e93cfff9e35))

### Dependencies

- **deps:** Upgrade extension dependencies (excl. Tailwind) ([5c2a295](https://github.com/justin13888/shiba/commit/5c2a29575e195e253ca2664eb25d1a80be8ddf2b))
- **deps:** Upgrade server dependencies ([e473e80](https://github.com/justin13888/shiba/commit/e473e802595ee9d88795fd2e7940e423b5ff1690))
- **deps:** Upgrade core and adapter libraries ([e32149e](https://github.com/justin13888/shiba/commit/e32149edb8268e4b350b0916e9c93792c5503f03))
- **deps:** Upgrade Biome to 2.5 and TypeScript to 6 ([0c7a306](https://github.com/justin13888/shiba/commit/0c7a3064cef46ab59fb0d670de5ec0a8e14a977b))
- **deps:** Adopt pnpm 11 and enforce Node 22 baseline ([50826fa](https://github.com/justin13888/shiba/commit/50826faabbe8444ddeb6ebdb72a397ea3a15b9b0))

### Miscellaneous

- Restructure into a pnpm-workspace monorepo on a Node toolchain ([5403a79](https://github.com/justin13888/shiba/commit/5403a79c028d796753808658f897d2785c96a21b))
- Embed state into search param ([fcafa78](https://github.com/justin13888/shiba/commit/fcafa781f7763c15b686dffa365b86d007c3271a))
- Add more tab saving functionality ([960abe1](https://github.com/justin13888/shiba/commit/960abe1bc48bc72cd1b4edb871358a88d566062b))
- Update packages ([9344be5](https://github.com/justin13888/shiba/commit/9344be53cc79c9d157be508b03d034005a493107))
- Update diffDate() ([41cf287](https://github.com/justin13888/shiba/commit/41cf2875bf9aa1101aeecbfafa47cbe904edaca8))
- Setup more dependencies ([65cb769](https://github.com/justin13888/shiba/commit/65cb769d9c1d89df78b73a8ea7b2143382b42f95))
- Update tsconfig.json ([db3883a](https://github.com/justin13888/shiba/commit/db3883a687636217ea722ae540a51c1e0e39bbd6))


