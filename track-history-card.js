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

// ── Translations ──────────────────────────────────────────────────────────────

const TRANSLATIONS = {
  en: {
    device:         'Device',
    date:           'Date',
    load:           'Load',
    loading:        'Loading…',
    no_data:        'No location data found for this day.',
    points:         'points',
    error:          'Error',
    start:          'Start',
    end:            'End',
    title_lbl:      'Title',
    tracked_devs:   'Tracked devices',
    device_n:       'Device',
    add_device:     '+ Add device',
    default_dev:    'Default device',
    first_in_list:  '— first in list —',
    map_height_lbl:    'Map height (px)',
    remove:            'Remove',
    clustering_lbl:    'Cluster nearby points',
    cluster_radius_lbl:'Cluster radius (m)',
    default_title:     'Track History',
  },
  es: {
    device:         'Dispositivo',
    date:           'Fecha',
    load:           'Cargar',
    loading:        'Cargando…',
    no_data:        'No hay datos de ubicación para este día.',
    points:         'puntos',
    error:          'Error',
    start:          'Inicio',
    end:            'Fin',
    title_lbl:      'Título',
    tracked_devs:   'Dispositivos rastreados',
    device_n:       'Dispositivo',
    add_device:     '+ Añadir dispositivo',
    default_dev:    'Dispositivo por defecto',
    first_in_list:  '— primero de la lista —',
    map_height_lbl:    'Altura del mapa (px)',
    remove:            'Eliminar',
    clustering_lbl:    'Agrupar puntos cercanos',
    cluster_radius_lbl:'Radio de agrupación (m)',
    default_title:     'Track History',
  },
  fr: {
    device:         'Appareil',
    date:           'Date',
    load:           'Charger',
    loading:        'Chargement…',
    no_data:        'Aucune donnée de localisation pour ce jour.',
    points:         'points',
    error:          'Erreur',
    start:          'Départ',
    end:            'Arrivée',
    title_lbl:      'Titre',
    tracked_devs:   'Appareils suivis',
    device_n:       'Appareil',
    add_device:     '+ Ajouter un appareil',
    default_dev:    'Appareil par défaut',
    first_in_list:  '— premier de la liste —',
    map_height_lbl:    'Hauteur de la carte (px)',
    remove:            'Supprimer',
    clustering_lbl:    'Regrouper les points proches',
    cluster_radius_lbl:'Rayon de regroupement (m)',
    default_title:     'Track History',
  },
  de: {
    device:         'Gerät',
    date:           'Datum',
    load:           'Laden',
    loading:        'Lädt…',
    no_data:        'Keine Standortdaten für diesen Tag gefunden.',
    points:         'Punkte',
    error:          'Fehler',
    start:          'Start',
    end:            'Ende',
    title_lbl:      'Titel',
    tracked_devs:   'Verfolgte Geräte',
    device_n:       'Gerät',
    add_device:     '+ Gerät hinzufügen',
    default_dev:    'Standardgerät',
    first_in_list:  '— erstes in der Liste —',
    map_height_lbl:    'Kartenhöhe (px)',
    remove:            'Entfernen',
    clustering_lbl:    'Nahegelegene Punkte gruppieren',
    cluster_radius_lbl:'Gruppierungsradius (m)',
    default_title:     'Track History',
  },
  it: {
    device:         'Dispositivo',
    date:           'Data',
    load:           'Carica',
    loading:        'Caricamento…',
    no_data:        'Nessun dato di posizione trovato per questo giorno.',
    points:         'punti',
    error:          'Errore',
    start:          'Inizio',
    end:            'Fine',
    title_lbl:      'Titolo',
    tracked_devs:   'Dispositivi tracciati',
    device_n:       'Dispositivo',
    add_device:     '+ Aggiungi dispositivo',
    default_dev:    'Dispositivo predefinito',
    first_in_list:  '— primo della lista —',
    map_height_lbl:    'Altezza mappa (px)',
    remove:            'Rimuovi',
    clustering_lbl:    'Raggruppa punti vicini',
    cluster_radius_lbl:'Raggio di raggruppamento (m)',
    default_title:     'Track History',
  },
  pt: {
    device:         'Dispositivo',
    date:           'Data',
    load:           'Carregar',
    loading:        'A carregar…',
    no_data:        'Sem dados de localização para este dia.',
    points:         'pontos',
    error:          'Erro',
    start:          'Início',
    end:            'Fim',
    title_lbl:      'Título',
    tracked_devs:   'Dispositivos rastreados',
    device_n:       'Dispositivo',
    add_device:     '+ Adicionar dispositivo',
    default_dev:    'Dispositivo padrão',
    first_in_list:  '— primeiro da lista —',
    map_height_lbl:    'Altura do mapa (px)',
    remove:            'Remover',
    clustering_lbl:    'Agrupar pontos próximos',
    cluster_radius_lbl:'Raio de agrupamento (m)',
    default_title:     'Track History',
  },
};

