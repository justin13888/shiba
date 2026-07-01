// @vitest-environment jsdom

import { applyCommand, type Command, type Group, queries } from "@shiba/core";
import { createFakeDoc, testDeps } from "@shiba/core/testing";
import { cleanup, render, screen } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createShibaStore, type ShibaStore } from "@/src/reactive/store";
import type { BridgeClient } from "@/src/runtime/bridge/client";
import { ConfirmProvider } from "@/src/ui/components/confirm";

// The store is provided through context; mock the hook so the card reads our
// seeded fake instead of a live worker bridge. `vi.hoisted` gives the (hoisted)
// mock factory a handle it can close over.
const h = vi.hoisted(() => ({ store: null as ShibaStore | null }));
vi.mock("@/src/reactive/context", () => ({ useShiba: () => h.store }));

// The adapter pulls in `wxt/browser`, which isn't available under jsdom — and we
// want to observe the "open the tabs" side effect anyway.
vi.mock("@/src/adapters/tabs", () => ({
    webextTabs: { open: vi.fn(async () => {}) },
}));

import { webextTabs } from "@/src/adapters/tabs";
import { GroupCard } from "./GroupCard";

const open = vi.mocked(webextTabs.open);

/** Applies commands straight to the mirror, as the worker's broadcast would. */
function fakeClient(): BridgeClient {
    const doc = createFakeDoc();
    const deps = testDeps();
    return {
        doc,
        dispatch: async (cmd: Command) => {
            let result = { ids: [] as string[] };
            doc.mutate((tx) => {
                result = applyCommand(tx, deps, cmd);
            });
            return result;
        },
        dispose: () => {},
    };
}

/** Seed a workspace with one group of two tabs; return the store + live group. */
async function seed(): Promise<{ store: ShibaStore; group: Group }> {
    const store = createShibaStore(fakeClient());
    await store.dispatch({ type: "createWorkspace", input: { name: "W" } });
    const ws = queries.liveWorkspaces(store.snap)[0];
    if (!ws) throw new Error("workspace not created");
    await store.dispatch({
        type: "saveBrowserTabs",
        tabs: [
            { id: 1, title: "A", url: "https://a.test/", windowId: 1 },
            { id: 2, title: "B", url: "https://b.test/", windowId: 1 },
        ],
        options: { workspaceId: ws.id },
    });
    const group = queries.liveGroups(store.snap, ws.id, null)[0];
    if (!group) throw new Error("group not created");
    return { store, group };
}

const liveGroupCount = (store: ShibaStore): number =>
    queries
        .liveWorkspaces(store.snap)
        .reduce(
            (n, ws) => n + queries.liveGroups(store.snap, ws.id, null).length,
            0,
        );

const renderCard = (group: Group): void => {
    render(() => (
        <ConfirmProvider>
            <GroupCard group={group} query="" />
        </ConfirmProvider>
    ));
};

const clickRestore = (): void =>
    screen.getByRole("button", { name: /restore/i }).click();

describe("GroupCard restore round-trip", () => {
    beforeEach(() => open.mockReset().mockResolvedValue(undefined));
    afterEach(cleanup);

    it("reopens every tab and then clears the stash", async () => {
        const { store, group } = await seed();
        h.store = store;
        renderCard(group);

        clickRestore();

        await vi.waitFor(() => expect(liveGroupCount(store)).toBe(0));
        expect(open).toHaveBeenCalledWith([
            "https://a.test/",
            "https://b.test/",
        ]);
    });

    it("reopens but keeps a locked group in place", async () => {
        const { store, group } = await seed();
        await store.dispatch({
            type: "setLocked",
            groupId: group.id,
            locked: true,
        });
        h.store = store;
        const locked = queries
            .liveWorkspaces(store.snap)
            .flatMap((ws) => queries.liveGroups(store.snap, ws.id, null))[0];
        if (!locked) throw new Error("locked group missing");
        renderCard(locked);

        clickRestore();

        await vi.waitFor(() => expect(open).toHaveBeenCalledOnce());
        expect(liveGroupCount(store)).toBe(1);
    });
});
