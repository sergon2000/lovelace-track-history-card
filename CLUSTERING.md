# Clustering & rendering logic

This document explains how the card turns a day of raw `device_tracker`
positions into the path, stop markers and timeline shown on the map. It is a
reference for the logic in `track-history-card.js`; method names below refer to
that file.

## Pipeline overview

```
_fetchPoints ──▶ _clusterPoints ──▶ _numberStops ──▶ _drawTrack ──▶ map
                                          └────────────────────────▶ _setTimeline
```

1. **`_fetchPoints(entityId, date)`** — loads every recorded position for the
   selected local day via the `history/stream` WebSocket subscription (the same
   API the HA History panel uses). Returns an ordered list of points
   `{ lat, lng, accuracy, time, state }`, sorted by time.
2. **`_clusterPoints(points, cluster_radius, min_points)`** — collapses the raw
   points into an ordered list of **stops** (clusters) and **in-transit** points.
3. **`_numberStops(displayed)`** — tags each cluster with a role
   (`start` / `end` / `mid`) and a 1-based number for the mid stops.
4. **`_drawTrack`** — draws the polyline (smoothed), the stop markers and the
   start/end markers.
5. **`_setTimeline` / `_buildTimeline`** — derive the optional timeline panel
   from the same `displayed` array.

The result of `_clusterPoints` is referred to as `displayed` throughout.

## Configuration

| Option           | Default | Meaning                                                                 |
|------------------|---------|-------------------------------------------------------------------------|
| `cluster_radius` | `200` m | Points within this distance of a cluster's running centroid join it.    |
| `min_points`     | `3`     | A group needs at least this many points to count as a cluster (a stop). |

## Clustering algorithm (`_clusterPoints`)

Clustering is **sequential**: it walks the points in chronological order and
grows one group at a time around a *running centroid* (the mean lat/lng of the
points currently in the group).

For each point after the first:

1. **Inside the radius** — if the point is within `cluster_radius` of the running
   centroid, it joins the current group and the centroid is recomputed.
