# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com), this
project adheres to [Semantic Versioning](https://semver.org), and commits follow
[Conventional Commits](https://www.conventionalcommits.org).

## [0.1.0] - 2026-07-02

### Features

- **extension:** Stash-and-close toolbar action, live sync status, restore clears group ([070c4a5](https://github.com/justin13888/shiba/commit/070c4a5eadf5e3ed643de02239e2f87ced1d81b6))
- **extension:** Error boundary, states, and large-group capping ([07b2142](https://github.com/justin13888/shiba/commit/07b2142a75eed56453fc90df276fbfbb8e725c97))
- **extension:** Trash view + undo ([95d8c7f](https://github.com/justin13888/shiba/commit/95d8c7fe695e34b4fb3c6a6250298bea9595e403))
- **extension:** Accessible UI primitives (confirm dialog + switch) ([a3be780](https://github.com/justin13888/shiba/commit/a3be78075e7e9518903b74501a57f4c61cf66346))
- **core:** Enforce locked-resists-delete ([de91999](https://github.com/justin13888/shiba/commit/de91999228414a4df74d1ff4bdf92e7036371a76))
- **extension:** Settings backup panel + default-on toggle ([d7e9e5f](https://github.com/justin13888/shiba/commit/d7e9e5ff7ab69cb292ed7c937d537e6d17c810c4))
- **extension:** Restore + file export/import over the bridge ([d878980](https://github.com/justin13888/shiba/commit/d87898091d51dad9549c644ddfb0147a9855f5e2))
- **extension:** Hourly snapshot alarm — capture + evict ([36ad5d9](https://github.com/justin13888/shiba/commit/36ad5d9abfdcf56c9b4819e3a60e7c95e7abd086))
- **core:** Round-trip Shiba backups into a restorable snapshot ([7d6f527](https://github.com/justin13888/shiba/commit/7d6f5276dc245b82a99ab21a28a62da9c32e996b))
- **core:** MaterializeDocSnapshot op (restore as a copy) ([cd7f364](https://github.com/justin13888/shiba/commit/cd7f364f1810b932fdc1bcc222d838bfb6bb1e14))
- **core:** Default hourly / one-week snapshot retention ([81173b0](https://github.com/justin13888/shiba/commit/81173b0a357a08a5a323ca4de0028aa1d8c36ab7))
- **core:** Snapshot content hash + change-gated capture decision ([9743459](https://github.com/justin13888/shiba/commit/9743459eb8a18c787c4ca3582310697205ef4ef9))
- **core:** Bind docId as AES-GCM AAD in the sync engine ([55ce911](https://github.com/justin13888/shiba/commit/55ce9119fcd37b4fa108fc6a64df78f51686439a))
- **extension:** Alarms scaffold (compaction + reconcile self-heal) ([c25f288](https://github.com/justin13888/shiba/commit/c25f2880ee079fe0e5445dd85e3cb6ec88a19ca1))
- **extension:** Typed messaging bridge + docUpdate broadcast ([0b438f6](https://github.com/justin13888/shiba/commit/0b438f6be255d5a6d63f46fa2a3e3fa29e0d5542))
- **core:** Add serializable command bus (Command + applyCommand) ([eeedbc0](https://github.com/justin13888/shiba/commit/eeedbc019dc8a97d5f7ce94f74a8029c706f9c58))
- **extension:** Migrate styling to Tailwind CSS v4 ([9ae6578](https://github.com/justin13888/shiba/commit/9ae65783ccd3a2d83b6dec967493d70a00824eb5))
- **extension:** Wire end-to-end encrypted sync into the app ([d7816f5](https://github.com/justin13888/shiba/commit/d7816f56a0b2082fff4c280ebf8761e978fdef74))
- **sync:** End-to-end encrypted sync engine and self-hostable server ([88dbb0a](https://github.com/justin13888/shiba/commit/88dbb0a4b28dd94e220b8f2e3de54e70ba920f0c))
- **extension:** CRDT-backed reactive store and saved-tabs UI ([028167a](https://github.com/justin13888/shiba/commit/028167a81bd14297280e93675406a86c3ca3702e))
- **adapters:** Yjs CRDT, WebCrypto envelope, and IndexedDB persistence ([c0a5ae5](https://github.com/justin13888/shiba/commit/c0a5ae5fe3596ecb337454e6108f89107eec6870))
- **core:** Document operations, selectors, reconcile, and pure subsystems with tests ([f12458e](https://github.com/justin13888/shiba/commit/f12458ecef5d46b6e92f14dbdf7437c8de0dfc39))
- **core:** Model, ports, and document API contracts ([a84e045](https://github.com/justin13888/shiba/commit/a84e045bf2a8f5c251e43938b118bfeeab9df39c))
- **search:** Populate saved-tab search suggestions from real tabs ([78acbc9](https://github.com/justin13888/shiba/commit/78acbc9b29f7d2b628de32abab3583b6289ec36f))

### Bug Fixes

- **core:** Derive sync AAD without TextEncoder ([7df32d8](https://github.com/justin13888/shiba/commit/7df32d821a0020c99ccc832d8e46ad50e29c6876))
- **server:** Record device last_seen_at on socket open ([8888fc1](https://github.com/justin13888/shiba/commit/8888fc1ef83a465e031ec5c084db45e1662cddb9))

### Refactoring

- **extension:** Sectioned Settings form (Sync + Backup) ([8ba65d7](https://github.com/justin13888/shiba/commit/8ba65d7e54179e62c728689698447ea9bf86c69c))
- **extension:** Componentize + harden the saved view (a11y) ([79c153e](https://github.com/justin13888/shiba/commit/79c153e856276b131a486b2b95a890357f9aab64))
- **extension:** Move sync engine into the background worker ([bbb176e](https://github.com/justin13888/shiba/commit/bbb176e3dce2b2adc901d9cd3b045bb0dc01fb5e))
- **extension:** Page thin-client store over a mirror document ([95c2442](https://github.com/justin13888/shiba/commit/95c244299ff309545703d39cc2e622c7f8ea7bf6))
- **extension:** Worker-owned single document + append-log persistence ([60f031b](https://github.com/justin13888/shiba/commit/60f031b8a644c4853597c933116098b5cde65dd3))

### Documentation

- Finalize 1:1 mapping + QA checklist ([6973580](https://github.com/justin13888/shiba/commit/69735800406b0dfbf2ae237e12fc64c966e0b011))
- Document the local backup safety-net ([e8b9f44](https://github.com/justin13888/shiba/commit/e8b9f445f6f397eca679ff966a66d4fb3986dd95))
- Describe the real worker-owned design (architecture, sync, encryption) ([4a34abe](https://github.com/justin13888/shiba/commit/4a34abeb99947150b8e179b7882ce267da7cdf55))
- **releasing:** Document toolchain, commit conventions, and release flow ([71ee4ec](https://github.com/justin13888/shiba/commit/71ee4ec9463d5a3aa7db6306d8f5a647a9e5d0cf))
- Correct test-count reference in README ([2b9a40b](https://github.com/justin13888/shiba/commit/2b9a40be5035175d293226acc5920200ef7a40b7))
- Rewrite README with architecture decisions and self-hosting guide ([1fe662a](https://github.com/justin13888/shiba/commit/1fe662afbb234cb4e8b3ad6f866bbb3af3bc46c2))

### Testing

- Server WS relay + component a11y harness + E2E scaffold ([6768078](https://github.com/justin13888/shiba/commit/67680783871f4afd1b4cc4427df952728a25f6b6))
- **extension:** Snapshot capture/evict + restore & file round-trip ([396be4f](https://github.com/justin13888/shiba/commit/396be4f6c3ce7be7dde77ba0193499686b9783c3))
- **extension:** Bridge round-trip + two-context reactivity ([4f2deeb](https://github.com/justin13888/shiba/commit/4f2deeb29355a57339fe960348b410f45abf0924))
- **deps:** Upgrade Vitest to v4 and test libraries ([075e11c](https://github.com/justin13888/shiba/commit/075e11ce50c605cb7c4454d4589b3864a65b9269))

### Build System

- Migrate package manager from pnpm to bun ([088c0c7](https://github.com/justin13888/shiba/commit/088c0c755665d926dbc4686fc63d2bfb60bce511))
- **release:** Provision git-cliff, configure changelog, seed CHANGELOG ([1374046](https://github.com/justin13888/shiba/commit/137404609313d1a360cfb629f7ba7dac467f8bdb))
- **mise:** Provision commit/release toolchain with auto-installed hooks ([81bee95](https://github.com/justin13888/shiba/commit/81bee95ba78542b458e7cc4825633a209036abd8))

### CI

- **release:** Automate release PRs and tag-driven publishing ([c23d067](https://github.com/justin13888/shiba/commit/c23d067956d58e0923465a845b0007b1f9c8a6d1))
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

### Styling

- **extension:** Move TAB_CAP below the import block ([cb9262b](https://github.com/justin13888/shiba/commit/cb9262b3354bbd78e703d76f9f32edc7dbe2cb81))
- **crypto:** Drop unused KeyEnvelope import ([8226ef5](https://github.com/justin13888/shiba/commit/8226ef56d5c797c01c6bd440a098b0a64d40e7c8))


