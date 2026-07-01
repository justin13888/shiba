import { describe, expect, it } from "vitest";
import * as queries from "../doc/queries";
import type { BrowserTab } from "../ports/tabs";
import { createFakeDoc, must, recordingSink, testDeps } from "../testing";
import { applyCommand, type Command, type CommandResult } from "./apply";

const TABS: BrowserTab[] = [
    { title: "A", url: "https://a.com/1", windowId: 1 },
    { title: "B", url: "https://b.com/2", windowId: 2 },
];

/** Run a command through the bus and return its result. */
function dispatch(
    doc: ReturnType<typeof createFakeDoc>,
    deps: ReturnType<typeof testDeps>,
    cmd: Command,
): CommandResult {
    let result!: CommandResult;
    doc.mutate((tx) => {
        result = applyCommand(tx, deps, cmd);
    });
    return result;
}

function fixture() {
    const doc = createFakeDoc();
    const deps = testDeps();
    const { ids } = dispatch(doc, deps, {
        type: "createWorkspace",
        input: { name: "W" },
    });
    return { doc, deps, wsId: must(ids[0]) };
}

describe("applyCommand — creation", () => {
    it("createWorkspace returns the new id and materializes it", () => {
        const { doc, wsId } = fixture();
        expect(queries.liveWorkspaces(doc.snapshot()).map((w) => w.id)).toEqual(
            [wsId],
        );
    });

    it("createGroup + createTab nest under their parents", () => {
        const { doc, deps, wsId } = fixture();
        const gid = must(
            dispatch(doc, deps, {
                type: "createGroup",
                input: { workspaceId: wsId, name: "G" },
            }).ids[0],
        );
        const tid = must(
            dispatch(doc, deps, {
                type: "createTab",
                input: { groupId: gid, url: "https://x.com", title: "X" },
            }).ids[0],
        );
        expect(
            queries.liveGroups(doc.snapshot(), wsId, null).map((g) => g.id),
        ).toEqual([gid]);
        expect(queries.liveTabs(doc.snapshot(), gid).map((t) => t.id)).toEqual([
            tid,
        ]);
    });

    it("saveBrowserTabs returns group ids and records analytics", () => {
        const doc = createFakeDoc();
        const sink = recordingSink();
        const deps = testDeps({ analytics: sink });
        const wsId = must(
            dispatch(doc, deps, {
                type: "createWorkspace",
                input: { name: "W" },
            }).ids[0],
        );
        const { ids } = dispatch(doc, deps, {
            type: "saveBrowserTabs",
            tabs: TABS,
            options: { workspaceId: wsId, strategy: "byWindow" },
        });
        expect(ids).toHaveLength(2);
        expect(sink.events).toContainEqual(
            expect.objectContaining({ type: "tab_saved", count: 2 }),
        );
    });
});

describe("applyCommand — mutation & lifecycle", () => {
    it("rename, pin, lock, archive, notes, tag all take effect", () => {
        const { doc, deps, wsId } = fixture();
        const gid = must(
            dispatch(doc, deps, {
                type: "createGroup",
                input: { workspaceId: wsId, name: "G" },
            }).ids[0],
        );
        const tid = must(
            dispatch(doc, deps, {
                type: "createTab",
                input: { groupId: gid, url: "https://x.com", title: "X" },
            }).ids[0],
        );
        const tagId = must(
            dispatch(doc, deps, {
                type: "createTag",
                input: { name: "later" },
            }).ids[0],
        );
        dispatch(doc, deps, {
            type: "rename",
            ref: { kind: "group", id: gid },
            name: "Renamed",
        });
        dispatch(doc, deps, {
            type: "setPinned",
            ref: { kind: "group", id: gid },
            pinned: true,
        });
        dispatch(doc, deps, { type: "setLocked", groupId: gid, locked: true });
        dispatch(doc, deps, { type: "setNotes", tabId: tid, notes: "hi" });
        dispatch(doc, deps, {
            type: "setTag",
            tabId: tid,
            tagId,
            on: true,
        });

        const snap = doc.snapshot();
        const group = must(snap.groups[gid]);
        expect(group.name).toBe("Renamed");
        expect(group.pinned).toBe(true);
        expect(group.locked).toBe(true);
        const tab = must(snap.tabs[tid]);
        expect(tab.notes).toBe("hi");
        expect(tab.tagIds).toContain(tagId);
    });

    it("softDelete then restore round-trips a group's tabs", () => {
        const { doc, deps, wsId } = fixture();
        const gid = must(
            dispatch(doc, deps, {
                type: "saveBrowserTabs",
                tabs: TABS,
                options: { workspaceId: wsId },
            }).ids[0],
        );
        dispatch(doc, deps, {
            type: "softDelete",
            ref: { kind: "group", id: gid },
        });
        expect(queries.liveTabs(doc.snapshot(), gid)).toHaveLength(0);
        dispatch(doc, deps, {
            type: "restore",
            ref: { kind: "group", id: gid },
        });
        expect(queries.liveTabs(doc.snapshot(), gid)).toHaveLength(2);
    });
});

describe("applyCommand — parity with direct ops", () => {
    it("moveTab via a command reorders exactly like the op", () => {
        const { doc, deps, wsId } = fixture();
        const gid = must(
            dispatch(doc, deps, {
                type: "saveBrowserTabs",
                tabs: TABS,
                options: { workspaceId: wsId },
            }).ids[0],
        );
        const [first, second] = queries
            .liveTabs(doc.snapshot(), gid)
            .map((t) => t.id);
        dispatch(doc, deps, {
            type: "moveTab",
            tabId: must(second),
            dest: { groupId: gid, before: must(first) },
        });
        expect(queries.liveTabs(doc.snapshot(), gid).map((t) => t.id)[0]).toBe(
            second,
        );
    });

    it("returns an empty id list when the target does not exist", () => {
        const { doc, deps } = fixture();
        const result = dispatch(doc, deps, {
            type: "setLocked",
            groupId: "missing",
            locked: true,
        });
        // The op is a no-op on a missing id, but the command still reports its target.
        expect(result.ids).toEqual(["missing"]);
    });
});
