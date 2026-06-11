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
    cluster_radius_lbl:'Cluster radius (m)',
    min_points_lbl:    'Minimum points per cluster',
    theme_lbl:         'Theme',
    theme_system:      'System',
    theme_light:       'Light',
    theme_dark:        'Dark',
    advanced_lbl:      'Advanced',
    timeline_lbl:      'Timeline',
    stop_n:            'Stop',
    moving:            'Moving',
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
    cluster_radius_lbl:'Radio de agrupación (m)',
    min_points_lbl:    'Puntos mínimos por agrupación',
    theme_lbl:         'Tema',
    theme_system:      'Sistema',
    theme_light:       'Claro',
    theme_dark:        'Oscuro',
    advanced_lbl:      'Avanzado',
    timeline_lbl:      'Cronología',
    stop_n:            'Parada',
    moving:            'En movimiento',
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
    cluster_radius_lbl:'Rayon de regroupement (m)',
    min_points_lbl:    'Points minimum par regroupement',
    theme_lbl:         'Thème',
    theme_system:      'Système',
    theme_light:       'Clair',
    theme_dark:        'Sombre',
    advanced_lbl:      'Avancé',
    timeline_lbl:      'Chronologie',
    stop_n:            'Arrêt',
    moving:            'En mouvement',
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
    cluster_radius_lbl:'Gruppierungsradius (m)',
    min_points_lbl:    'Mindestpunkte pro Gruppierung',
    theme_lbl:         'Design',
    theme_system:      'System',
    theme_light:       'Hell',
    theme_dark:        'Dunkel',
    advanced_lbl:      'Erweitert',
    timeline_lbl:      'Zeitleiste',
    stop_n:            'Halt',
    moving:            'In Bewegung',
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
    cluster_radius_lbl:'Raggio di raggruppamento (m)',
    min_points_lbl:    'Punti minimi per raggruppamento',
    theme_lbl:         'Tema',
    theme_system:      'Sistema',
    theme_light:       'Chiaro',
    theme_dark:        'Scuro',
    advanced_lbl:      'Avanzate',
    timeline_lbl:      'Cronologia',
    stop_n:            'Sosta',
    moving:            'In movimento',
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
    cluster_radius_lbl:'Raio de agrupamento (m)',
    min_points_lbl:    'Pontos mínimos por agrupamento',
    theme_lbl:         'Tema',
    theme_system:      'Sistema',
    theme_light:       'Claro',
    theme_dark:        'Escuro',
    advanced_lbl:      'Avançado',
    timeline_lbl:      'Cronologia',
    stop_n:            'Paragem',
    moving:            'Em movimento',
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
    return { entities: [], map_height: 400, cluster_radius: 100, min_points: 3, theme: 'system' };
  }

  setConfig(config) {
    if (!config.entities || !Array.isArray(config.entities) || config.entities.length === 0) {
      throw new Error('[lovelace-track-history-card] "entities" must be a non-empty list of device_tracker entity IDs.');
    }
    this._config = {
      map_height: 400,
      default_entity: null,
      cluster_radius: 100,
      min_points: 3,
      theme: 'system',
      ...config,
    };
    this._build();
    // Redraw the map on config changes (e.g. from the visual editor) once
    // hass is available and the first load has already happened.
    if (this._hass && this._autoLoaded) this._onLoad();
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

  _initial(key) {
    return (this._t(key) || '').charAt(0).toUpperCase();
  }

  disconnectedCallback() {
    this._destroyMap();
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  _build() {
    const today = new Date().toISOString().split('T')[0];
    const h = this._config.map_height;
    // Preserve the selected date/device across rebuilds (e.g. editor changes).
    const selDate   = this._selectedDate || today;
    const selEntity = this._selectedEntity || this._config.default_entity;

    this.shadowRoot.innerHTML = `
      <style>${this._css(h)}</style>
      <ha-card>
        ${this._config.title ? `<div class="card-header">${this._config.title}</div>` : ''}
        <div class="card-content">
          <div class="controls">
            ${this._config.entities.length > 1 ? `
            <div class="ctrl-group">
              <label>${this._t('device')}</label>
              <select id="entity-select">
                ${this._config.entities.map(e => {
                  const label = this._hass?.states[e]?.attributes?.friendly_name
                    || e.replace('device_tracker.', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  const selected = e === selEntity ? ' selected' : '';
                  return `<option value="${e}"${selected}>${label}</option>`;
                }).join('')}
              </select>
            </div>` : `<input type="hidden" id="entity-select" value="${this._config.entities[0]}">`}
            <div class="ctrl-group">
              <label>${this._t('date')}</label>
              <div class="date-nav">
                <button type="button" class="date-nav-btn" id="date-prev">&#8249;</button>
                <input type="date" id="date-picker" value="${selDate}" max="${today}" />
                <button type="button" class="date-nav-btn" id="date-next" ${selDate >= today ? 'disabled' : ''}>&#8250;</button>
              </div>
            </div>
          </div>
          <div id="alert" class="alert hidden"></div>
          <div id="map-wrap">
            <div id="map"></div>
            <div id="no-data" class="no-data hidden">${this._t('no_data')}</div>
          </div>
          <div id="summary" class="summary hidden"></div>
          <div id="timeline" class="timeline hidden"></div>
        </div>
      </ha-card>
    `;

    this.shadowRoot.getElementById('entity-select')
      .addEventListener('change', e => {
        this._selectedEntity = e.target.value;
        this._onLoad();
      });

    const datePicker = this.shadowRoot.getElementById('date-picker');
    const dateNext   = this.shadowRoot.getElementById('date-next');
    const applyDate  = () => {
      this._selectedDate = datePicker.value;
      dateNext.disabled = datePicker.value >= today;
      this._onLoad();
    };
    datePicker.addEventListener('change', applyDate);
    this.shadowRoot.getElementById('date-prev')
      .addEventListener('click', () => {
        const d = new Date(datePicker.value + 'T12:00:00');
        d.setDate(d.getDate() - 1);
        datePicker.value = d.toISOString().slice(0, 10);
        applyDate();
      });
    dateNext.addEventListener('click', () => {
      const d = new Date(datePicker.value + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      datePicker.value = d.toISOString().slice(0, 10);
      applyDate();
    });
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
      .date-nav {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .date-nav input[type="date"] { flex: 1; }
      .date-nav-btn {
        flex-shrink: 0;
        width: 30px;
        height: 38px;
        padding: 0;
        background: var(--card-background-color, #fff);
        color: var(--primary-text-color, #333);
        border: 1px solid var(--divider-color, #e0e0e0);
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        transition: opacity .15s;
      }
      .date-nav-btn:hover:not(:disabled) { opacity: 0.7; }
      .date-nav-btn:disabled { opacity: 0.3; cursor: default; }
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
        text-align: center;
      }
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

      /* Timeline panel */
      .timeline {
        margin-top: 14px;
        border-top: 1px solid var(--divider-color, #e0e0e0);
        padding-top: 12px;
      }
      .tl-header {
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--secondary-text-color, #888);
        margin-bottom: 10px;
      }
      .tl-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        font-size: 13px;
        color: var(--primary-text-color, #333);
      }
      .tl-icon {
        flex-shrink: 0;
        width: 22px;
        text-align: center;
        line-height: 1.5;
      }
      .tl-body { flex: 1; padding-bottom: 10px; }
      .tl-title { font-weight: 500; }
      .tl-sub {
        font-size: 12px;
        color: var(--secondary-text-color, #888);
      }
      .tl-move {
        color: var(--secondary-text-color, #888);
        font-style: italic;
      }

      /* Leaflet popup override */
      .leaflet-popup-content { font-size: 13px; line-height: 1.5; }
    `;
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  async _onLoad() {
    const entityId = this.shadowRoot.getElementById('entity-select').value;
    const date     = this.shadowRoot.getElementById('date-picker').value;
    if (!entityId || !date) return;

    this._setAlert('');
    this._setSummary(null);
    this._setTimeline(null);
    this._setNoData(false);

    try {
      await this._injectLeafletCss();
      const L = await ensureLeaflet();
      const points = await this._fetchPoints(entityId, date);
      console.info('[track-history] %s %s → %d points', entityId, date, points.length);

      if (points.length === 0) {
        this._destroyMap();
        this._setNoData(true);
      } else {
        this._setNoData(false);
        const displayed = this._drawTrack(L, points);
        this._setSummary(points);
        this._setTimeline(displayed);
      }
    } catch (err) {
      console.error('[lovelace-track-history-card]', err);
      this._setAlert(`${this._t('error')}: ${err.message}`, 'error');
    } finally {}
  }

  async _fetchPoints(entityId, date) {
    // Local day boundaries → explicit UTC instants for the API.
    const startISO = new Date(`${date}T00:00:00`).toISOString();
    const endISO   = new Date(`${date}T23:59:59`).toISOString();

    // Use the WebSocket history API (history_during_period) — the same one the
    // HA History panel uses. The REST `history/period` endpoint returns []
    // for fully past days in many setups, while this one returns them
    // correctly. minimal_response/no_attributes must be false to keep GPS
    // attributes; significant_changes_only false to get every update.
    const result = await this._hass.callWS({
      type: 'history/history_during_period',
      start_time: startISO,
      end_time: endISO,
      entity_ids: [entityId],
      significant_changes_only: false,
      minimal_response: false,
      no_attributes: false,
    });

    const list = result?.[entityId] ?? [];
    let lastA = {};
    return list
      .map(s => {
        // Compact WS keys: s=state, a=attributes, lu=last_updated,
        // lc=last_changed (epoch seconds). Attributes carry forward when
        // unchanged. Fall back to verbose keys for older HA versions.
        const a = s.a ?? s.attributes;
        if (a) lastA = { ...lastA, ...a };
        const t = s.lu ?? s.lc ?? s.last_updated ?? s.last_changed;
        return {
          lat:      lastA.latitude != null ? parseFloat(lastA.latitude) : null,
          lng:      lastA.longitude != null ? parseFloat(lastA.longitude) : null,
          accuracy: lastA.gps_accuracy ?? 0,
          time:     typeof t === 'number' ? new Date(t * 1000) : new Date(t),
          state:    s.s ?? s.state,
        };
      })
      .filter(p => p.lat != null && p.lng != null);
  }

  // ── Map rendering ─────────────────────────────────────────────────────────

  _resolveTheme() {
    const t = this._config.theme || 'system';
    if (t === 'light' || t === 'dark') return t;
    return this._hass?.themes?.darkMode ? 'dark' : 'light';
  }

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
      wheelPxPerZoomLevel: 250,
    });

    if (this._resolveTheme() === 'dark') {
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(this._map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(this._map);
    }

    const displayed = this._clusterPoints(points, this._config.cluster_radius, this._config.min_points);
    this._numberStops(displayed);
    const latlngs   = displayed.map(p => [p.lat, p.lng]);

    // Main track polyline — geometry smoothed with a Catmull-Rom spline so
    // the path curves gently through the points instead of sharp corners.
    L.polyline(this._smoothPath(latlngs), {
      color: '#1565C0', weight: 5, opacity: 0.85,
      lineJoin: 'round', lineCap: 'round',
    }).addTo(this._map);
    this._addArrows(L, latlngs);

    // Intermediate stop markers, numbered. The first/last stops get the
    // green/end pins below; in-transit points are represented by the line only.
    displayed.forEach(p => {
      if (p.stopRole === 'mid') this._clusterMarker(L, p).addTo(this._map);
    });

    // Start marker (green) — initial derived from the localized "start" label
    this._pinMarker(L, displayed[0], '#2E7D32', this._initial('start'), this._t('start')).addTo(this._map);

    // End marker (red) — only if more than one point
    if (displayed.length > 1) {
      this._pinMarker(L, displayed[displayed.length - 1], '#C62828', this._initial('end'), this._t('end')).addTo(this._map);
    }

    this._map.fitBounds(L.latLngBounds(latlngs), { padding: [32, 32], animate: false });
    return displayed;
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
    const fmt = t => t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timeHtml = point.count > 1
      ? `🕐 ${fmt(point.time)} – ${fmt(point.timeTo)}`
      : `🕐 ${fmt(point.time)}`;
    const acc = (!point.count || point.count === 1) && point.accuracy
      ? `<div style="color:#999;font-size:11px">±${Math.round(point.accuracy)} m</div>` : '';
    const cnt = point.count > 1
      ? `<div style="color:#999;font-size:11px">${point.count} ${this._t('points')}</div>` : '';
    const st  = point.state ? `<div style="color:#999;font-size:11px">${point.state}</div>` : '';
    return `
      <div style="min-width:120px">
        ${label ? `<strong>${label}</strong><br>` : ''}
        ${timeHtml}
        ${cnt}${acc}${st}
      </div>`;
  }

  _numberStops(displayed) {
    const clusters = displayed.filter(p => p.count > 1);
    clusters.forEach((p, k) => {
      if (k === 0) p.stopRole = 'start';
      else if (k === clusters.length - 1) p.stopRole = 'end';
      else { p.stopRole = 'mid'; p.stopNo = k; }
    });
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
      ">${point.stopNo}</div>`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -16],
    });
    return L.marker([point.lat, point.lng], { icon }).bindPopup(this._popupHtml(point));
  }

  _clusterPoints(points, radiusMeters, minPoints = 3) {
    if (!radiusMeters || points.length === 0) return points.map(p => ({ ...p, count: 1 }));
    const minPts = Math.max(2, minPoints || 3);

    // Sequential clustering: a cluster is a run of CONSECUTIVE points that
    // stay within radiusMeters of the running centroid. Leaving the radius
    // and returning later forms a separate cluster.
    const groups = [];
    let group    = [points[0]];
    let centroid = { lat: points[0].lat, lng: points[0].lng };

    for (let i = 1; i < points.length; i++) {
      if (this._haversine(centroid, points[i]) * 1000 <= radiusMeters) {
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

    // Groups with at least minPts points become a cluster (one centroid
    // entry). Smaller groups are treated as in-transit and kept as their
    // individual points so the polyline still reflects the actual route.
    const result = [];
    for (const g of groups) {
      if (g.length >= minPts) {
        result.push({
          lat: g.reduce((s, p) => s + p.lat, 0) / g.length,
          lng: g.reduce((s, p) => s + p.lng, 0) / g.length,
          time:   g[0].time,
          timeTo: g[g.length - 1].time,
          count:  g.length,
          accuracy: 0,
          state:  g[0].state,
        });
      } else {
        for (const p of g) result.push({ ...p, count: 1 });
      }
    }
    return result;
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

  _setTimeline(displayed) {
    const el = this.shadowRoot.getElementById('timeline');
    if (!el) return;
    if (!displayed || !this._config.show_timeline) { el.className = 'timeline hidden'; return; }

    const items = this._buildTimeline(displayed);
    if (items.length === 0) { el.className = 'timeline hidden'; return; }

    const fmt = t => t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const rows = items.map(it => {
      if (it.type === 'stop') {
        const title = it.role === 'start' ? this._t('start')
          : it.role === 'end' ? this._t('end')
          : `${this._t('stop_n')} ${it.n}`;
        const icon = it.role === 'start' ? '🟢' : it.role === 'end' ? '🔴' : '📍';
        return `
          <div class="tl-item">
            <div class="tl-icon">${icon}</div>
            <div class="tl-body">
              <div class="tl-title">${title}</div>
              <div class="tl-sub">🕐 ${fmt(it.time)} – ${fmt(it.timeTo)}</div>
            </div>
          </div>`;
      }
      return `
        <div class="tl-item">
          <div class="tl-icon">↓</div>
          <div class="tl-body tl-move">${this._t('moving')} · ~${this._fmtDist(it.dist)}</div>
        </div>`;
    }).join('');

    el.innerHTML = `<div class="tl-header">${this._t('timeline_lbl')}</div>${rows}`;
    el.className = 'timeline';
  }

  _buildTimeline(displayed) {
    const segDist = (from, to) => {
      let d = 0;
      for (let k = from; k < to; k++) d += this._haversine(displayed[k], displayed[k + 1]);
      return d; // km
    };
    const stops = [];
    displayed.forEach((p, i) => { if (p.count > 1) stops.push(i); });

    const items = [];
    if (stops.length === 0) {
      if (displayed.length > 1) items.push({ type: 'move', dist: segDist(0, displayed.length - 1) });
      return items;
    }

    // Movement before the first stop
    if (stops[0] > 0) items.push({ type: 'move', dist: segDist(0, stops[0]) });

    stops.forEach((idx, s) => {
      const p = displayed[idx];
      items.push({ type: 'stop', n: p.stopNo, role: p.stopRole, time: p.time, timeTo: p.timeTo });
      if (s < stops.length - 1) items.push({ type: 'move', dist: segDist(idx, stops[s + 1]) });
    });

    // Movement after the last stop
    const last = stops[stops.length - 1];
    if (last < displayed.length - 1) items.push({ type: 'move', dist: segDist(last, displayed.length - 1) });

    return items;
  }

  _fmtDist(km) {
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
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

  _smoothPath(latlngs, iterations = 3) {
    if (latlngs.length < 3) return latlngs;

    // Drop near-duplicate consecutive points so real corners stand out,
    // otherwise dense GPS samples leave nothing visible to round.
    let pts = [latlngs[0]];
    for (let i = 1; i < latlngs.length; i++) {
      if (this._haversine({ lat: pts[pts.length - 1][0], lng: pts[pts.length - 1][1] },
                          { lat: latlngs[i][0], lng: latlngs[i][1] }) * 1000 > 15) {
        pts.push(latlngs[i]);
      }
    }
    if (pts[pts.length - 1] !== latlngs[latlngs.length - 1]) pts.push(latlngs[latlngs.length - 1]);
    if (pts.length < 3) return latlngs;

    // Chaikin corner-cutting: each pass replaces every segment with points at
    // 25% and 75%, visibly rounding sharp corners. Endpoints are preserved.
    for (let it = 0; it < iterations; it++) {
      const next = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const [a0, a1] = pts[i];
        const [b0, b1] = pts[i + 1];
        next.push([a0 * 0.75 + b0 * 0.25, a1 * 0.75 + b1 * 0.25]);
        next.push([a0 * 0.25 + b0 * 0.75, a1 * 0.25 + b1 * 0.75]);
      }
      next.push(pts[pts.length - 1]);
      pts = next;
    }
    return pts;
  }

  _addArrows(L, latlngs) {
    if (latlngs.length < 2) return;
    const step = Math.max(1, Math.floor(latlngs.length / 30));
    for (let i = step; i < latlngs.length; i += step) {
      const [lat1, lng1] = latlngs[i - 1];
      const [lat2, lng2] = latlngs[i];
      const angle = this._bearing(lat1, lng1, lat2, lng2);
      const mid   = [(lat1 + lat2) / 2, (lng1 + lng2) / 2];
      L.marker(mid, {
        icon: L.divIcon({
          html: `<div style="transform:rotate(${angle}deg);font-size:22px;line-height:1;
                   color:#1565C0;text-shadow:0 0 4px #fff,0 0 4px #fff;">▲</div>`,
          className: '',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
        interactive: false,
      }).addTo(this._map);
    }
  }

  _bearing(lat1, lng1, lat2, lng2) {
    const r = Math.PI / 180;
    const φ1 = lat1 * r, φ2 = lat2 * r;
    const Δλ = (lng2 - lng1) * r;
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return Math.atan2(y, x) / r;
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
  }

  setConfig(config) {
    this._config = { ...config };
    this._showTitle = 'title' in config;
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
    const clusterRadius = this._config.cluster_radius ?? 100;
    const minPoints     = this._config.min_points ?? 3;
    const themeValue    = this._config.theme || 'system';
    const showTimeline  = !!this._config.show_timeline;

    this.shadowRoot.innerHTML = `
      <style>
        .editor { display: flex; flex-direction: column; gap: 20px; padding: 4px 0; }
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
        .check-row .text-input,
        .check-row select {
          flex: 1;
          margin-top: 0;
        }
        .radio-group {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        .radio-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: var(--primary-text-color, #333);
          user-select: none;
        }
        .radio-label input[type="radio"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: var(--primary-color, #03a9f4);
          flex-shrink: 0;
        }
        .advanced {
          border-top: 1px solid var(--divider-color, #e0e0e0);
          padding-top: 16px;
        }
        .advanced > summary {
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: var(--primary-text-color, #333);
          user-select: none;
          list-style: revert;
        }
        .advanced[open] > summary { margin-bottom: 16px; }
        .advanced > div + div { margin-top: 16px; }
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
        <div>
          <div class="section-label">${this._t('tracked_devs')}</div>
          <div id="entities-list"></div>
          <button class="add-btn" id="add-entity">${this._t('add_device')}</button>
        </div>

        <div class="check-row">
          <label class="check-label">
            <input type="checkbox" id="default-check" ${hasDefault ? 'checked' : ''}>
            <span>${this._t('default_dev')}</span>
          </label>
          ${hasDefault ? `
            <select id="f-default">
              ${entities.map(e => `
                <option value="${e}" ${e === defaultValue ? 'selected' : ''}>
                  ${this._hass?.states[e]?.attributes?.friendly_name
                    || e.replace('device_tracker.', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </option>`).join('')}
            </select>
          ` : ''}
        </div>

        <div class="check-row">
          <label class="check-label">
            <input type="checkbox" id="title-check" ${hasTitle ? 'checked' : ''}>
            <span>${this._t('title_lbl')}</span>
          </label>
          <input type="text" id="f-title" class="text-input"
            placeholder="${this._t('default_title')}" value="${titleValue}"
            style="display:${hasTitle ? 'block' : 'none'}">
        </div>

        <div>
          <label class="check-label">
            <input type="checkbox" id="timeline-check" ${showTimeline ? 'checked' : ''}>
            <span>${this._t('timeline_lbl')}</span>
          </label>
        </div>

        <div>
          <div class="section-label">${this._t('theme_lbl')}</div>
          <div class="radio-group">
            ${['system', 'light', 'dark'].map(v => `
              <label class="radio-label">
                <input type="radio" name="theme-radio" value="${v}" ${themeValue === v ? 'checked' : ''}>
                <span>${this._t('theme_' + v)}</span>
              </label>`).join('')}
          </div>
        </div>

        <details class="advanced">
          <summary>${this._t('advanced_lbl')}</summary>
          <div>
            <div class="section-label">${this._t('map_height_lbl')}</div>
            <input type="number" id="f-height" class="text-input" style="margin-top:0"
              value="${map_height}" min="200" max="1000">
          </div>

          <div>
            <div class="section-label">${this._t('cluster_radius_lbl')}</div>
            <input type="number" id="f-cluster-radius" class="text-input" style="margin-top:0"
              value="${clusterRadius}" min="1" max="10000">
          </div>

          <div>
            <div class="section-label">${this._t('min_points_lbl')}</div>
            <input type="number" id="f-min-points" class="text-input" style="margin-top:0"
              value="${minPoints}" min="2" max="100">
          </div>
        </details>
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

    this.shadowRoot.querySelectorAll('input[name="theme-radio"]')
      .forEach(r => r.addEventListener('change', e => {
        if (e.target.checked) this._set('theme', e.target.value);
      }));

    this.shadowRoot.getElementById('timeline-check')
      .addEventListener('change', e => this._set('show_timeline', e.target.checked ? true : null));

    this.shadowRoot.getElementById('f-cluster-radius')
      .addEventListener('change', e => {
        const v = parseInt(e.target.value, 10);
        this._set('cluster_radius', (!isNaN(v) && v >= 1) ? v : 100);
      });

    this.shadowRoot.getElementById('f-min-points')
      .addEventListener('change', e => {
        const v = parseInt(e.target.value, 10);
        this._set('min_points', (!isNaN(v) && v >= 2) ? v : 3);
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
