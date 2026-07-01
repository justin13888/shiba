# End-to-end tests (Playwright)

The automated E2E layer that loads the real extension in a browser. It is not
wired into the default `test` script because it needs a browser binary and a
built extension — stand it up in CI (or locally) with the steps below. The
scenarios it should cover are the journeys in [`../../../docs/QA.md`](../../../docs/QA.md).

## Setup

```bash
pnpm --filter @shiba/extension add -D @playwright/test
pnpm --filter @shiba/extension exec playwright install chromium
pnpm --filter @shiba/extension build            # produces .output/chrome-mv3
```

## Loading the extension

Playwright loads an unpacked MV3 extension via a persistent context:

```ts
import { chromium, test as base } from "@playwright/test";
import { fileURLToPath } from "node:url";

const pathToExtension = fileURLToPath(new URL("../.output/chrome-mv3", import.meta.url));

export const test = base.extend<{ extensionId: string }>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    const [sw] = context.serviceWorkers();
    const worker = sw ?? (await context.waitForEvent("serviceworker"));
    await use(worker.url().split("/")[2]);
  },
});
```

Open the app at `chrome-extension://${extensionId}/index.html`.

## Scenarios to automate (from QA.md)

1. Save a window → a group with the right tabs appears.
2. Rename / restore / delete-with-confirm / trash-undo.
3. Search filters + no-results state.
4. Workspace tablist keyboard navigation.
5. Backup: snapshot now → list → restore-as-copy (new workspace) → export/import.
6. **Two-context reactivity**: edit in one page, assert the change appears in a
   second page without reload.
7. **Encrypted sync**: two persistent contexts against one server converge, and
   captured WebSocket frames contain no plaintext.
