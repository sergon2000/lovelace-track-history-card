# Track History Card

A custom Lovelace card for [Home Assistant](https://www.home-assistant.io/) that displays the GPS movement history of any `device_tracker` entity on an interactive map for a selected day.

![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2023.0%2B-blue)
![HACS](https://img.shields.io/badge/HACS-Custom%20Repository-orange)

<p align="center">
  <img src="https://raw.githubusercontent.com/sergon2000/lovelace-track-history-card/main/card.png" width="50%">
  <br>
  <em>Datapoints have been intentionally removed from this screenshot</em>
</p>

---

## Features

- Select any `device_tracker` entity from a configurable list
- Date picker to browse any past day
- Renders a full movement path as a directional polyline on an [OpenStreetMap](https://www.openstreetmap.org/) map (via Leaflet)
- **Start** (green) and **End** (red) pin markers with popup details
- Nearby points are grouped into **stop clusters** (configurable radius) showing visit count and per-visit time ranges; in-transit points are not marked, so only the path line represents them
- Summary bar with total points, time range, and approximate distance
- Optional **Timeline** panel below the map listing each stop (with its time range, and the name of the Home Assistant zone it falls in, if any) and the distance travelled while moving between stops
- Optional **reverse geocoding** (opt-in) labels stops outside any zone with their address (street, city and ISO country code, e.g. `Main St, Madrid (ES)`)
- Adapts to the Home Assistant theme (light / dark)

---

## Requirements

- Home Assistant **2023.0** or newer
- The [Recorder](https://www.home-assistant.io/integrations/recorder/) integration enabled (default in HA)
- At least one `device_tracker` entity with GPS attributes (`latitude`, `longitude`)
- Internet access from the browser to load Leaflet from `unpkg.com` (see [Offline usage](#offline-usage))

---

## Installation

### Via HACS (recommended)

1. Open **HACS** → **Frontend**
2. Click the three-dot menu → **Custom repositories**
3. Add `https://github.com/sergon2000/lovelace-track-history-card` as type **Lovelace**
4. Search for **Track History Card** and install it
5. Reload your browser

### Manual

1. Download `track-history-card.js` from the [latest release](https://github.com/sergon2000/lovelace-track-history-card/releases)
2. Create the folder `/config/www/community/lovelace-track-history-card/` if it does not exist, then copy the file there
3. In Home Assistant go to **Settings → Dashboards → Resources**
4. Add `/local/community/lovelace-track-history-card/track-history-card.js` as type **JavaScript module**
5. Reload your browser

---

## Configuration

The card supports a **visual editor** — click the pencil icon after adding the card to configure it without writing YAML. Fields available:

- **Title** — card header text
- **Tracked devices** — add / remove `device_tracker` entities with an autocomplete picker
- **Default device** — entity pre-selected on load (dropdown populated from the list above)
- **Direction arrows** — show / hide the arrows along the path, and set how many are drawn
- **Theme** — map theme: System (follows Home Assistant), Light, or Dark
- **Timeline** — show a panel below the map listing stops and movements
- **Map height** — map height in pixels
- **Units** — unit system for distances: Metric (m / km) or Imperial (ft / mi)
- **Cluster radius** — distance (in the chosen units) within which nearby points are grouped into a single stop cluster
- **Minimum points per cluster** — how many consecutive points within the radius are needed to form a cluster
- **Reverse geocoding** — look up an address for stops that fall outside every Home Assistant zone (off by default; see the note below)

Alternatively, configure it manually via YAML:

```yaml
type: custom:lovelace-track-history-card
title: "Daily Movements"
entities:
  - device_tracker.john_phone
  - device_tracker.jane_iphone
  - device_tracker.car_tracker
default_entity: device_tracker.jane_iphone
theme: system
show_timeline: true
show_arrows: true
arrow_count: 30
map_height: 450
units: metric
cluster_radius: 200
min_points: 3
reverse_geocode: false
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `entities` | `list` | **required** | One or more `device_tracker` entity IDs to show in the device dropdown |
| `title` | `string` | `Movement History` | Card title displayed in the header |
| `default_entity` | `string` | first entity | Entity pre-selected in the dropdown on load. Must be present in `entities`. If omitted or not found, the first entity is used. |
| `theme` | `string` | `system` | Map theme: `system` (follows the Home Assistant light/dark mode), `light`, or `dark`. |
| `show_timeline` | `boolean` | `false` | Show a timeline panel below the map listing each stop with its time range and the distance travelled between stops. |
| `show_arrows` | `boolean` | `true` | Draw direction arrows along the path. Set to `false` to hide them. |
| `arrow_count` | `number` | `30` | Number of direction arrows, spread evenly by distance along the path (`10`–`30`). Ignored when `show_arrows` is `false`. |
| `map_height` | `number` | `450` | Map height in pixels (`200`–`1000`) |
| `units` | `string` | `metric` | Unit system for distances: `metric` (m / km) or `imperial` (ft / mi). Also sets the unit of `cluster_radius`. |
| `cluster_radius` | `number` | `200` | Radius for grouping nearby points into stop clusters, in the configured `units` (meters when `metric`, feet when `imperial`); range `50`–`500`. Points outside any cluster are treated as in-transit and are not marked individually. |
| `min_points` | `number` | `3` | Minimum number of consecutive points within the radius required to form a cluster (`2`–`5`). Runs shorter than this are treated as in-transit. |
| `reverse_geocode` | `boolean` | `false` | Look up an address (street, city and ISO country code, e.g. `Main St, Madrid (ES)`) for stops that fall outside every Home Assistant zone. **Off by default** — see [Reverse geocoding](#reverse-geocoding). |
| `geocode_url` | `string` | Nominatim | Reverse-geocoding endpoint. Defaults to the public [Nominatim](https://nominatim.org/) service; may point at any Nominatim-compatible reverse endpoint (e.g. [LocationIQ](https://locationiq.com/) or a self-hosted instance). Only used when `reverse_geocode` is `true`. |

> See [CLUSTERING.md](CLUSTERING.md) for a detailed explanation of how points are grouped into stops, how the line is smoothed, and how stray points are handled.

### Reverse geocoding

When `reverse_geocode` is enabled, stops that don't fall inside any Home Assistant
zone are labelled with an address looked up from an online service. Home Assistant
zones always take precedence — geocoding only fills the gaps.

The labels appear progressively as each lookup resolves; the map and timeline
render immediately and don't wait for them. Results are cached in your browser
(`localStorage`) for 90 days, so recurring places and revisited days don't trigger
new lookups.

A few things to be aware of before enabling it:

- **Privacy** — your stop coordinates are sent to the configured geocoding service
  (the public Nominatim server by default). This is why it is **opt-in**.
- **Rate limits** — the default [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/)
  caps requests at roughly one per second, so the card looks stops up one at a
  time. Only stops are geocoded (never the in-transit points), keeping the volume
  low. For heavier use, point `geocode_url` at a service without that limit.
- **Per browser/device** — the cache lives in each browser, so the first visit
  from a new device looks the stops up again.

---

## Usage

1. Select a **device** from the dropdown (hidden when only one entity is configured)
2. Pick a **date** with the date picker, or step day-by-day with the ‹ › arrows
3. The map refreshes automatically — no Load button needed — querying the HA History API and drawing the path
4. Click any **stop cluster** marker to see its visit count and per-visit time ranges
5. The summary bar below the map shows the total number of recorded points, the time range, and the approximate distance travelled

---

## Offline usage

By default, Leaflet is loaded from `https://unpkg.com`. If your Home Assistant instance has no outbound internet access from the browser, you can self-host Leaflet:

1. Download `leaflet.js` and `leaflet.css` from [leafletjs.com](https://leafletjs.com/download.html)
2. Place both files in `/config/www/leaflet/`
3. Open an issue or fork the repo and point the constants at the top of the JS file to `/local/leaflet/leaflet.js` and `/local/leaflet/leaflet.css`

---

## License

MIT © [sergon2000](https://github.com/sergon2000)
