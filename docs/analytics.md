# Analytics

Local-first usage analytics. **No third-party telemetry**, ever; data stays on the
device.

## Aggregation (pure, ready)

`core/analytics` `summarize(events)` derives an `AnalyticsSummary`:
tabs saved/restored/opened/imported totals, `savedByDay`, a 24-slot hour-of-day
heatmap, and a top-labels breakdown. It is pure and unit-tested.

## Events (pure contract)

The mutating ops emit events through the optional injected `ports/analytics-sink`
(`deps.analytics?.record(...)` — e.g. `group_created`, `group_deleted`,
`tab_saved`, `tabs_imported`).

## Roadmap (not yet built)

- **Sink wiring.** No `AnalyticsSink` adapter (an append-only IndexedDB store) is
  wired into the runtime yet, so `deps.analytics` is currently undefined at runtime
  and no events are persisted. The `search_performed` event type is defined but not
  emitted.
- **Dashboard.** The `/analytics` route with inline SVG charts is not built. When it
  is, it renders from `summarize`.
