# Manual QA checklist

Human acceptance pass. Each row is a criterion → steps → expected result. Automated
coverage lives in [testing.md](./testing.md); this covers what needs eyes and a real
browser. Load the unpacked build (`bun run --filter '@shiba/extension' dev`) in Chrome
and Firefox.

## Setup & smoke

- [ ] **Loads** — open the toolbar popup and "Open Shiba": the index page renders a
  default "Personal" workspace, no console errors.
- [ ] **Save window** — "Save window" creates a group with the current window's tabs;
  counts and relative time are correct.
- [ ] **Context menu / commands** — right-click → "Save tab to Shiba" and the keyboard
  commands (`save-selected-tabs`, `save-all-tabs`, `open-saved`) all save/open.

## Saved view

- [ ] **Open tab** — clicking a tab title focuses it if open, else opens it; middle /
  ctrl-click opens in a new tab; "copy link address" works (it's a real link).
- [ ] **Rename group** — the Rename (pencil) button opens an inline input; Enter/blur
  commits, Escape cancels and returns focus to the button.
- [ ] **Restore group** — "Restore" opens all the group's tabs and then clears the
  group (moves it to Trash) — the inverse of "Save window". A **locked** group reopens
  but is left in place; a failed open keeps the stash.
- [ ] **Delete confirms** — deleting a tab or group shows a confirm dialog; cancel
  aborts, confirm moves it to Trash.
- [ ] **Locked group** — a locked group shows a lock and its delete is refused.
- [ ] **Trash + undo** — the Trash dialog lists deleted items; Restore brings them back
  live; empty state reads "Trash is empty."
- [ ] **Large group** — a group with >100 tabs renders a "Show N more" control that
  reveals the rest.

## Search

- [ ] **Filter** — typing filters tabs by title/URL live; groups with no match hide.
- [ ] **No results** — a query matching nothing shows the "No tabs match …" state, not
  a blank page.

## Workspaces (accessible tablist)

- [ ] **Switch** — clicking a workspace tab shows its groups; the active tab is styled
  and `aria-selected`.
- [ ] **Keyboard** — arrow keys move between workspace tabs (roving tabindex); the
  selection persists across reload (sessionStorage).
- [ ] **New workspace** — the "+" button (accessible name "New workspace") adds one.

## Backup & restore (Settings)

- [ ] **Toggle** — the "Automatically snapshot hourly…" switch reflects/saves state and
  is keyboard-operable.
- [ ] **Snapshot now** — captures a snapshot (or reports "No changes…"); it appears in
  the list with counts.
- [ ] **Restore** — Restore adds a **new** "… (restored …)" workspace; the original is
  untouched.
- [ ] **Delete snapshot** — removes it from the list.
- [ ] **Export** — downloads `shiba-backup-<date>.json`.
- [ ] **Import** — importing that file adds a "… (imported …)" workspace; a junk file
  reports "That file isn't a valid Shiba backup."
- [ ] **Hourly capture** — with the toggle on, leaving the browser idle >1h captures at
  most one snapshot per changed hour (verify via the list; can be sped up by
  shortening the alarm period in a debug build).

## Cross-context reactivity

- [ ] **Live update** — open the index page in two windows (or the popup + index): a
  save/rename/delete in one reflects in the other **without reload**.
- [ ] **No clobber** — rapid edits from two contexts don't lose data.

## Sync (self-hosted server)

- [ ] **Pair** — in Settings, enter server URL + secret + passphrase → "Connected.
  Syncing is active." (no reload needed).
- [ ] **Converge** — a second instance/device paired with the same passphrase converges
  to the same document.
- [ ] **Blind relay** — capture the WebSocket frames: no plaintext tab titles/URLs
  appear (only ciphertext).
- [ ] **Offline** — edit offline, reconnect: edits replay and converge.

## Accessibility

- [ ] **Keyboard-only** — complete save → rename → delete → undo → switch workspace →
  open a tab using only the keyboard; focus is always visible.
- [ ] **Screen reader** — icon-only buttons announce their purpose; the search and
  rename inputs are labelled; status messages (sync, backup) are announced
  (`aria-live`); the confirm/trash dialogs announce and trap focus.
- [ ] **Reduced clutter** — row actions appear on focus, not hover only.

## Resilience

- [ ] **Error boundary** — if the worker/bridge fails, the app shows "Something went
  wrong" with "Try again", not a blank screen.
- [ ] **Empty states** — a fresh install shows the "No saved tabs yet…" prompt.