2. **Single stray point** — if the point is *outside* the radius **but the next
   point is back inside**, the stray point is **ignored** (dropped entirely) and
   the group continues. See [Single-outlier handling](#single-outlier-handling).
3. **Genuine break** — otherwise the current group is closed and a new group is
   started at this point.

Because grouping is sequential, leaving an area and returning to it **later**
forms a *separate* group. Two visits to the same place on the same day are two
stops, each with its own time range — they are not merged.

### Cluster vs. in-transit

After grouping, each group becomes one of:

- **Cluster (a stop)** — `group.length >= min_points`. Collapsed to a single
  entry at the group's centroid, carrying:
  - `count` — number of points in the group,
  - `time` — timestamp of the **first** point (arrival),
  - `timeTo` — timestamp of the **last** point (departure).
- **In-transit** — `group.length < min_points`. Kept as its individual points
  (each `count: 1`). These are **not** marked on the map; only the polyline
  passes through them, representing the device moving through.

### Single-outlier handling

A lone position that jumps outside the radius for exactly **one** point and then
returns is almost always a GPS glitch, not real movement. Left untreated it
would:

- make the polyline spike out to the stray point and back, and
- split one real stay into two clusters (because the stray "broke" the run).

So during the walk, when a point is outside the radius **and the immediately
following point is inside it again**, the stray point is skipped. The points
around it therefore stay in the **same** group (the two would-be clusters merge
into one) and the line no longer detours through the stray point.

Only a *single* stray point is skipped. **Two or more** consecutive
out-of-radius points are treated as genuine movement (a real trip leaving the
area), so legitimate journeys are never collapsed.

```
… A A A  X  A A A …      X is outside the radius, the next point is back inside
         └ skipped        ⇒ all the A's remain ONE cluster, X is dropped

… A A A  X Y Z  B B B …  two+ points leave the area
                          ⇒ A… and B… are separate clusters, X Y Z are in-transit
```

## Stop numbering (`_numberStops`)

The clusters in `displayed`, in order, are assigned a role:

- the **first** cluster → `start`,
- the **last** cluster → `end`,
- every cluster in between → `mid`, numbered `1, 2, 3, …` in order.

The mid number (`stopNo`) is shown both on the map marker and as “Stop N” in the
timeline, so the two always match. The start/end clusters are shown by colour
(see below), not by number.

## Markers (`_drawTrack`)

- **Mid stops** — a numbered circular marker (`_clusterMarker`).
- **Start / end** — coloured circular markers (green = start, red = end,
  `_pinMarker`).
- **Combined start/end** — if the first and last points fall within
  `cluster_radius` of each other (a day that starts and ends in the same place,
  e.g. home), a single marker split half-green / half-red is drawn instead of two
  overlapping markers (`_startEndMarker`). It sits at the midpoint of the two
  points, and both ends of the polyline are snapped to that midpoint so the line
  meets the marker exactly (otherwise it stops short, visible when zoomed in).
- **In-transit points** — not marked.

### Start/end times

For the start and end stops the relevant moment is the transition, not the whole
stay:

- **Start** shows its **departure** time (`timeTo`, the last point) — when the
  device left.
- **End** shows its **arrival** time (`time`, the first point) — when the device
  got there.
- **Mid** stops show the full **arrival – departure** range.

## Polyline smoothing (`_smoothPath` / `_chaikin`)

The line is rounded with Chaikin corner-cutting so it curves gently instead of
showing sharp GPS corners. Because plain corner-cutting trims peaks, an isolated
stop between two nearby stops could have its corner cut off, leaving the marker
uncrossed. To avoid that:

- **Stops are anchors.** The path is split at every cluster (plus the first and
  last point) and each segment is smoothed independently. Chaikin preserves a
  segment's endpoints, so the smoothed line always passes exactly through every
  stop, the start and the end.
- Near-duplicate points (closer than ~15 m) are dropped before smoothing so
  real corners remain visible to round.

## Timeline (`_buildTimeline` / `_setTimeline`)

When `show_timeline` is enabled, the panel lists the day in order, derived from
the same `displayed` array:

- **Stops** — “Start”, “Stop N”, … , “End”, each with its time (departure for
  start, arrival for end, full range for mid stops). If the stop falls inside a
  Home Assistant zone (a `zone.*` entity, smallest one wins when they overlap),
  its name is shown too — in parentheses after “Start”/“End”, or on its own line
  under “Stop N” for mid stops (`_zoneName`).
- **Moving** — between consecutive stops (and before/after the first/last stop
  when there are in-transit points), showing the distance travelled along that
  segment. Distances under 1 km are shown in metres, otherwise in kilometres.

## Location enrichment (`_zoneName` / reverse geocoding)

Each stop can be labelled with where it is, shown both in its timeline entry and
its map popup. The label is resolved in two tiers:

1. **HA zone** (`_zoneName`) — if the stop falls inside a `zone.*` entity, that
   zone's name is used. Smallest zone wins when several overlap. This is local
   and instant, so it always takes precedence.
2. **Reverse geocoding** (opt-in, `reverse_geocode: true`) — stops with *no*
   zone are looked up against an online service (`_reverseGeocode`, Nominatim by
   default or any compatible `geocode_url`).

### How the geocoding runs

- The map, markers and timeline render immediately; geocoding happens in the
  background and the labels are filled in as answers arrive — never blocking the
  draw.
- Lookups are **serialised** with a ~1.1 s gap (`GEO_MIN_GAP_MS`) to respect
  Nominatim's ~1 req/sec policy. Only stops are looked up, never in-transit
  points. Each load gets a generation token (`_loadGen`); answers from a previous
  day/device are discarded so a late response can't land on the new track.
- Place names are localised to the Home Assistant UI language (sent as
  `accept-language`), so they match the rest of the card rather than following
  the browser or the place's local language.
- Results are cached in `localStorage` for 90 days (`GEO_TTL_MS`), keyed by the
  stop's coordinates rounded to ~11 m **and the UI language**, so recurring
  places and revisited days reuse the cached address instead of calling the
  service again (switching HA's language fetches fresh, correctly-localised names).

### Label format (`_composeAddress`)

Every stop is shown at **street** level with the ISO country code after a middle
dot — `Street [number], City · CC` (e.g. `Main St, Madrid · ES`) — so stops are
always identifiable. When the response has no street (`road`/`neighbourhood`/
`suburb`) it falls back to `City · CC`, and finally to the country name alone.

The cache stores the raw address **components**, not a finished string, so the
label can be recomposed (e.g. with different fallbacks) without re-querying.
