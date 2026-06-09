/**
 * lovelace-track-history-card
 * Lovelace card for Home Assistant — shows device_tracker movement on a map for a selected day.
 * Install via HACS → Frontend → Custom repositories.
 *
 * Config example:
 *   type: custom:lovelace-track-history-card
 *   title: "Movimientos"
 *   entities:
 *     - device_tracker.john_phone
 *     - device_tracker.jane_iphone
 *   default_entity: device_tracker.john_phone
 *   map_height: 450
 */

const LEAFLET_VERSION = '1.9.4';
const LEAFLET_JS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
const LEAFLET_CSS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;

// Shared promise — only loads Leaflet once across all card instances
let _leafletPromise = null;

function ensureLeaflet() {
  if (_leafletPromise) return _leafletPromise;
  _leafletPromise = new Promise((resolve, reject) => {
    if (window.L) { resolve(window.L); return; }
    const script = document.createElement('script');
    script.src = LEAFLET_JS_URL;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('Failed to load Leaflet'));
    document.head.appendChild(script);
  });
  return _leafletPromise;
}

// ────────────────────────────────────────────────────────────────────────────

class LovelaceTrackHistoryCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._map = null;
    this._config = null;
    this._hass = null;
    this._leafletCssInjected = false;
    this._autoLoaded = false;
  }

  // ── HA lifecycle ──────────────────────────────────────────────────────────

  static getConfigElement() {
    return document.createElement('lovelace-track-history-card-editor');
  }

  static getStubConfig() {
    return { entities: [], title: 'Movement History', map_height: 400 };
  }

  setConfig(config) {
    if (!config.entities || !Array.isArray(config.entities) || config.entities.length === 0) {
      throw new Error('[lovelace-track-history-card] "entities" must be a non-empty list of device_tracker entity IDs.');
    }
    this._config = {
      title: 'Movement History',
      map_height: 400,
      default_entity: null,
      ...config,
    };
    this._build();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._autoLoaded && this._config) {
      this._autoLoaded = true;
      this._onLoad();
    }
  }

  disconnectedCallback() {
    this._destroyMap();
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  _build() {
    const today = new Date().toISOString().split('T')[0];
    const h = this._config.map_height;

    this.shadowRoot.innerHTML = `
      <style>${this._css(h)}</style>
      <ha-card>
        <div class="card-header">${this._config.title}</div>
        <div class="card-content">
          <div class="controls">
            <div class="ctrl-group">
              <label>Device</label>
              <select id="entity-select">
                ${this._config.entities.map(e => {
                  const label = e.replace('device_tracker.', '').replace(/_/g, ' ');
                  const selected = e === this._config.default_entity ? ' selected' : '';
                  return `<option value="${e}"${selected}>${label}</option>`;
                }).join('')}
              </select>
            </div>
            <div class="ctrl-group">
              <label>Date</label>
              <input type="date" id="date-picker" value="${today}" max="${today}" />
            </div>
            <button id="load-btn">
              <span id="btn-label">Load</span>
            </button>
          </div>
          <div id="alert" class="alert hidden"></div>
          <div id="map-wrap">
            <div id="map"></div>
            <div id="no-data" class="no-data hidden">No location data found for this day.</div>
          </div>
          <div id="summary" class="summary hidden"></div>
        </div>
      </ha-card>
    `;

    this.shadowRoot.getElementById('load-btn')
      .addEventListener('click', () => this._onLoad());
  }

  _css(mapHeight) {
    return `
      :host { display: block; }
      ha-card { overflow: hidden; }

      .card-header {
        padding: 16px 16px 0;
        font-size: 18px;
        font-weight: 500;
        color: var(--ha-card-header-color, var(--primary-text-color));
        letter-spacing: 0.01em;
      }
      .card-content { padding: 16px; }

      /* Controls row */
      .controls {
        display: flex;
        gap: 10px;
        align-items: flex-end;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }
      .ctrl-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
        min-width: 130px;
      }
      label {
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--secondary-text-color, #888);
      }
      select, input[type="date"] {
        padding: 8px 10px;
        border: 1px solid var(--divider-color, #e0e0e0);
        border-radius: 6px;
        background: var(--card-background-color, #fff);
        color: var(--primary-text-color, #333);
        font-size: 14px;
        width: 100%;
        box-sizing: border-box;
        height: 38px;
      }
      button {
        padding: 0 20px;
        height: 38px;
        background: var(--primary-color, #03a9f4);
        color: #fff;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
        transition: opacity .15s;
        min-width: 80px;
      }
      button:hover:not(:disabled) { opacity: 0.88; }
      button:disabled { opacity: 0.55; cursor: default; }

      /* Alert banner */
      .alert {
        padding: 9px 12px;
        border-radius: 6px;
        font-size: 13px;
        margin-bottom: 10px;
      }
      .alert.error { background: #ffebee; color: #b71c1c; }
      .alert.info  { background: #e3f2fd; color: #0d47a1; }
      .hidden { display: none !important; }

      /* Map */
      #map-wrap {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--divider-color, #e0e0e0);
      }
      #map { width: 100%; height: ${mapHeight}px; }
      .no-data {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--card-background-color, #fafafa);
        color: var(--secondary-text-color, #888);
        font-size: 14px;
      }

      /* Summary row */
      .summary {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        margin-top: 10px;
        font-size: 13px;
        color: var(--secondary-text-color, #666);
      }
      .summary-item { display: flex; align-items: center; gap: 5px; }

      /* Leaflet popup override */
      .leaflet-popup-content { font-size: 13px; line-height: 1.5; }
    `;
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  async _onLoad() {
    const entityId = this.shadowRoot.getElementById('entity-select').value;
    const date     = this.shadowRoot.getElementById('date-picker').value;
    if (!entityId || !date) return;

    const btn   = this.shadowRoot.getElementById('load-btn');
    const label = this.shadowRoot.getElementById('btn-label');
    btn.disabled = true;
    label.textContent = 'Loading…';
    this._setAlert('');
    this._setSummary(null);
    this._setNoData(false);

    try {
      await this._injectLeafletCss();
      const L = await ensureLeaflet();
      const points = await this._fetchPoints(entityId, date);

      if (points.length === 0) {
        this._destroyMap();
        this._setNoData(true);
      } else {
        this._setNoData(false);
        this._drawTrack(L, points);
        this._setSummary(points);
      }
    } catch (err) {
      console.error('[lovelace-track-history-card]', err);
      this._setAlert(`Error: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      label.textContent = 'Load';
    }
  }

  async _fetchPoints(entityId, date) {
    const start = `${date}T00:00:00`;
    const end   = `${date}T23:59:59`;

    // NOTE: HA evaluates `minimal_response` and `no_attributes` by *presence*,
    // not value — passing `=false` still activates them and strips attributes.
    // `significant_changes_only=0` is required to get every GPS update, not
    // just zone-transition state changes.
    const result = await this._hass.callApi(
      'GET',
      `history/period/${start}` +
        `?filter_entity_id=${encodeURIComponent(entityId)}` +
        `&end_time=${encodeURIComponent(end)}` +
        `&significant_changes_only=0`
    );

    return (result?.[0] ?? [])
      .filter(s => s.attributes?.latitude != null && s.attributes?.longitude != null)
      .map(s => ({
        lat:      parseFloat(s.attributes.latitude),
        lng:      parseFloat(s.attributes.longitude),
        accuracy: s.attributes.gps_accuracy ?? 0,
        time:     new Date(s.last_changed),
        state:    s.state,
      }));
  }

  // ── Map rendering ─────────────────────────────────────────────────────────

  _drawTrack(L, points) {
    this._destroyMap();

    const mapEl = this.shadowRoot.getElementById('map');
    // Animations disabled: Leaflet's animation internals read `_leaflet_pos`
    // from map pane elements, which are not accessible across Shadow DOM
    // boundaries, causing a TypeError during fitBounds/pan animations.
    this._map = L.map(mapEl, {
      zoomControl: true,
      fadeAnimation: false,
      zoomAnimation: false,
      markerZoomAnimation: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this._map);

    const latlngs = points.map(p => [p.lat, p.lng]);

    // Main track polyline
    L.polyline(latlngs, { color: '#1565C0', weight: 3, opacity: 0.85 }).addTo(this._map);

    // Intermediate waypoints
    if (points.length > 2) {
      points.slice(1, -1).forEach(p => {
        L.circleMarker([p.lat, p.lng], {
          radius: 4, color: '#1565C0', weight: 2,
          fillColor: '#fff', fillOpacity: 1,
        }).bindPopup(this._popupHtml(p)).addTo(this._map);
      });
    }

    // Start marker (green)
    this._pinMarker(L, points[0], '#2E7D32', 'S', 'Start').addTo(this._map);

    // End marker (red) — only if more than one point
    if (points.length > 1) {
      this._pinMarker(L, points[points.length - 1], '#C62828', 'E', 'End').addTo(this._map);
    }

    this._map.fitBounds(L.latLngBounds(latlngs), { padding: [32, 32], animate: false });
  }

  _pinMarker(L, point, color, letter, label) {
    const icon = L.divIcon({
      html: `
        <div style="
          background:${color};color:#fff;
          width:26px;height:26px;border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          display:flex;align-items:center;justify-content:center;
          font-size:11px;font-weight:700;
          border:2px solid rgba(255,255,255,.9);
          box-shadow:0 2px 6px rgba(0,0,0,.35);
        "><span style="transform:rotate(45deg)">${letter}</span></div>`,
      className: '',
      iconSize: [26, 26],
      iconAnchor: [13, 26],
      popupAnchor: [0, -28],
    });
    return L.marker([point.lat, point.lng], { icon })
      .bindPopup(this._popupHtml(point, label));
  }

  _popupHtml(point, label = '') {
    const time = point.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const acc  = point.accuracy ? `<div style="color:#999;font-size:11px">±${Math.round(point.accuracy)} m</div>` : '';
    const st   = point.state    ? `<div style="color:#999;font-size:11px">${point.state}</div>` : '';
    return `
      <div style="min-width:110px">
        ${label ? `<strong>${label}</strong><br>` : ''}
        <span>🕐 ${time}</span>
        ${acc}${st}
      </div>`;
  }

  _destroyMap() {
    if (this._map) {
      try { this._map.stop(); this._map.remove(); } catch (_) { /* ignore Shadow DOM cleanup errors */ }
      this._map = null;
    }
  }

  // ── UI helpers ────────────────────────────────────────────────────────────

  _setNoData(show) {
    const el = this.shadowRoot.getElementById('no-data');
    el.classList.toggle('hidden', !show);
  }

  _setAlert(msg, type = 'info') {
    const el = this.shadowRoot.getElementById('alert');
    if (!msg) { el.className = 'alert hidden'; return; }
    el.textContent = msg;
    el.className = `alert ${type}`;
  }

  _setSummary(points) {
    const el = this.shadowRoot.getElementById('summary');
    if (!points) { el.className = 'summary hidden'; return; }

    const first = points[0].time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const last  = points[points.length - 1].time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const km    = this._totalKm(points);

    el.innerHTML = `
      <span class="summary-item">📍 ${points.length} points</span>
      <span class="summary-item">🕐 ${first} – ${last}</span>
      <span class="summary-item">📏 ~${km} km</span>
    `;
    el.className = 'summary';
  }

  // ── Leaflet CSS injection ─────────────────────────────────────────────────

  async _injectLeafletCss() {
    if (this._leafletCssInjected) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = LEAFLET_CSS_URL;
    this.shadowRoot.insertBefore(link, this.shadowRoot.firstChild);
    await new Promise(r => { link.onload = r; link.onerror = r; });
    this._leafletCssInjected = true;
  }

  // ── Geometry ──────────────────────────────────────────────────────────────

  _totalKm(points) {
    let d = 0;
    for (let i = 1; i < points.length; i++) d += this._haversine(points[i - 1], points[i]);
    return d.toFixed(1);
  }

  _haversine(a, b) {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad;
    const dLng = (b.lng - a.lng) * rad;
    const x = Math.sin(dLat / 2) ** 2
            + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
}

// ── Visual config editor ──────────────────────────────────────────────────────

class LovelaceTrackHistoryCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    // Propagate hass to already-rendered entity pickers without full re-render
    this.shadowRoot.querySelectorAll('ha-entity-picker').forEach(p => { p.hass = hass; });
  }

  _render() {
    const { entities = [], title = '', default_entity = '', map_height = 400 } = this._config;

    this.shadowRoot.innerHTML = `
      <style>
        .editor { display: flex; flex-direction: column; gap: 20px; padding: 4px 0; }
        ha-textfield { width: 100%; }
        .section-label {
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--secondary-text-color, #888);
          margin-bottom: 6px;
        }
        .entity-row {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 8px;
        }
        .entity-row ha-entity-picker { flex: 1; }
        .add-btn {
          width: 100%;
          padding: 8px;
          background: none;
          border: 1px dashed var(--divider-color, #ccc);
          border-radius: 6px;
          color: var(--primary-color, #03a9f4);
          cursor: pointer;
          font-size: 13px;
        }
        .add-btn:hover { opacity: 0.8; }
        select {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 6px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #333);
          font-size: 14px;
          height: 40px;
          box-sizing: border-box;
        }
      </style>
      <div class="editor">
        <ha-textfield id="f-title" label="Title" value="${title}"></ha-textfield>

        <div>
          <div class="section-label">Tracked devices</div>
          <div id="entities-list"></div>
          <button class="add-btn" id="add-entity">+ Add device</button>
        </div>

        <div>
          <div class="section-label">Default device</div>
          <select id="f-default">
            <option value="">— first in list —</option>
            ${entities.map(e => `
              <option value="${e}" ${e === default_entity ? 'selected' : ''}>
                ${e.replace('device_tracker.', '').replace(/_/g, ' ')}
              </option>`).join('')}
          </select>
        </div>

        <ha-textfield id="f-height" label="Map height (px)" type="number"
          value="${map_height}" min="200" max="1000"></ha-textfield>
      </div>
    `;

    this._buildEntityPickers(entities);

    this.shadowRoot.getElementById('f-title')
      .addEventListener('change', e => this._set('title', e.target.value));

    this.shadowRoot.getElementById('add-entity')
      .addEventListener('click', () => this._set('entities', [...(this._config.entities || []), '']));

    this.shadowRoot.getElementById('f-default')
      .addEventListener('change', e => this._set('default_entity', e.target.value || null));

    this.shadowRoot.getElementById('f-height')
      .addEventListener('change', e => {
        const v = parseInt(e.target.value, 10);
        if (!isNaN(v) && v >= 200) this._set('map_height', v);
      });
  }

  _buildEntityPickers(entities) {
    const container = this.shadowRoot.getElementById('entities-list');
    entities.forEach((entity, idx) => {
      const row = document.createElement('div');
      row.className = 'entity-row';

      const picker = document.createElement('ha-entity-picker');
      picker.hass = this._hass;
      picker.value = entity;
      picker.setAttribute('label', `Device ${idx + 1}`);
      picker.setAttribute('include-domains', '["device_tracker"]');
      picker.setAttribute('allow-custom-entity', '');
      picker.addEventListener('value-changed', e => {
        const updated = [...(this._config.entities || [])];
        if (e.detail.value) {
          updated[idx] = e.detail.value;
        } else {
          updated.splice(idx, 1);
        }
        this._set('entities', updated);
      });

      const removeBtn = document.createElement('ha-icon-button');
      removeBtn.setAttribute('label', 'Remove');
      removeBtn.innerHTML = `<ha-icon icon="mdi:delete-outline"></ha-icon>`;
      removeBtn.addEventListener('click', () => {
        const updated = (this._config.entities || []).filter((_, i) => i !== idx);
        this._set('entities', updated);
      });

      row.appendChild(picker);
      row.appendChild(removeBtn);
      container.appendChild(row);
    });
  }

  _set(key, value) {
    this._config = { ...this._config, [key]: value };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config } }));
    this._render();
  }
}

customElements.define('lovelace-track-history-card-editor', LovelaceTrackHistoryCardEditor);

// ── Registration ──────────────────────────────────────────────────────────────

customElements.define('lovelace-track-history-card', LovelaceTrackHistoryCard);

window.customCards ??= [];
window.customCards.push({
  type:        'lovelace-track-history-card',
  name:        'Track History Card',
  description: 'Shows device_tracker movement history on a map for a selected day.',
  preview:     false,
});
