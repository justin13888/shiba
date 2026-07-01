// @vitest-environment jsdom
import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { Switch } from "./Switch";

describe("Switch (a11y)", () => {
    it("exposes a labelled switch role and toggles via the accessible name", () => {
        const [checked, setChecked] = createSignal(false);
        const { getByRole } = render(() => (
            <Switch
                checked={checked()}
                onChange={setChecked}
                label="Automatic backups"
            />
        ));
        const control = getByRole("switch", { name: "Automatic backups" });
        expect(control).toBeInTheDocument();
        expect(checked()).toBe(false);
        control.click();
        expect(checked()).toBe(true);
    });
});
