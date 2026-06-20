# Data model & organization

> Status: outline — expanded in Phase 1.

## Entities
All entities extend `Soft = { createdAt; updatedAt; deletedAt: number | null }`;
`id` is a nanoid; `order` is a fractional-index string sorted by `(order, id)`.

- **Workspace** — top-level context. `{ name, iconName?, color?, order, isDefault }`
- **Folder** — nestable container in a workspace. `{ workspaceId, parentId, name, color?, order, collapsed? }`
- **Group** — a saved list of tabs. `{ workspaceId, parentId, name?, color?, order, pinned, locked, archivedAt }`
- **Tab** — leaf. `{ groupId, order, url, title, favicon?, notes?, tagIds[], pinned, addedAt, lastOpenedAt?, openCount, excerpt? }`
- **Tag** — cross-cutting label. `{ name, color? }`

## Tree & ordering
Workspace → Folder* (nestable) → Group → Tab. `parentId: null` means directly
under the workspace. Ordering uses fractional indexing so "reorder" and "move to
another container" are the same single, conflict-free field write.

## Lifecycle
active → `archivedAt` (hidden, kept) → `deletedAt` (Trash; GC-purged after
retention). `locked` groups resist deletion.

## CRDT mapping
Y.Doc per user; top-level Y.Maps `workspaces|folders|groups|tabs|tags|meta`; each
record is a nested Y.Map (field-level LWW); `tagIds` is a Y.Map set;
`meta.schemaVersion` gates migrations.

## Migration v1→v2
One-time import of the old `tabs` IndexedDB (class-based records, integer order)
into the new model.
