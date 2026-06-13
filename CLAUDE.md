# CLAUDE.md

Project memory for the **Track History Card** — a custom Lovelace card for Home
Assistant that shows a `device_tracker`'s movement history on a Leaflet map for a
selected day. This file captures context and hard-won gotchas so they don't have
to be rediscovered. Keep it updated as the project evolves.

## Repository

- GitHub: `sergon2000/lovelace-track-history-card`
- Distributed via **HACS** as a Lovelace/dashboard plugin (`hacs.json`:
  `name: "Track History Card"`, `render_readme: true`).
- `main` is **branch-protected**: all changes must go through a PR (direct pushes
  are rejected).

### Files

| File                   | Purpose                                                        |
|------------------------|---------------------------------------------------------------|
| `track-history-card.js`| The entire card — single file, no build step.                 |
| `README.md`            | User-facing docs (features, install, config options, usage).  |
| `CLUSTERING.md`        | Detailed clustering & rendering logic. Update when that logic changes. |
| `CLAUDE.md`            | This file.                                                     |
| `hacs.json`            | HACS metadata.                                                 |
| `card.png`             | README screenshot (repo root; sourced from the user's Google Drive). |

## Architecture (`track-history-card.js`)

Two custom elements:

- **`lovelace-track-history-card`** (`class LovelaceTrackHistoryCard`) — the card.
- **`lovelace-track-history-card-editor`** (`class LovelaceTrackHistoryCardEditor`)
  — the visual editor (`getConfigElement()` returns it).

Both use Shadow DOM. Leaflet (1.9.4) is loaded once from unpkg
(`ensureLeaflet()`, shared promise) and its CSS is injected into the card's
shadowRoot (`_injectLeafletCss`).

### Card render flow

`set hass` (first time) or a date/device change → `_onLoad()`:
`_fetchPoints` → `_clusterPoints` → `_drawTrack` (returns `displayed`) →
`_setSummary` + `_setTimeline`.

`setConfig` rebuilds the DOM (`_build`) and, if already loaded, re-runs
`_onLoad()` so editor changes preview live.

### Config options

| Option           | Default     | Notes                                             |
|------------------|-------------|---------------------------------------------------|
| `entities`       | (required)  | List of `device_tracker` ids.                     |
| `title`          | (optional)  | Absent = no header.                               |
| `default_entity` | first       | Pre-selected device.                              |
| `theme`          | `system`    | `system` / `light` / `dark` (map tiles).          |
| `show_timeline`  | `false`     | Timeline panel below the map.                     |
| `show_arrows`    | `true`      | Direction arrows along the path.                  |
| `arrow_count`    | `30`        | Number of arrows (spread by distance, range 10–30). See `_addArrows`. |
| `map_height`     | `450`       | Pixels (range 200–1000).                          |
| `units`          | `metric`    | `metric` (m/km) or `imperial` (ft/mi). Sets `cluster_radius` unit too. |
| `cluster_radius` | `200`       | In `units` (m / ft), range 50–500. Converted to metres internally. See CLUSTERING.md. |
| `min_points`     | `3`         | Min consecutive points for a stop (range 2–5). See CLUSTERING.md. |

## Gotchas & decisions (read before changing related code)

### History data
- **Fetch via the `history/stream` WebSocket subscription** (`_streamHistory`),
  NOT REST `history/period` nor the one-shot `history/history_during_period` —
  those return `[]` for fully past days in recent HA, so only "today" worked.
  `history/stream` sends an initial event with the day's states, then live
  updates; we take the first event and unsubscribe.
- WS states use **compact keys**: `s` (state), `a` (attributes), `lu`
  (last_updated, epoch seconds), `lc` (last_changed). Attributes are carried
  forward when unchanged. Verbose keys are kept as a fallback for old HA.

### Leaflet + Shadow DOM
- **Disable animations** (`fadeAnimation`, `zoomAnimation`,
  `markerZoomAnimation: false`) and use `fitBounds({ animate: false })` — Leaflet
  animation internals read `_leaflet_pos` via `document` queries that don't pierce
  Shadow DOM and throw. Wrap `map.remove()` in try/catch (`_destroyMap`).
- `wheelPxPerZoomLevel: 250` to tame trackpad zoom sensitivity.
- `#map-wrap` gets `isolation: isolate; z-index: 0` so Leaflet's high z-index
  panes/controls don't render above the HA header when scrolling. Do NOT flatten
  the individual pane z-indexes — that breaks Leaflet's internal layer order.

### Visual editor
- **`ha-textfield` does not initialize reliably** when injected via `innerHTML`
  into the editor's Shadow DOM — use native `<input>` elements instead.
- **HA strips empty-string config values** before passing config back to the
  editor. So UI-only toggles (e.g. the title checkbox) are tracked with local
  flags (`_showTitle`); `_set(key, null)` deletes the key entirely.
- The Advanced `<details>` resets to closed on every re-render → its open state
  is persisted in `_advancedOpen` (updated from the `toggle` event).
- Selected date/device are preserved across rebuilds via `_selectedDate` /
  `_selectedEntity` (otherwise `_build` resets the date picker to today).

### Display details
- **Times**: format through `_fmtTime`, which honours the user's HA profile
  (`hass.locale.time_format` = `12`/`24`/`language`/`system`) and
  `hass.locale.language`. Don't call `toLocaleTimeString` directly.
- **Device labels**: prefer `hass.states[id].attributes.friendly_name`, fall back
  to a title-cased entity id.
- **Arrows**: drawn along the *smoothed* path (same geometry as the polyline) and
  given `zIndexOffset: -1000` so they stay below stop/start/end markers.
- **Markers** are circles: green = start, red = end, orange numbered = mid stops.
  When start & end are within `cluster_radius` of each other, a single
  half-green/half-red marker is shown. Stop popups show a title (Start / Stop N /
  End) + time(s); start shows departure, end shows arrival, mid shows the range.

### i18n
- `TRANSLATIONS` covers `en, es, fr, de, it, pt`; `getLang` takes the base code
  (`pt-BR` → `pt`). **Add every new key to all 6 languages.**

## Workflow conventions

- **Branching**: never commit to `main`. Create a `feat/...` or `fix/...` branch,
  push, open a PR. (`gh pr create` has occasionally returned HTTP 401 here; the
  reliable fallback is `gh api repos/<repo>/pulls -f title=... -f body=... -f
  head=<branch> -f base=main`.)
- **Merging**: `gh pr merge <n> --merge`. The repo auto-deletes merged
  branches, so do NOT pass `--delete-branch` (it 404s on the already-gone branch).
- **Commit messages** end with a trailer:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **No Node here** — sanity-check JS before committing with a brace/paren balance
  check (Python one-liner), since there's no linter/build.
- **Releases**: `gh release create vX.Y.Z track-history-card.js --title "vX.Y.Z"
  --notes "..."`. HACS then shows the update. The user decides the version bump
  (features → minor, fixes → patch). Check the latest published version with
  `gh release list -L 1`.

## Testing tips

- The user runs the card in a real HA instance. The fastest test loop is to copy
  `track-history-card.js` to
  `/config/www/community/lovelace-track-history-card/track-history-card.js` and
  hard-refresh.
- **Browser caching is a recurring trap** — when changes don't show, bump the
  `?v=` query on the dashboard resource and hard-refresh (Ctrl/Cmd+Shift+R).
- WebSocket calls don't appear as request rows in the Network tab — they're
  messages under the `websocket` connection.