// HA language codes can be 'en', 'es', 'pt-BR', etc. — take the base code.
function getLang(hass) {
  const base = (hass?.language ?? 'en').split('-')[0].toLowerCase();
  return TRANSLATIONS[base] ? base : 'en';
}

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
    return { entities: [], map_height: 400 };
  }

  setConfig(config) {
    if (!config.entities || !Array.isArray(config.entities) || config.entities.length === 0) {
      throw new Error('[lovelace-track-history-card] "entities" must be a non-empty list of device_tracker entity IDs.');
    }
    this._config = {
      map_height: 400,
      default_entity: null,
      ...config,
    };
    this._build();
  }

  set hass(hass) {
    const langChanged = getLang(this._hass) !== getLang(hass);
    this._hass = hass;
    if (langChanged && this._config) {
      this._destroyMap();
      this._build();
    }
    if (!this._autoLoaded && this._config) {
      this._autoLoaded = true;
      this._onLoad();
    }
  }

  _t(key) {
    return TRANSLATIONS[getLang(this._hass)][key];
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
        ${this._config.title ? `<div class="card-header">${this._config.title}</div>` : ''}
        <div class="card-content">
          <div class="controls">
            <div class="ctrl-group">
              <label>${this._t('device')}</label>
              <select id="entity-select">
                ${this._config.entities.map(e => {
                  const label = e.replace('device_tracker.', '').replace(/_/g, ' ');
                  const selected = e === this._config.default_entity ? ' selected' : '';
                  return `<option value="${e}"${selected}>${label}</option>`;
                }).join('')}
              </select>
            </div>
            <div class="ctrl-group">
              <label>${this._t('date')}</label>
              <input type="date" id="date-picker" value="${today}" max="${today}" />
            </div>
            <button id="load-btn">
              <span id="btn-label">${this._t('load')}</span>
            </button>
          </div>
          <div id="alert" class="alert hidden"></div>
          <div id="map-wrap">
            <div id="map"></div>
            <div id="no-data" class="no-data hidden">${this._t('no_data')}</div>
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
    label.textContent = this._t('loading');
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
      this._setAlert(`${this._t('error')}: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      label.textContent = this._t('load');
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

    const displayed = this._clusterPoints(points, this._config.cluster_radius);
    const latlngs   = displayed.map(p => [p.lat, p.lng]);

    // Main track polyline
    L.polyline(latlngs, { color: '#1565C0', weight: 3, opacity: 0.85 }).addTo(this._map);

    // Intermediate waypoints / clusters
    if (displayed.length > 2) {
      displayed.slice(1, -1).forEach(p => {
        if (p.count > 1) {
          this._clusterMarker(L, p).addTo(this._map);
        } else {
          L.circleMarker([p.lat, p.lng], {
            radius: 4, color: '#1565C0', weight: 2,
            fillColor: '#fff', fillOpacity: 1,
          }).bindPopup(this._popupHtml(p)).addTo(this._map);
        }
      });
    }

    // Start marker (green)
    this._pinMarker(L, displayed[0], '#2E7D32', 'S', this._t('start')).addTo(this._map);

    // End marker (red) — only if more than one point
    if (displayed.length > 1) {
      this._pinMarker(L, displayed[displayed.length - 1], '#C62828', 'E', this._t('end')).addTo(this._map);
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
    const fmt  = t => t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const time = point.count > 1
      ? `${fmt(point.time)} – ${fmt(point.timeTo)}`
      : fmt(point.time);
    const acc  = (!point.count || point.count === 1) && point.accuracy
      ? `<div style="color:#999;font-size:11px">±${Math.round(point.accuracy)} m</div>` : '';
    const cnt  = point.count > 1
      ? `<div style="color:#999;font-size:11px">${point.count} ${this._t('points')}</div>` : '';
    const st   = point.state ? `<div style="color:#999;font-size:11px">${point.state}</div>` : '';
    return `
      <div style="min-width:120px">
        ${label ? `<strong>${label}</strong><br>` : ''}
        <span>🕐 ${time}</span>
        ${cnt}${acc}${st}
      </div>`;
  }

  _clusterMarker(L, point) {
    const icon = L.divIcon({
      html: `<div style="
        background:#F57C00;color:#fff;
        width:28px;height:28px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-size:11px;font-weight:700;
        border:2px solid rgba(255,255,255,.9);
        box-shadow:0 2px 6px rgba(0,0,0,.3);
      ">${point.count}</div>`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -16],
    });
    return L.marker([point.lat, point.lng], { icon }).bindPopup(this._popupHtml(point));
  }

  _clusterPoints(points, radiusMeters) {
    if (!radiusMeters || points.length === 0) return points.map(p => ({ ...p, count: 1 }));

    const groups = [];
    let group    = [points[0]];
    let centroid = { lat: points[0].lat, lng: points[0].lng };

    for (let i = 1; i < points.length; i++) {
      const dist = this._haversine(centroid, points[i]) * 1000; // km → m
      if (dist <= radiusMeters) {
        group.push(points[i]);
        centroid = {
          lat: group.reduce((s, p) => s + p.lat, 0) / group.length,
          lng: group.reduce((s, p) => s + p.lng, 0) / group.length,
        };
      } else {
        groups.push(group);
        group    = [points[i]];
        centroid = { lat: points[i].lat, lng: points[i].lng };
      }
    }
    groups.push(group);

    return groups.map(g => {
      if (g.length === 1) return { ...g[0], count: 1 };
      const lat = g.reduce((s, p) => s + p.lat, 0) / g.length;
      const lng = g.reduce((s, p) => s + p.lng, 0) / g.length;
      return {
        lat, lng,
        time:   g[0].time,
        timeTo: g[g.length - 1].time,
        count:  g.length,
        accuracy: 0,
        state: g[0].state,
      };
    });
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
      <span class="summary-item">📍 ${points.length} ${this._t('points')}</span>
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
    this._showTitle = false;
    this._showClustering = false;
  }

  setConfig(config) {
    this._config = { ...config };
    this._showTitle = 'title' in config;
    this._showClustering = 'cluster_radius' in config;
    this._render();
  }

  set hass(hass) {
    const langChanged = getLang(this._hass) !== getLang(hass);
    this._hass = hass;
    if (langChanged && this._config) {
      this._render();
    } else {
      // Propagate hass to already-rendered entity pickers without full re-render
      this.shadowRoot.querySelectorAll('ha-entity-picker').forEach(p => { p.hass = hass; });
    }
  }

  _t(key) {
    return TRANSLATIONS[getLang(this._hass)][key];
  }

  _render() {
    const { entities = [], default_entity = '', map_height = 400 } = this._config;
    const hasTitle      = this._showTitle;
    const titleValue    = this._config.title || '';
    const hasDefault    = !!this._config.default_entity;
    const defaultValue  = this._config.default_entity || '';
    const hasClustering = this._showClustering;
    const clusterRadius = this._config.cluster_radius ?? 50;

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
        .check-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 14px;
          color: var(--primary-text-color, #333);
          user-select: none;
        }
        .check-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: var(--primary-color, #03a9f4);
          flex-shrink: 0;
        }
        .text-input {
          display: block;
          width: 100%;
          margin-top: 10px;
          padding: 8px 10px;
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 6px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #333);
          font-size: 14px;
          box-sizing: border-box;
          font-family: inherit;
        }
        .text-input:focus { outline: 2px solid var(--primary-color, #03a9f4); }
        .check-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .check-row .text-input {
          flex: 1;
          margin-top: 0;
        }
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
        <div class="check-row">
          <label class="check-label">
            <input type="checkbox" id="title-check" ${hasTitle ? 'checked' : ''}>
            <span>${this._t('title_lbl')}</span>
          </label>
          <input type="text" id="f-title" class="text-input"
            placeholder="${this._t('title_lbl')}" value="${titleValue}"
            style="display:${hasTitle ? 'block' : 'none'}">
        </div>

        <div>
          <div class="section-label">${this._t('tracked_devs')}</div>
          <div id="entities-list"></div>
          <button class="add-btn" id="add-entity">${this._t('add_device')}</button>
        </div>

        <div>
          <label class="check-label">
            <input type="checkbox" id="default-check" ${hasDefault ? 'checked' : ''}>
            <span>${this._t('default_dev')}</span>
          </label>
          ${hasDefault ? `
            <select id="f-default" style="margin-top:10px">
              ${entities.map(e => `
                <option value="${e}" ${e === defaultValue ? 'selected' : ''}>
                  ${e.replace('device_tracker.', '').replace(/_/g, ' ')}
                </option>`).join('')}
            </select>
          ` : ''}
        </div>

        <ha-textfield id="f-height" label="${this._t('map_height_lbl')}" type="number"
          value="${map_height}" min="200" max="1000"></ha-textfield>

        <div class="check-row">
          <label class="check-label">
            <input type="checkbox" id="cluster-check" ${hasClustering ? 'checked' : ''}>
            <span>${this._t('clustering_lbl')}</span>
          </label>
          <input type="number" id="f-cluster-radius" class="text-input"
            placeholder="${this._t('cluster_radius_lbl')}" value="${clusterRadius}"
            min="1" max="10000" style="display:${hasClustering ? 'block' : 'none'}">
        </div>
      </div>
    `;

    this._buildEntityPickers(entities);

    this.shadowRoot.getElementById('title-check')
      .addEventListener('change', e => {
        this._showTitle = e.target.checked;
        const field = this.shadowRoot.getElementById('f-title');
        field.style.display = e.target.checked ? 'block' : 'none';
        if (e.target.checked) {
          field.value = field.value || this._t('default_title');
          this._set('title', field.value);
        } else {
          this._set('title', null);
        }
      });

    this.shadowRoot.getElementById('f-title')
      .addEventListener('change', e => this._set('title', e.target.value.trim()));

    this.shadowRoot.getElementById('add-entity')
      .addEventListener('click', () => this._set('entities', [...(this._config.entities || []), '']));

    this.shadowRoot.getElementById('default-check')
      .addEventListener('change', e => {
        this._set('default_entity', e.target.checked ? (entities[0] || '') : null);
      });

    if (hasDefault) {
      this.shadowRoot.getElementById('f-default')
        .addEventListener('change', e => this._set('default_entity', e.target.value || null));
    }

    this.shadowRoot.getElementById('cluster-check')
      .addEventListener('change', e => {
        this._showClustering = e.target.checked;
        const field = this.shadowRoot.getElementById('f-cluster-radius');
        field.style.display = e.target.checked ? 'block' : 'none';
        if (!e.target.checked) this._set('cluster_radius', null);
        else if (!this._config.cluster_radius) this._set('cluster_radius', 50);
      });

    this.shadowRoot.getElementById('f-cluster-radius')
      .addEventListener('change', e => {
        const v = parseInt(e.target.value, 10);
        this._set('cluster_radius', (!isNaN(v) && v >= 1) ? v : 50);
      });

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
      picker.setAttribute('label', `${this._t('device_n')} ${idx + 1}`);
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
      removeBtn.setAttribute('label', this._t('remove'));
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
    const config = { ...this._config };
    if (value === null || value === undefined) {
      delete config[key];
    } else {
      config[key] = value;
    }
    this._config = config;
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
