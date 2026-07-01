# Data model & organization

## Entities

All entities extend `Soft = { createdAt; updatedAt; deletedAt: number | null }`;
`id` is a nanoid; `order` is a fractional-index string sorted by `(order, id)`.
Schemas are valibot definitions in `packages/core/src/model`.

- **Workspace** — top-level context. `{ name, iconName?, color?, order, isDefault }`
- **Folder** — nestable container in a workspace. `{ workspaceId, parentId, name, color?, order, collapsed? }`
- **Group** — a saved list of tabs. `{ workspaceId, parentId, name?, color?, order, pinned, locked, archivedAt, savedAt }`
- **Tab** — leaf. `{ groupId, order, url, title, favicon?, notes?, tagIds[], pinned, addedAt, lastOpenedAt?, openCount, excerpt? }`
- **Tag** — cross-cutting label. `{ name, color? }`

## Tree & ordering

Workspace → Folder\* (nestable) → Group → Tab. `parentId: null` means directly
under the workspace. Ordering uses fractional indexing, so "reorder" and "move to
another container" are the same single, conflict-free field write (`ops.move*`).

## Lifecycle

active → `archivedAt` (hidden, kept) → `deletedAt` (Trash; GC-purged after the
tombstone TTL by the reconcile sweep). `softDelete` cascades to the subtree and
`restore` reverses it — surfaced in the UI's Trash. **A `locked` group resists
direct deletion** (`ops.softDelete` no-ops on it); deleting its container still
cascades.

## CRDT mapping

One `Y.Doc` per user. Top-level `Y.Map`s `workspaces | folders | groups | tabs |
tags | meta`; each record is a nested `Y.Map` (field-level LWW). `tagIds` is stored
as a `Y.Map` **set** (diff-merged) in the Yjs adapter, though `core` models it as a
plain `string[]` in the read-model. `meta` holds `{ schemaVersion, deviceId }` and
gates migrations.

The plain read-model over all this is `DocSnapshot` (`core/model`), which every
pure selector (`doc/queries`) and the reactive UI render from.

## Migration v1→v2

`migration/v1.ts` maps the legacy `tabs` IndexedDB (class-based records, integer
order, JSX icons, categories) into the v2 model with fractional keys and a
guaranteed default workspace. Pure; the IDB reader that drives it is not yet wired
(Roadmap).
