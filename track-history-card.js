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
 *   units: metric        # metric (default) or imperial
 *   show_arrows: true    # direction arrows on the path (default true)
 *   arrow_count: 30      # number of arrows when enabled (default 30)
 */

const LEAFLET_VERSION = '1.9.4';
const LEAFLET_JS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
const LEAFLET_CSS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;

// Numeric config limits — the single source of truth for each field's default
// and the range enforced in setConfig, the editor inputs and the editor labels.
// Change a value here and it propagates everywhere.
const LIMITS = {
  map_height:     { min: 200, max: 1000, def: 450 },
  cluster_radius: { min:  50, max:  500, def: 200 },
  min_points:     { min:   2, max:    5, def:   3 },
  arrow_count:    { min:  10, max:   30, def:  30 },
};

// ── Translations ──────────────────────────────────────────────────────────────

const TRANSLATIONS = {
  en: {
    track_of:       'Track of',
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
    cluster_radius_lbl:'Cluster radius',
    min_points_lbl:    'Minimum points per cluster',
    units_lbl:         'Units',
    units_metric:      'Metric',
    units_imperial:    'Imperial',
    theme_lbl:         'Theme',
    theme_system:      'System',
    theme_light:       'Light',
    theme_dark:        'Dark',
    advanced_lbl:      'Advanced',
    timeline_lbl:      'Timeline',
    arrows_lbl:        'Direction arrows',
    arrow_count_lbl:   'Number of arrows',
    stop_n:            'Stop',
    moving:            'Moving',
    recenter:          'Recenter',
    default_title:     'Track History',
  },
  es: {
    track_of:       'Trayecto de',
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
    cluster_radius_lbl:'Radio de agrupación',
    min_points_lbl:    'Puntos mínimos por agrupación',
    units_lbl:         'Sistema de medida',
    units_metric:      'Métrico',
    units_imperial:    'Imperial',
    theme_lbl:         'Tema',
    theme_system:      'Sistema',
    theme_light:       'Claro',
    theme_dark:        'Oscuro',
    advanced_lbl:      'Avanzado',
    timeline_lbl:      'Cronología',
    arrows_lbl:        'Flechas de dirección',
    arrow_count_lbl:   'Número de flechas',
    stop_n:            'Parada',
    moving:            'En movimiento',
    recenter:          'Recentrar',
    default_title:     'Track History',
  },
  fr: {
    track_of:       'Trajet de',
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
    cluster_radius_lbl:'Rayon de regroupement',
    min_points_lbl:    'Points minimum par regroupement',
    units_lbl:         'Unités',
    units_metric:      'Métrique',
    units_imperial:    'Impérial',
    theme_lbl:         'Thème',
    theme_system:      'Système',
    theme_light:       'Clair',
    theme_dark:        'Sombre',
    advanced_lbl:      'Avancé',
    timeline_lbl:      'Chronologie',
    arrows_lbl:        'Flèches de direction',
    arrow_count_lbl:   'Nombre de flèches',
    stop_n:            'Arrêt',
    moving:            'En mouvement',
    recenter:          'Recentrer',
    default_title:     'Track History',
  },
  de: {
    track_of:       'Verlauf von',
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
    cluster_radius_lbl:'Gruppierungsradius',
    min_points_lbl:    'Mindestpunkte pro Gruppierung',
    units_lbl:         'Einheiten',
    units_metric:      'Metrisch',
    units_imperial:    'Imperial',
    theme_lbl:         'Design',
    theme_system:      'System',
    theme_light:       'Hell',
    theme_dark:        'Dunkel',
    advanced_lbl:      'Erweitert',
    timeline_lbl:      'Zeitleiste',
    arrows_lbl:        'Richtungspfeile',
    arrow_count_lbl:   'Anzahl der Pfeile',
    stop_n:            'Halt',
    moving:            'In Bewegung',
    recenter:          'Neu zentrieren',
    default_title:     'Track History',
  },
  it: {
    track_of:       'Percorso di',
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
    cluster_radius_lbl:'Raggio di raggruppamento',
    min_points_lbl:    'Punti minimi per raggruppamento',
    units_lbl:         'Unità di misura',
    units_metric:      'Metrico',
    units_imperial:    'Imperiale',
    theme_lbl:         'Tema',
    theme_system:      'Sistema',
    theme_light:       'Chiaro',
    theme_dark:        'Scuro',
    advanced_lbl:      'Avanzate',
    timeline_lbl:      'Cronologia',
    arrows_lbl:        'Frecce di direzione',
    arrow_count_lbl:   'Numero di frecce',
    stop_n:            'Sosta',
    moving:            'In movimento',
    recenter:          'Ricentra',
    default_title:     'Track History',
  },
  pt: {
    track_of:       'Trajeto de',
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
    cluster_radius_lbl:'Raio de agrupamento',
    min_points_lbl:    'Pontos mínimos por agrupamento',
    units_lbl:         'Unidades',
    units_metric:      'Métrico',
    units_imperial:    'Imperial',
    theme_lbl:         'Tema',
    theme_system:      'Sistema',
    theme_light:       'Claro',
    theme_dark:        'Escuro',
    advanced_lbl:      'Avançado',
    timeline_lbl:      'Cronologia',
    arrows_lbl:        'Setas de direção',
    arrow_count_lbl:   'Número de setas',
    stop_n:            'Paragem',
    moving:            'Em movimento',
    recenter:          'Recentrar',
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
    return {
      entities: [],
      map_height: LIMITS.map_height.def,
      cluster_radius: LIMITS.cluster_radius.def,
      min_points: LIMITS.min_points.def,
      theme: 'system',
    };
  }

  setConfig(config) {
    if (!config.entities || !Array.isArray(config.entities) || config.entities.length === 0) {
      throw new Error('[lovelace-track-history-card] "entities" must be a non-empty list of device_tracker entity IDs.');
    }
    this._config = {
      default_entity: null,
      theme: 'system',
      ...config,
    };
    // Enforce the same ranges as the editor here too, so a hand-edited YAML
    // can't bypass them. Missing / out-of-range / non-numeric values are
    // clamped or fall back to the default — matching what the editor stores.
    this._config.map_height     = this._clampNum(this._config.map_height,     LIMITS.map_height);
    this._config.cluster_radius = this._clampNum(this._config.cluster_radius,  LIMITS.cluster_radius);
    this._config.min_points     = this._clampNum(this._config.min_points,      LIMITS.min_points);
    if (this._config.arrow_count != null) {
      this._config.arrow_count  = this._clampNum(this._config.arrow_count,     LIMITS.arrow_count);
    }
    this._build();
    // Redraw the map on config changes (e.g. from the visual editor) once
    // hass is available and the first load has already happened.
    if (this._hass && this._autoLoaded) this._onLoad();
  }

  // Clamp a config value to a field's [min, max], rounding to an integer and
  // falling back to its default when missing or not a number.
  _clampNum(v, { min, max, def }) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : def;
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

  // The `person` linked to a Home Assistant user that owns this tracker, or
  // null. A tracker can belong to at most one such person.
  _personForTracker(entityId) {
    const states = this._hass?.states || {};
    for (const id in states) {
      if (!id.startsWith('person.')) continue;
      const attrs = states[id].attributes || {};
      if (attrs.user_id && Array.isArray(attrs.device_trackers)
          && attrs.device_trackers.includes(entityId)) {
        return { id, name: attrs.friendly_name || id.replace('person.', '') };
      }
    }
    return null;
  }

  // The tracker's own name: friendly_name, else a title-cased entity id.
  _trackerName(entityId) {
    return this._hass?.states[entityId]?.attributes?.friendly_name
      || entityId.replace('device_tracker.', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // Label for a device_tracker in the selector. Shows the owning user's name
  // when the tracker is assigned to one — unless two configured trackers share
  // the same user, in which case the user name would be ambiguous, so we keep
  // the tracker names. Unassigned trackers always show their tracker name.
  _deviceLabel(entityId) {
    const person = this._personForTracker(entityId);
    if (person) {
      const shared = (this._config?.entities || []).some(
        e => e !== entityId && this._personForTracker(e)?.id === person.id);
      if (!shared) return person.name;
    }
    return this._trackerName(entityId);
  }

  // Format a time honouring the user's HA profile settings (12/24h + language).
  _fmtTime(t) {
    const locale = this._hass?.locale;
    const opts = { hour: '2-digit', minute: '2-digit' };
    if (locale?.time_format === '24') opts.hour12 = false;
    else if (locale?.time_format === '12') opts.hour12 = true;
    // 'language' / 'system' (or unset) → let Intl decide from the locale.
    return t.toLocaleTimeString(locale?.language || [], opts);
  }

  // Format an ISO date (yyyy-mm-dd) honouring the user's HA profile date_format
  // (DMY / MDY / YMD / language / system). The native <input type="date"> can't
  // be told which order to render, so we display this string over it instead.
  _fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T12:00:00');
    if (isNaN(d)) return iso;
    const locale = this._hass?.locale;
    const fmt = locale?.date_format;
    const opts = { year: 'numeric', month: '2-digit', day: '2-digit' };
    // Force the day/month/year order via a locale known to produce it.
    if (fmt === 'DMY') return d.toLocaleDateString('en-GB', opts); // dd/mm/yyyy
    if (fmt === 'MDY') return d.toLocaleDateString('en-US', opts); // mm/dd/yyyy
    if (fmt === 'YMD') return d.toLocaleDateString('en-CA', opts); // yyyy-mm-dd
    if (fmt === 'system') return d.toLocaleDateString([], opts);   // browser locale
    // 'language' or unset → the HA UI language's own date format.
    return d.toLocaleDateString(locale?.language || [], opts);
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
              <label>${this._t('track_of')}</label>
              <select id="entity-select">
                ${this._config.entities.map(e => {
                  const label = this._deviceLabel(e);
                  const selected = e === selEntity ? ' selected' : '';
                  return `<option value="${e}"${selected}>${label}</option>`;
                }).join('')}
              </select>
            </div>` : `<input type="hidden" id="entity-select" value="${this._config.entities[0]}">`}
            <div class="ctrl-group">
              <label>${this._t('date')}</label>
              <div class="date-nav">
                <button type="button" class="date-nav-btn" id="date-prev">&#8249;</button>
                <div class="date-field">
                  <button type="button" class="date-display" id="date-display">${this._fmtDate(selDate)}</button>
                  <input type="date" id="date-picker" value="${selDate}" max="${today}" tabindex="-1" aria-hidden="true" />
                </div>
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

    const datePicker  = this.shadowRoot.getElementById('date-picker');
    const dateNext    = this.shadowRoot.getElementById('date-next');
    const dateDisplay = this.shadowRoot.getElementById('date-display');
    const applyDate   = () => {
      this._selectedDate = datePicker.value;
      dateNext.disabled = datePicker.value >= today;
      if (dateDisplay) dateDisplay.textContent = this._fmtDate(datePicker.value);
      this._onLoad();
    };
    datePicker.addEventListener('change', applyDate);
    // The visible button just opens the native calendar; the input itself is
    // hidden so its browser-locale text never shows.
    dateDisplay.addEventListener('click', () => {
      if (typeof datePicker.showPicker === 'function') datePicker.showPicker();
      else { datePicker.focus(); datePicker.click(); }
    });
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
      .date-field { position: relative; flex: 1; }
      /* The visible field is a button showing the date in the user's HA format;
         the native <input type="date"> below is invisible and only used to open
         the calendar picker (showPicker), so the browser-locale text is never
         shown. */
      .date-field .date-display { cursor: pointer; font-family: inherit; }
      .date-field input[type="date"] {
        position: absolute;
        inset: 0;
        opacity: 0;
        pointer-events: none;
      }
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
      select, input[type="date"], .date-display {
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
        /* Contain Leaflet's high z-index panes/controls in their own stacking
           context so they don't render above the Home Assistant header.
           Leaflet's internal pane ordering is preserved inside the context. */
        isolation: isolate;
        z-index: 0;
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
        gap: 10px;
        font-size: 13px;
        color: var(--primary-text-color, #333);
        padding: 6px 10px;
        border-radius: 8px;
      }
      /* Stops get a zebra background so the right-hand value reads as part of
         the same row; movement segments stay transparent in between. */
      .tl-item.tl-stop {
        background: var(--secondary-background-color, rgba(0, 0, 0, 0.05));
      }
      .tl-rail {
        position: relative;
        flex-shrink: 0;
        width: 22px;
      }
      .tl-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 20px;
        font-size: 14px;
      }
      .tl-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #F57C00;
        color: #fff;
        font-size: 10px;
        font-weight: 700;
      }
      /* Vertical connector between consecutive events; extends past the row
         padding so the line stays continuous across the gap. */
      .tl-item:not(:last-child) .tl-rail::after {
        content: '';
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        top: 20px;
        bottom: -12px;
        width: 2px;
        background: var(--divider-color, #e0e0e0);
      }
      .tl-main {
        flex: 1;
        min-width: 0;
      }
      .tl-line {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
      }
      .tl-title { font-weight: 500; }
      .tl-value {
        flex-shrink: 0;
        color: var(--secondary-text-color, #888);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .tl-sub {
        margin-top: 1px;
        text-align: right;
        font-size: 12px;
        color: var(--secondary-text-color, #888);
      }
      .tl-subline {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        margin-top: 1px;
      }
      .tl-zone { font-weight: 500; }
      .tl-move .tl-title {
        color: var(--secondary-text-color, #888);
        font-style: italic;
        font-weight: 400;
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

    // Keep the date overlay in sync with the locale (the first build can run
    // before `hass` — and thus the user's date_format — is available).
    const dateDisplay = this.shadowRoot.getElementById('date-display');
    if (dateDisplay) dateDisplay.textContent = this._fmtDate(date);

    this._setAlert('');

    try {
      await this._injectLeafletCss();
      const L = await ensureLeaflet();
      const points = await this._fetchPoints(entityId, date);

      // The previous summary/timeline stay on screen during the fetch and are
      // replaced in place once the new data is ready — clearing them up front
      // collapses the card and then re-expands it, which reads as a flicker.
      if (points.length === 0) {
        // Keep the map alive (the opaque "no data" overlay covers it); just
        // drop the previous track so returning to a day with data is flicker-free.
        if (this._trackLayer) this._trackLayer.clearLayers();
        this._setSummary(null);
        this._setTimeline(null);
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
    const endISO   = new Date(`${date}T23:59:59.999`).toISOString();

    // Use the `history/stream` WS subscription — the same one the HA History
    // panel uses. The REST `history/period` endpoint and the one-shot
    // `history/history_during_period` command both return empty for fully past
    // days in recent HA versions; `history/stream` returns them correctly.
    const list = await this._streamHistory(entityId, startISO, endISO);

    let lastA = {};
    return list
      .map(s => {
        // Compact keys: s=state, a=attributes, lu=last_updated,
        // lc=last_changed (epoch seconds). Attributes carry forward when
        // unchanged. Verbose keys are a fallback for older HA versions.
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

  _streamHistory(entityId, startISO, endISO) {
    // `history/stream` is a subscription: the first event carries the initial
    // history, followed by live updates. We take that first event and
    // unsubscribe immediately.
    return new Promise((resolve, reject) => {
      let unsub = null;
      let done = false;
      const finish = (val) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (unsub) { try { unsub(); } catch (_) { /* ignore */ } }
        resolve(val);
      };
      const timer = setTimeout(() => finish([]), 15000);

      this._hass.connection.subscribeMessage(
        (msg) => { if (msg && msg.states) finish(msg.states[entityId] ?? []); },
        {
          type: 'history/stream',
          entity_ids: [entityId],
          start_time: startISO,
          end_time: endISO,
          minimal_response: false,
          no_attributes: false,
          significant_changes_only: false,
        }
      ).then((u) => {
        unsub = u;
        if (done) { try { u(); } catch (_) { /* ignore */ } }
      }).catch(reject);
    });
  }

  // ── Map rendering ─────────────────────────────────────────────────────────

  _resolveTheme() {
    const t = this._config.theme || 'system';
    if (t === 'light' || t === 'dark') return t;
    return this._hass?.themes?.darkMode ? 'dark' : 'light';
  }

  // Add the tile layer to the (reused) map, rebuilding it only when the theme
  // actually changes so the tiles aren't needlessly reloaded on every redraw.
  _ensureTileLayer(L) {
    const theme = this._resolveTheme();
    if (this._tileLayer && this._tileTheme === theme) return;
    if (this._tileLayer) this._map.removeLayer(this._tileLayer);
    // keepBuffer holds more off-screen tiles so panning/zooming to a new day or
    // device reuses cached tiles instead of flashing the empty background while
    // fresh ones load (fade animations are off, so there's no cross-fade).
    this._tileLayer = theme === 'dark'
      ? L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
          keepBuffer: 6,
        })
      : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
          keepBuffer: 6,
        });
    this._tileLayer.addTo(this._map);
    this._tileTheme = theme;
  }

  _drawTrack(L, points) {
    // Reuse the map across loads. Tearing it down and rebuilding it on every
    // date/device change blanks the container and reloads every tile, which
    // shows as a flicker. Instead the map is created once; on later loads we
    // only swap the track layers (polyline, markers, arrows), keeping the map
    // and its (already cached) tiles in place.
    if (!this._map) {
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
      this._trackLayer = L.layerGroup().addTo(this._map);
      this._addRecenterControl(L);
    }
    this._ensureTileLayer(L);
    this._trackLayer.clearLayers();

    const displayed = this._clusterPoints(points, this._radiusMeters(), this._config.min_points);
    this._numberStops(displayed);
    const latlngs   = displayed.map(p => [p.lat, p.lng]);
    // Stops (clusters) are anchors the smoothed line must pass through, so it
    // never cuts the corner of an isolated stop and leaves its marker uncrossed.
    const anchors   = displayed.reduce((a, p, i) => (p.count > 1 && a.push(i), a), []);

    // Start/end markers. If both fall within the cluster radius (e.g. a day
    // that starts and ends at home) they'd overlap, so a single combined
    // half-green/half-red marker is drawn at their midpoint instead.
    const startP = displayed[0];
    const endP   = displayed[displayed.length - 1];
    const sameZone = displayed.length > 1
      && this._haversine(startP, endP) * 1000 <= this._radiusMeters();

    // Main track polyline — smoothed per segment between anchors so the line
    // curves gently yet still passes exactly through every stop, start and end.
    const smoothed = this._smoothPath(latlngs, anchors);
    // With the combined marker the start and end points differ but the marker
    // sits at their midpoint, so snap both line ends to that midpoint too —
    // otherwise the line stops short of the marker (noticeable when zoomed in).
    if (sameZone) {
      const mid = [(startP.lat + endP.lat) / 2, (startP.lng + endP.lng) / 2];
      smoothed[0] = mid;
      smoothed[smoothed.length - 1] = mid;
    }
    L.polyline(smoothed, {
      color: '#1565C0', weight: 5, opacity: 0.85,
      lineJoin: 'round', lineCap: 'round',
    }).addTo(this._trackLayer);
    // Arrows follow the same smoothed geometry so they sit on the drawn line.
    if (this._config.show_arrows !== false) this._addArrows(L, smoothed);

    // Intermediate stop markers, numbered. The first/last stops get the
    // green/end pins below; in-transit points are represented by the line only.
    displayed.forEach(p => {
      if (p.stopRole === 'mid') this._clusterMarker(L, p).addTo(this._trackLayer);
    });

    if (sameZone) {
      this._startEndMarker(L, startP, endP).addTo(this._trackLayer);
    } else {
      this._pinMarker(L, startP, '#2E7D32', this._t('start'), 'start').addTo(this._trackLayer);
      if (displayed.length > 1) {
        this._pinMarker(L, endP, '#C62828', this._t('end'), 'end').addTo(this._trackLayer);
      }
    }

    this._bounds = L.latLngBounds(latlngs);
    this._map.fitBounds(this._bounds, { padding: [32, 32], animate: false });
    return displayed;
  }

  _addRecenterControl(L) {
    const self = this;
    const Control = L.Control.extend({
      options: { position: 'topleft' },
      onAdd() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const btn = L.DomUtil.create('a', '', container);
        btn.href = '#';
        btn.title = self._t('recenter');
        btn.setAttribute('role', 'button');
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" width="18" height="18" style="display:block">
            <path fill="currentColor" d="M12 8a4 4 0 100 8 4 4 0 000-8zm8.94 3A9 9 0 0013 3.06V1h-2v2.06A9 9 0 003.06 11H1v2h2.06A9 9 0 0011 20.94V23h2v-2.06A9 9 0 0020.94 13H23v-2zM12 19a7 7 0 110-14 7 7 0 010 14z"/>
          </svg>`;
        L.DomEvent.on(btn, 'click', (e) => {
          L.DomEvent.preventDefault(e);
          L.DomEvent.stopPropagation(e);
          if (self._bounds) self._map.fitBounds(self._bounds, { padding: [32, 32], animate: false });
        });
        return container;
      },
    });
    this._map.addControl(new Control());
  }

  _pinMarker(L, point, color, label, role = '') {
    const icon = L.divIcon({
      html: `<div style="
        width:26px;height:26px;border-radius:50%;
        background:${color};
        border:2px solid rgba(255,255,255,.9);
        box-shadow:0 2px 6px rgba(0,0,0,.35);
      "></div>`,
      className: '',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -16],
    });
    return L.marker([point.lat, point.lng], { icon })
      .bindPopup(this._popupHtml(point, label, role));
  }

  _startEndMarker(L, startP, endP) {
    const fmt = t => this._fmtTime(t);
    const icon = L.divIcon({
      html: `<div style="
        width:26px;height:26px;border-radius:50%;
        background:linear-gradient(90deg,#2E7D32 0 50%,#C62828 50% 100%);
        border:2px solid rgba(255,255,255,.9);
        box-shadow:0 2px 6px rgba(0,0,0,.35);
      "></div>`,
      className: '',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -16],
    });
    // Start and end coincide here, so they share a zone — show it once, first.
    const zone = this._zoneName(startP);
    const popup = `
      <div style="min-width:120px">
        ${zone ? `<strong>(${zone})</strong><br>` : ''}
        <strong>${this._t('start')}</strong> 🕐 ${fmt(startP.timeTo ?? startP.time)}<br>
        <strong>${this._t('end')}</strong> 🕐 ${fmt(endP.time)}
      </div>`;
    // Place it at the midpoint so it sits between the two coincident points.
    const mid = [(startP.lat + endP.lat) / 2, (startP.lng + endP.lng) / 2];
    return L.marker(mid, { icon }).bindPopup(popup);
  }

  _popupHtml(point, label = '', role = '') {
    const fmt = t => this._fmtTime(t);
    // Zone (if any) is appended in parentheses right after the label.
    const zone = this._zoneName(point);
    const labelText = label && zone ? `${label} (${zone})` : label;
    // Start stop → departure time (last point); end stop → arrival time
    // (first point); other stops → the full arrival–departure range.
    const timeHtml = role === 'start'
      ? `🕐 ${fmt(point.timeTo ?? point.time)}`
      : role === 'end'
      ? `🕐 ${fmt(point.time)}`
      : point.count > 1
      ? `🕐 ${fmt(point.time)} – ${fmt(point.timeTo)} (${this._fmtDuration(point.timeTo - point.time)})`
      : `🕐 ${fmt(point.time)}`;
    return `
      <div style="min-width:120px">
        ${labelText ? `<strong>${labelText}</strong><br>` : ''}
        ${timeHtml}
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
    return L.marker([point.lat, point.lng], { icon })
      .bindPopup(this._popupHtml(point, `${this._t('stop_n')} ${point.stopNo}`));
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
      } else if (
        i + 1 < points.length &&
        this._haversine(centroid, points[i + 1]) * 1000 <= radiusMeters
      ) {
        // Single stray point that leaves the radius and immediately returns —
        // ignore it so the line doesn't spike out and back, which also keeps
        // the surrounding points as one cluster instead of splitting them.
        continue;
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
    this._trackLayer = null;
    this._tileLayer = null;
    this._tileTheme = null;
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

    const first = this._fmtTime(points[0].time);
    const last  = this._fmtTime(points[points.length - 1].time);
    const dist  = this._fmtDist(this._totalKm(points));

    el.innerHTML = `
      <span class="summary-item">📍 ${points.length} ${this._t('points')}</span>
      <span class="summary-item">🕐 ${first} – ${last}</span>
      <span class="summary-item">📏 ~${dist}</span>
    `;
    el.className = 'summary';
  }

  _setTimeline(displayed) {
    const el = this.shadowRoot.getElementById('timeline');
    if (!el) return;
    if (!displayed || !this._config.show_timeline) { el.className = 'timeline hidden'; return; }

    const items = this._buildTimeline(displayed);
    if (items.length === 0) { el.className = 'timeline hidden'; return; }

    const fmt = t => this._fmtTime(t);
    const rows = items.map(it => {
      if (it.type === 'stop') {
        const isStartEnd = it.role === 'start' || it.role === 'end';
        let title = it.role === 'start' ? this._t('start')
          : it.role === 'end' ? this._t('end')
          : `${this._t('stop_n')} ${it.n}`;
        // Start/end show the zone inline, right after the word Start / End.
        if (isStartEnd && it.zone) title += ` (${it.zone})`;
        const icon = it.role === 'start' ? '🟢'
          : it.role === 'end' ? '🔴'
          : `<span class="tl-badge">${it.n}</span>`;
        // Start → departure (last point); end → arrival (first point);
        // other stops → the full arrival–departure range + dwell duration.
        const value = it.role === 'start' ? fmt(it.timeTo)
          : it.role === 'end' ? fmt(it.time)
          : `${fmt(it.time)} – ${fmt(it.timeTo)}`;
        // Mid stops carry the zone (when any) on its own line under the title,
        // above the dwell duration.
        // Mid stops: zone (left, styled like the title) and dwell duration
        // (right, muted) share one line.
        const sub = isStartEnd
          ? ''
          : `<div class="tl-subline"><span class="tl-zone">${it.zone ? `(${it.zone})` : ''}</span><span class="tl-sub">(${this._fmtDuration(it.timeTo - it.time)})</span></div>`;
        return `
          <div class="tl-item tl-stop">
            <div class="tl-rail"><div class="tl-icon">${icon}</div></div>
            <div class="tl-main">
              <div class="tl-line">
                <span class="tl-title">${title}</span>
                <span class="tl-value">${value}</span>
              </div>
              ${sub}
            </div>
          </div>`;
      }
      return `
        <div class="tl-item">
          <div class="tl-rail"><div class="tl-icon">↓</div></div>
          <div class="tl-main">
            <div class="tl-line tl-move">
              <span class="tl-title">${this._t('moving')}</span>
              <span class="tl-value">~${this._fmtDist(it.dist)}</span>
            </div>
          </div>
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
      items.push({ type: 'stop', n: p.stopNo, role: p.stopRole, time: p.time, timeTo: p.timeTo, zone: this._zoneName(p) });
      if (s < stops.length - 1) items.push({ type: 'move', dist: segDist(idx, stops[s + 1]) });
    });

    // Movement after the last stop
    const last = stops[stops.length - 1];
    if (last < displayed.length - 1) items.push({ type: 'move', dist: segDist(last, displayed.length - 1) });

    return items;
  }

  _fmtDist(km) {
    if (this._config.units === 'imperial') {
      const miles = km / 1.609344;
      // Below ~0.1 mi (≈528 ft) show feet, otherwise miles — mirrors the m/km split.
      return miles < 0.1 ? `${Math.round(km * 3280.84)} ft` : `${miles.toFixed(1)} mi`;
    }
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  }

  // Name of the Home Assistant zone (a zone.* entity) that contains a point, or
  // null if it falls outside every zone. When zones overlap, the smallest (most
  // specific) one wins — mirroring how HA assigns a device to a zone.
  _zoneName(point) {
    const states = this._hass?.states;
    if (!states) return null;
    let best = null;
    for (const id in states) {
      if (!id.startsWith('zone.')) continue;
      const a = states[id].attributes || {};
      if (a.latitude == null || a.longitude == null || !a.radius) continue;
      const dist = this._haversine(point, { lat: a.latitude, lng: a.longitude }) * 1000;
      if (dist <= a.radius && (!best || a.radius < best.radius)) {
        best = { name: a.friendly_name || id.slice(5), radius: a.radius };
      }
    }
    return best ? best.name : null;
  }

  // The cluster radius is entered in the configured units (m or ft) but the
  // clustering math works in metres, so convert feet → metres when imperial.
  _radiusMeters() {
    const r = this._config.cluster_radius ?? LIMITS.cluster_radius.def;
    return this._config.units === 'imperial' ? r * 0.3048 : r;
  }

  // Dwell time for a stop, given a span in milliseconds (Date subtraction)
  // → "1 h 15 min". "min" (not "m") avoids clashing with metres in distances;
  // both units read the same across the supported locales.
  _fmtDuration(ms) {
    const mins = Math.max(0, Math.round(ms / 60000));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h && m) return `${h} h ${m} min`;
    if (h) return `${h} h`;
    return `${m} min`;
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
    return d; // km
  }

  _smoothPath(latlngs, anchors = [], iterations = 3) {
    if (latlngs.length < 3) return latlngs;

    // Split the path at anchor indices (stops) and smooth each segment
    // independently. Chaikin preserves a segment's endpoints, so the line
    // always passes exactly through every anchor instead of cutting its corner.
    const bounds = Array.from(new Set([0, ...anchors, latlngs.length - 1]))
      .sort((a, b) => a - b);

    const out = [];
    for (let b = 0; b < bounds.length - 1; b++) {
      const seg = this._chaikin(latlngs.slice(bounds[b], bounds[b + 1] + 1), iterations);
      out.push(...(b === 0 ? seg : seg.slice(1)));
    }
    return out;
  }

  _chaikin(latlngs, iterations) {
    if (latlngs.length < 3) return latlngs;

    // Drop near-duplicate consecutive points so real corners stand out,
    // otherwise dense GPS samples leave nothing visible to round. The
    // segment's first and last points (anchors) are always kept.
    let pts = [latlngs[0]];
    for (let i = 1; i < latlngs.length - 1; i++) {
      if (this._haversine({ lat: pts[pts.length - 1][0], lng: pts[pts.length - 1][1] },
                          { lat: latlngs[i][0], lng: latlngs[i][1] }) * 1000 > 15) {
        pts.push(latlngs[i]);
      }
    }
    pts.push(latlngs[latlngs.length - 1]);
    if (pts.length < 3) return pts;

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

    // Per-segment lengths (km) and total path length, so arrows can be spaced
    // by real distance rather than by vertex index. Index spacing left long
    // straight stretches (few vertices) sparse and wiggly ones dense; equal
    // distance spacing keeps the arrow density uniform along the whole route.
    const segLen = [];
    let total = 0;
    for (let i = 1; i < latlngs.length; i++) {
      const d = this._haversine(
        { lat: latlngs[i - 1][0], lng: latlngs[i - 1][1] },
        { lat: latlngs[i][0],     lng: latlngs[i][1] });
      segLen.push(d);
      total += d;
    }
    if (total === 0) return;

    // Spread the configured number of arrows evenly by distance (default 30),
    // so long trips don't render hundreds of markers.
    const count    = Math.max(1, this._config.arrow_count ?? LIMITS.arrow_count.def);
    const stepDist = total / count;
    let nextAt = stepDist;  // distance from the start at which to drop the next arrow
    let acc    = 0;         // cumulative distance up to the start of the current segment

    for (let i = 1; i < latlngs.length; i++) {
      const segStart = acc;
      acc += segLen[i - 1];
      const [lat1, lng1] = latlngs[i - 1];
      const [lat2, lng2] = latlngs[i];
      const angle = this._bearing(lat1, lng1, lat2, lng2);
      // Drop every arrow whose target distance lands inside this segment,
      // interpolating its exact position along the segment.
      while (nextAt <= acc && nextAt < total) {
        const t   = segLen[i - 1] > 0 ? (nextAt - segStart) / segLen[i - 1] : 0;
        const pos = [lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t];
        nextAt += stepDist;
        L.marker(pos, {
          icon: L.divIcon({
            html: `<div style="transform:rotate(${angle}deg);font-size:22px;line-height:1;
                     color:#1565C0;text-shadow:0 0 4px #fff,0 0 4px #fff;">▲</div>`,
            className: '',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          }),
          interactive: false,
          // Keep arrows below stop/start/end markers (Leaflet otherwise stacks
          // markers by latitude, so an arrow could cover a cluster marker).
          zIndexOffset: -1000,
        }).addTo(this._trackLayer);
      }
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
    this._advancedOpen = false;
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
    const { entities = [], default_entity = '', map_height = LIMITS.map_height.def } = this._config;
    const hasTitle      = this._showTitle;
    const titleValue    = this._config.title || '';
    const hasDefault    = !!this._config.default_entity;
    const defaultValue  = this._config.default_entity || '';
    const clusterRadius = this._config.cluster_radius ?? LIMITS.cluster_radius.def;
    const minPoints     = this._config.min_points ?? LIMITS.min_points.def;
    const themeValue    = this._config.theme || 'system';
    const showTimeline  = !!this._config.show_timeline;
    const showArrows    = this._config.show_arrows !== false;
    const arrowCount    = this._config.arrow_count ?? LIMITS.arrow_count.def;
    const unitsValue    = this._config.units || 'metric';
    const unitSuffix    = unitsValue === 'imperial' ? 'ft' : 'm';
    // "(min–max)" suffix appended to each numeric field's label/placeholder.
    const range = (k) => `(${LIMITS[k].min}–${LIMITS[k].max})`;

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
          <div class="section-label" style="margin-bottom:12px">${this._t('tracked_devs')}</div>
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

        <div class="check-row">
          <label class="check-label">
            <input type="checkbox" id="arrows-check" ${showArrows ? 'checked' : ''}>
            <span>${this._t('arrows_lbl')} ${range('arrow_count')}</span>
          </label>
          <input type="number" id="f-arrow-count" class="text-input"
            value="${arrowCount}" min="${LIMITS.arrow_count.min}" max="${LIMITS.arrow_count.max}"
            title="${this._t('arrow_count_lbl')} ${range('arrow_count')}"
            placeholder="${this._t('arrow_count_lbl')} ${range('arrow_count')}"
            style="display:${showArrows ? 'block' : 'none'}">
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

        <details class="advanced" id="advanced" ${this._advancedOpen ? 'open' : ''}>
          <summary>${this._t('advanced_lbl')}</summary>
          <div>
            <div class="section-label">${this._t('map_height_lbl')} ${range('map_height')}</div>
            <input type="number" id="f-height" class="text-input" style="margin-top:0"
              value="${map_height}" min="${LIMITS.map_height.min}" max="${LIMITS.map_height.max}">
          </div>

          <div>
            <div class="section-label">${this._t('units_lbl')}</div>
            <div class="radio-group">
              ${['metric', 'imperial'].map(v => `
                <label class="radio-label">
                  <input type="radio" name="units-radio" value="${v}" ${unitsValue === v ? 'checked' : ''}>
                  <span>${this._t('units_' + v)}</span>
                </label>`).join('')}
            </div>
          </div>

          <div>
            <div class="section-label">${this._t('cluster_radius_lbl')} (${unitSuffix}) ${range('cluster_radius')}</div>
            <input type="number" id="f-cluster-radius" class="text-input" style="margin-top:0"
              value="${clusterRadius}" min="${LIMITS.cluster_radius.min}" max="${LIMITS.cluster_radius.max}">
          </div>

          <div>
            <div class="section-label">${this._t('min_points_lbl')} ${range('min_points')}</div>
            <input type="number" id="f-min-points" class="text-input" style="margin-top:0"
              value="${minPoints}" min="${LIMITS.min_points.min}" max="${LIMITS.min_points.max}">
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

    this.shadowRoot.querySelectorAll('input[name="units-radio"]')
      .forEach(r => r.addEventListener('change', e => {
        if (e.target.checked) this._set('units', e.target.value === 'imperial' ? 'imperial' : null);
      }));

    this.shadowRoot.getElementById('timeline-check')
      .addEventListener('change', e => this._set('show_timeline', e.target.checked ? true : null));

    this.shadowRoot.getElementById('arrows-check')
      .addEventListener('change', e => {
        // Arrows on is the default, so store only the "off" state.
        const count = this.shadowRoot.getElementById('f-arrow-count');
        if (count) count.style.display = e.target.checked ? 'block' : 'none';
        this._set('show_arrows', e.target.checked ? null : false);
      });

    this.shadowRoot.getElementById('f-arrow-count')
      .addEventListener('change', e => {
        const v = this._clampInt(e.target, LIMITS.arrow_count);
        // The default is implied, so drop the key when it matches to keep config clean.
        this._set('arrow_count', v !== LIMITS.arrow_count.def ? v : null);
      });

    this.shadowRoot.getElementById('f-cluster-radius')
      .addEventListener('change', e => {
        this._set('cluster_radius', this._clampInt(e.target, LIMITS.cluster_radius));
      });

    this.shadowRoot.getElementById('f-min-points')
      .addEventListener('change', e => {
        this._set('min_points', this._clampInt(e.target, LIMITS.min_points));
      });

    this.shadowRoot.getElementById('f-height')
      .addEventListener('change', e => {
        this._set('map_height', this._clampInt(e.target, LIMITS.map_height));
      });

    // Remember the Advanced section's open state so editing a field (which
    // re-renders the editor) doesn't collapse it.
    this.shadowRoot.getElementById('advanced')
      .addEventListener('toggle', e => { this._advancedOpen = e.target.open; });
  }

  // Parse a number field, clamp it to a field's [min, max] (falling back to its
  // default when empty or non-numeric), and reflect the corrected value back
  // into the input so a hand-typed out-of-range value is visibly snapped in.
  _clampInt(el, { min, max, def }) {
    const v = parseInt(el.value, 10);
    const clamped = isNaN(v) ? def : Math.min(max, Math.max(min, v));
    el.value = clamped;
    return clamped;
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
