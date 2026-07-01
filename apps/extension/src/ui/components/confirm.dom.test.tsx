// @vitest-environment jsdom
import { render, screen } from "@solidjs/testing-library";
import type { Component } from "solid-js";
import { describe, expect, it } from "vitest";
import { ConfirmProvider, useConfirm } from "./confirm";

const Harness: Component = () => {
    const confirm = useConfirm();
    return (
        <button
            type="button"
            onClick={() =>
                void confirm({ title: "Delete this?", destructive: true })
            }
        >
            trigger
        </button>
    );
};

describe("ConfirmProvider (a11y)", () => {
    it("opens an accessible alertdialog with the prompt", async () => {
        render(() => (
            <ConfirmProvider>
                <Harness />
            </ConfirmProvider>
        ));
        screen.getByText("trigger").click();
        // The dialog portals to document.body, so query via `screen`.
        const dialog = await screen.findByRole("alertdialog");
        expect(dialog).toHaveTextContent("Delete this?");
        expect(dialog).toHaveTextContent("Confirm");
        expect(dialog).toHaveTextContent("Cancel");
    });
});
