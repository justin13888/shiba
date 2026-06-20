# Analytics

> Status: outline — expanded in Phase 6.

Local-first usage analytics. **No third-party telemetry**, ever; data stays on the
device (cross-device analytics sync is a future roadmap item).

## Events
An append-only IndexedDB store, written via the injected `ports/analytics-sink.ts`
(a no-op in tests): `tab_saved | tab_restored | tab_opened`, `group_created |
group_deleted`, `imported`, `search`, …

## Aggregation (pure)
`core/analytics` derives: tabs saved/restored over time, total tabs managed,
"tabs closed ≈ memory saved", most-restored groups/domains, an hour-of-day
heatmap, and tag/workspace breakdowns.

## Dashboard
The `/analytics` route renders these with lightweight inline SVG charts.
