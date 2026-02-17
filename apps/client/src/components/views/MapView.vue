<template>
    <div class="map-view-container display-flex flex-direction-column height-100">
        <div class="map-wrapper flex-shrink-0" style="height: 60vh; width: 100%; position: relative;">
            <div :id="mapId" class="map-container" style="height: 100%; width: 100%; z-index: 1;"></div>

            <!-- Loading Overlay -->
            <div v-if="mapLoading" class="map-loading-overlay">
                <f7-preloader />
                <span class="text-color-gray size-12 margin-top-half">Memuat peta...</span>
            </div>

            <!-- Processing Overlay (Async Build) -->
            <div v-if="isProcessing && !mapLoading" class="map-loading-overlay">
                <div class="display-flex flex-direction-column align-items-center">
                    <f7-preloader />
                    <span class="margin-top-half size-12 font-weight-bold">Memproses Peta... {{ processProgress
                        }}%</span>
                    <span class="size-10 text-color-gray">Mohon tunggu sebentar</span>
                </div>
            </div>

            <!-- Empty State Overlay -->
            <div v-if="!mapLoading && validLocations.length === 0" class="map-empty-overlay">
                <f7-icon f7="map" size="40" class="text-color-gray margin-bottom"></f7-icon>
                <span class="text-color-gray">Belum ada data lokasi</span>
            </div>

            <!-- Locate Me FAB -->
            <div class="map-fab-container">
                <f7-button fab color="white" class="map-action-btn margin-bottom-half" @click="toggleMapStyle">
                    <f7-icon :f7="currentStyle === 'satellite' ? 'map' : 'globe'" size="22" color="blue"></f7-icon>
                </f7-button>
                <f7-button fab color="white" class="map-action-btn" @click="locateUser" :loading="locating">
                    <f7-icon f7="location" size="22" color="blue"></f7-icon>
                </f7-button>
            </div>
        </div>

        <div class="list-container flex-grow-1 overflow-auto bg-color-white">
            <f7-block-title>
                Lokasi ({{ validLocations.length }})
                <span v-if="validLocations.length > 50" class="text-color-gray size-12 font-normal margin-left-half">
                    (Menampilkan 50 teratas)
                </span>
            </f7-block-title>
            <f7-list media-list>
                <f7-list-item v-for="item in displayedListItems" :key="item.id || item.local_id"
                    :title="resolvePath(item, normalizedConfig.label) || resolvePath(item, normalizedConfig.popup_title) || 'Untitled'"
                    :subtitle="resolvePath(item, normalizedConfig.subtitle) || resolvePath(item, normalizedConfig.popup_subtitle) || ''"
                    @click="focusMap(item)" link="#">
                    <template #media>
                        <div class="list-color-dot" :style="{ background: resolveColor(getMarkerStyle(item).color) }">
                        </div>
                    </template>
                </f7-list-item>
                <f7-list-item v-if="validLocations.length > 50">
                    <div class="text-align-center width-100 padding text-color-gray">
                        Gunakan pencarian untuk memfilter hasil list.
                    </div>
                </f7-list-item>
            </f7-list>
        </div>
    </div>
</template>

<script setup lang="ts">
import { createMap, destroyMap, getCurrentPosition, getGoogleMapsUrl, maplibregl } from '@cerdas/form-engine';
import { f7 } from 'framework7-vue';
import 'maplibre-gl/dist/maplibre-gl.css';
import { computed, onMounted, onUnmounted, ref, toRaw, watch } from 'vue';

const props = defineProps<{
    config: any;
    data: any[];
    contextId?: string;
}>();

// eslint-disable-next-line sonarjs/pseudo-random
const mapId = `map-${Math.random().toString(36).substr(2, 9)}`;
let map: maplibregl.Map | null = null;
let popup: maplibregl.Popup | null = null;
let userMarker: maplibregl.Marker | null = null;
const locating = ref(false);
const mapLoading = ref(true);

// ============================================================================
// Config Parsing (unchanged)
// ============================================================================

const normalizedConfig = computed(() => {
    return props.config.map || props.config.config?.map || props.config.options || {};
});

const toNum = (v: any): number => {
    const n = parseFloat(String(v));
    return isNaN(n) ? NaN : n;
};

const parseLatLongString = (val: any): [number, number] | null => {
    if (typeof val !== 'string') return null;
    const parts = val.includes(',') ? val.split(',') : val.trim().split(/\s+/);
    const [latStr, lngStr] = parts;
    if (!latStr || !lngStr) return null;
    const lat = toNum(latStr.trim());
    const lng = toNum(lngStr.trim());
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    return null;
};

const parseGeoCoords = (val: any): [number, number] | null => {
    if (val?.coords) {
        const lat = toNum(val.coords.latitude), lng = toNum(val.coords.longitude);
        if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    }
    return null;
};

const parseLatLongObject = (val: any): [number, number] | null => {
    if (typeof val === 'object' && !Array.isArray(val)) {
        const lat = toNum(val.lat ?? val.latitude);
        const lng = toNum(val.lng ?? val.long ?? val.longitude);
        if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    }
    return null;
};

const parseLatLongArray = (val: any): [number, number] | null => {
    if (Array.isArray(val) && val.length >= 2) {
        const lat = toNum(val[0]), lng = toNum(val[1]);
        if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    }
    return null;
};

const getCoordinates = (item: any, gpsCol: string): [number, number] | null => {
    const val = resolvePath(item, gpsCol);
    if (!val) return null;
    return parseLatLongString(val) ||
        parseGeoCoords(val) ||
        parseLatLongObject(val) ||
        parseLatLongArray(val);
};

// LOADING STATE
const isProcessing = ref(false);
const processProgress = ref(0);
let abortController: AbortController | null = null;
let updateDebounce: ReturnType<typeof setTimeout> | null = null;
const CHUNK_SIZE = 2000;

const validLocations = computed(() => {
    // PERFORMANCE: Use toRaw to avoid Proxy overhead when iterating 30k+ items
    const rawData = toRaw(props.data);
    const mapConfig = normalizedConfig.value;
    const gpsCol = mapConfig.gps_column;
    if (!gpsCol) return [];
    return rawData.filter(item => {
        // Simple filter remains synchronous as it is fast
        return getCoordinates(item, gpsCol) !== null;
    });
});

// LIMIT LIST RENDERING TO PREVENT DOM FREEZE
const displayedListItems = computed(() => {
    return validLocations.value.slice(0, 50);
});

const getDeep = (target: any, p: string) => {
    if (!target) return undefined;
    return p.split('.').reduce((acc, part) => acc && acc[part], target);
};

const resolvePrelist = (obj: any, path: string) => {
    let prelist = obj.prelist_data;
    if (typeof prelist === 'string') {
        try { prelist = JSON.parse(prelist); } catch { /* ignore */ }
    }
    const val = getDeep(typeof prelist === 'object' ? prelist : obj, path.replace('prelist_data.', ''));
    return val || '';
};

const resolvePath = (obj: any, path: string) => {
    if (!obj || !path) return '';
    if (path.startsWith('prelist_data.')) {
        return resolvePrelist(obj, path);
    }
    const val = getDeep(obj, path) ||
        getDeep(obj.response_data, path) ||
        getDeep(obj.data, path) ||
        getDeep(obj.prelist_data, path);
    if (val !== undefined && val !== null && val !== '') return val;
    return '';
};

// ============================================================================
// Marker Style (adapted for MapLibre circle colors)
// ============================================================================

const markerStyleFn = computed(() => {
    const fnBody = normalizedConfig.value.marker_style_fn;
    if (!fnBody) return null;
    try {
        /* eslint-disable-next-line sonarjs/code-eval */
        return new Function('data', 'item', fnBody);
    } catch (e) {
        console.error('Invalid marker logic:', e);
        return null;
    }
});

const getMarkerStyle = (item: any) => {
    const defaultStyle = { icon: 'location_fill', color: 'blue' };
    if (!markerStyleFn.value) return defaultStyle;
    try {
        const data = item.response_data || item.data || {};
        const result = markerStyleFn.value(data, item);
        return {
            icon: result?.icon || defaultStyle.icon,
            color: result?.color || defaultStyle.color
        };
    } catch {
        return defaultStyle;
    }
};

/** Map F7 color names to hex for MapLibre circle-color */
const COLOR_MAP: Record<string, string> = {
    red: '#ff3b30',
    green: '#34c759',
    blue: '#2196f3',
    orange: '#ff9500',
    yellow: '#ffcc00',
    purple: '#af52de',
    pink: '#ff2d55',
    gray: '#8e8e93',
    teal: '#5ac8fa',
    deeporange: '#ff6d00',
    lightblue: '#64b5f6',
    white: '#ffffff',
    black: '#1c1c1e',
};

const resolveColor = (colorName: string): string => {
    return COLOR_MAP[colorName] ?? '#2196f3';
};

// ============================================================================
// GeoJSON Construction
// ============================================================================

/**
 * Convert validLocations into a GeoJSON FeatureCollection.
 * Each feature carries properties for popup display and circle styling.
 * This is a SINGLE data object — MapLibre renders it all via WebGL
 * without creating any DOM elements per marker.
 */
/**
 * ASYNC GEOJSON BUILDER
 * Chunks the processing of 30k+ items to prevent Main Thread Block (ANR).
 * Uses setTimeout(0) to yield to the browser rendering loop.
 */
const buildGeoJsonAsync = (signal: AbortSignal): Promise<GeoJSON.FeatureCollection | null> => {
    return new Promise((resolve) => {
        const mapConfig = normalizedConfig.value;
        const gpsCol = mapConfig.gps_column;
        const styleFn = markerStyleFn.value;

        // Use Valid Locations which are already filtered for valid coords
        // use toRaw AGAIN just to be safe we are working with plain objects
        const rawLocations = toRaw(validLocations.value);
        const total = rawLocations.length;
        const features: GeoJSON.Feature[] = [];

        if (total === 0) {
            resolve({ type: 'FeatureCollection', features: [] });
            return;
        }

        let index = 0;

        const processChunk = () => {
            if (signal.aborted) {
                resolve(null);
                return;
            }

            const end = Math.min(index + CHUNK_SIZE, total);

            for (let i = index; i < end; i++) {
                const item = rawLocations[i];
                const coords = getCoordinates(item, gpsCol);
                if (!coords) continue;

                const [lat, lng] = coords;
                const itemId = item.id || item.local_id;

                // Style Marker
                let markerColor = '#2196f3';
                if (styleFn) {
                    try {
                        const data = item.response_data || item.data || {};
                        const result = styleFn(data, item);
                        markerColor = resolveColor(result?.color || 'blue');
                    } catch { /* ignore */ }
                }

                features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [lng, lat],
                    },
                    properties: {
                        id: itemId,
                        markerColor,
                    },
                });
            }

            index = end;
            processProgress.value = Math.round((index / total) * 100);

            if (index < total) {
                setTimeout(processChunk, 0); // Yield to main thread
            } else {
                resolve({ type: 'FeatureCollection', features });
            }
        };

        processChunk();
    });
};

// ============================================================================
// Map Init & Layers
// ============================================================================

const SOURCE_ID = 'markers-source';
const CLUSTER_LAYER = 'clusters';
const CLUSTER_COUNT_LAYER = 'cluster-count';
const UNCLUSTERED_LAYER = 'unclustered-point';

const GoogleHybridStyle = {
    version: 8,
    sources: {
        'google-hybrid': {
            type: 'raster',
            tiles: [
                'cached-tile://https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                'cached-tile://https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                'cached-tile://https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                'cached-tile://https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
            ],
            tileSize: 256,
            attribution: '© Google',
        },
    },
    layers: [
        {
            id: 'google-hybrid-layer',
            type: 'raster',
            source: 'google-hybrid',
            minzoom: 0,
            maxzoom: 22,
        },
    ],
};

const GoogleStreetsStyle = {
    version: 8,
    sources: {
        'google-streets': {
            type: 'raster',
            tiles: [
                'cached-tile://https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
                'cached-tile://https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
                'cached-tile://https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
                'cached-tile://https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
            ],
            tileSize: 256,
            attribution: '© Google',
        },
    },
    layers: [
        {
            id: 'google-streets-layer',
            type: 'raster',
            source: 'google-streets',
            minzoom: 0,
            maxzoom: 22,
        },
    ],
};

const currentStyle = ref<'satellite' | 'streets'>('satellite');

const toggleMapStyle = () => {
    if (!map) return;
    const newStyle = currentStyle.value === 'satellite' ? 'streets' : 'satellite';
    currentStyle.value = newStyle;

    const styleConfig = newStyle === 'satellite' ? GoogleHybridStyle : GoogleStreetsStyle;

    // Switch style and re-add layers once loaded
    map.setStyle(styleConfig as any);
    map.once('styledata', () => {
        addSourceAndLayers();
    });
};

const initMap = () => {
    if (map) return;

    map = createMap(mapId, {
        navigationControl: 'bottom-right',
        style: GoogleHybridStyle as any, // Default to Hybrid
    });

    map.on('load', () => {
        mapLoading.value = false;
        addSourceAndLayers();
        setupClickHandlers();
    });

    map.on('error', () => {
        mapLoading.value = false;
    });
};



const addSourceAndLayers = () => {
    if (!map) return;

    // GeoJSON Source initial setup (empty first)
    map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }, // Start empty
        cluster: true,
        clusterMaxZoom: 16,
        clusterRadius: 30,
        clusterMinPoints: 30, // Optimized to 30 per user request
        generateId: true,
    });

    // Trigger async load
    updateGeoJsonSourceAsync();

    // Layer 1: Cluster circles
    map.addLayer({
        id: CLUSTER_LAYER,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
            'circle-color': [
                'step', ['get', 'point_count'],
                '#51bbd6',  // < 100
                100, '#f1f075', // 100-750
                750, '#f28cb1'  // > 750
            ],
            'circle-radius': [
                'step', ['get', 'point_count'],
                18,   // < 100
                100, 24, // 100-750
                750, 30  // > 750
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
        },
    });

    // Layer 2: Cluster count label
    map.addLayer({
        id: CLUSTER_COUNT_LAYER,
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 12,
            'text-font': ['Open Sans Bold'] as string[],
        },
        paint: {
            'text-color': '#333',
        },
    });

    // Layer 3: Individual (unclustered) points
    map.addLayer({
        id: UNCLUSTERED_LAYER,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': ['get', 'markerColor'],
            'circle-radius': 7,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
        },
    });

    // Fit bounds is called inside updateGeoJsonSourceAsync
};

const fitBoundsToData = (geojson: GeoJSON.FeatureCollection) => {
    if (!map || geojson.features.length === 0) return;

    // PERFORMANCE: Sample max 500 points for bounds calculation
    // Iterating 30k points just for bounds is wasteful
    const bounds = new maplibregl.LngLatBounds();
    const limit = Math.min(geojson.features.length, 500);
    // Take even spread if possible, or just first N
    // For speed, strict slice is fastest.
    const sample = geojson.features.slice(0, limit);

    for (const feature of sample) {
        const coords = (feature.geometry as GeoJSON.Point).coordinates;
        bounds.extend(coords as [number, number]);
    }

    // Check if we have valid bounds (not 0,0)
    if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50, maxZoom: 16 });
    }
};

// ============================================================================
// Click Handlers
// ============================================================================

const setupClickHandlers = () => {
    if (!map) return;

    // Click on cluster → zoom in
    map.on('click', CLUSTER_LAYER, (e) => {
        if (!map) return;
        const features = map.queryRenderedFeatures(e.point, { layers: [CLUSTER_LAYER] });
        if (!features.length) return;

        const feature = features[0];
        if (!feature) return;
        const clusterId = feature.properties?.cluster_id;
        const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
            map?.easeTo({
                center: (feature.geometry as GeoJSON.Point).coordinates as [number, number],
                zoom,
            });
        });
    });

    // Click on individual point → show popup
    map.on('click', UNCLUSTERED_LAYER, (e) => {
        if (!map || !e.features?.length) return;

        const feature = e.features[0];
        if (!feature) return;

        const geometry = feature.geometry as GeoJSON.Point;
        const coords = geometry.coordinates.slice() as [number, number];
        const properties = feature.properties;
        const itemId = properties?.id;

        // Lookup item logic
        // We use the ID to find the original item from validLocations
        // logic must handle both string/number IDs
        const item = validLocations.value.find((x: any) =>
            String(x.id) === String(itemId) || String(x.local_id) === String(itemId)
        );

        if (!item) {
            console.warn('Marker clicked but item not found:', itemId);
            return;
        }

        const mapConfig = normalizedConfig.value;
        const title = resolvePath(item, mapConfig.label) || resolvePath(item, mapConfig.popup_title) || 'Untitled';
        const subtitle = resolvePath(item, mapConfig.subtitle) || resolvePath(item, mapConfig.popup_subtitle) || '';
        const [lat, lng] = [coords[1], coords[0]]; // display purpose / external link

        const popupHtml = `
            <div class="map-popup-content">
                <div class="popup-title">${title}</div>
                <div class="popup-subtitle">${subtitle}</div>
                <div class="popup-actions display-flex margin-top-half">
                    <a href="/assignments/${itemId}" data-item-id="${itemId}" class="button button-small button-fill color-blue margin-right-half flex-grow-1">
                        <span class="text-color-white">Buka Detail</span>
                    </a>
                    <a href="${getGoogleMapsUrl(lat, lng)}" target="_blank" class="button button-small button-fill color-green flex-shrink-0 external">
                        <i class="f7-icons size-14 text-color-white">map_fill</i>
                    </a>
                </div>
            </div>
        `;

        // Remove previous popup
        if (popup) popup.remove();

        popup = new maplibregl.Popup({ maxWidth: '260px' })
            .setLngLat(coords)
            .setHTML(popupHtml)
            .addTo(map);
    });

    // Cursor changes
    map.on('mouseenter', CLUSTER_LAYER, () => { if (map) map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', CLUSTER_LAYER, () => { if (map) map.getCanvas().style.cursor = ''; });
    map.on('mouseenter', UNCLUSTERED_LAYER, () => { if (map) map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', UNCLUSTERED_LAYER, () => { if (map) map.getCanvas().style.cursor = ''; });
};

// ============================================================================
// Data Updates
// ============================================================================

// ============================================================================
// Data Updates (Async)
// ============================================================================

const updateGeoJsonSourceAsync = async () => {
    if (!map) return;

    // 1. Cancel previous build if running
    if (abortController) abortController.abort();
    abortController = new AbortController();
    const signal = abortController.signal;

    isProcessing.value = true;
    processProgress.value = 0;

    try {
        // 2. Build GeoJSON in chunks
        const geojson = await buildGeoJsonAsync(signal);

        // 3. Update Map if not aborted
        if (!signal.aborted && geojson) {
            const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
            if (source) {
                // Reuse existing source (performance)
                source.setData(geojson);
                fitBoundsToData(geojson);
            }
        }
    } catch (e) {
        console.error('Map update failed:', e);
    } finally {
        if (!signal.aborted) {
            isProcessing.value = false;
        }
    }
};

// ============================================================================
// User Location
// ============================================================================

const locateUser = async () => {
    if (!map) return;
    locating.value = true;
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pos = await getCurrentPosition({ enableHighAccuracy: true }) as any;
        const { latitude, longitude } = pos.coords;

        if (userMarker) {
            userMarker.setLngLat([longitude, latitude]);
        } else {
            // Create a blue dot marker for user location
            const el = document.createElement('div');
            el.className = 'user-location-marker';
            userMarker = new maplibregl.Marker({ element: el })
                .setLngLat([longitude, latitude])
                .addTo(map);
        }
        map.flyTo({ center: [longitude, latitude], zoom: 16 });
    } catch (e) {
        console.error('Failed to locate user:', e);
        f7.toast.show({
            text: 'Gagal mendapatkan lokasi',
            closeTimeout: 2000,
            cssClass: 'color-red'
        });
    } finally {
        locating.value = false;
    }
};

// ============================================================================
// Focus on List Item
// ============================================================================

const focusMap = (item: any) => {
    const mapConfig = normalizedConfig.value;
    const gpsCol = mapConfig.gps_column;
    const coords = getCoordinates(item, gpsCol);

    if (coords && map) {
        const [lat, lng] = coords;
        map.flyTo({ center: [lng, lat], zoom: 18 });

        // Auto-open popup for this item after flyTo finishes
        map.once('moveend', () => {
            if (!map) return;
            const title = resolvePath(item, mapConfig.label) || resolvePath(item, mapConfig.popup_title) || 'Untitled';
            const subtitle = resolvePath(item, mapConfig.subtitle) || resolvePath(item, mapConfig.popup_subtitle) || '';
            const itemId = item.id || item.local_id;

            const popupHtml = `
                <div class="map-popup-content">
                    <div class="popup-title">${title}</div>
                    <div class="popup-subtitle">${subtitle}</div>
                    <div class="popup-actions display-flex margin-top-half">
                        <a href="/assignments/${itemId}" data-item-id="${itemId}" class="button button-small button-fill color-blue margin-right-half flex-grow-1">
                            <span class="text-color-white">Buka Detail</span>
                        </a>
                        <a href="${getGoogleMapsUrl(lat, lng)}" target="_blank" class="button button-small button-fill color-green flex-shrink-0 external">
                            <i class="f7-icons size-14 text-color-white">map_fill</i>
                        </a>
                    </div>
                </div>
            `;

            if (popup) popup.remove();
            popup = new maplibregl.Popup({ maxWidth: '260px' })
                .setLngLat([lng, lat])
                .setHTML(popupHtml)
                .addTo(map);
        });
    }
};

// ============================================================================
// Watchers
// ============================================================================

// Debounce updates to prevent heavy rebuilding on rapid changes
watch(() => props.data, () => {
    if (updateDebounce) clearTimeout(updateDebounce);
    updateDebounce = setTimeout(() => {
        updateGeoJsonSourceAsync();
    }, 300);
});

/**
 * Delegated click listener for MapLibre popups.
 * MapLibre popups are raw HTML in the DOM, so Framework7's router
 * doesn't automatically capture their links.
 */
const handlePopupClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[data-item-id]');
    if (link) {
        const href = link.getAttribute('href');
        if (href) {
            e.preventDefault();
            f7.view.main.router.navigate(href);
        }
    }
};

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
    setTimeout(() => {
        initMap();
    }, 300);
    document.addEventListener('click', handlePopupClick);
});

onUnmounted(() => {
    if (popup) popup.remove();
    if (userMarker) userMarker.remove();
    destroyMap(map);
    map = null;
    document.removeEventListener('click', handlePopupClick);
});
</script>

<style scoped>
.map-view-container {
    height: 100%;
    overflow: hidden;
}

.map-fab-container {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 1000;
}

.map-action-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background-color: #ffffff !important;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001;
    /* Ensure on top */
}

/* Loading & Empty overlays */
.map-loading-overlay,
.map-empty-overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(248, 249, 250, 0.9);
    pointer-events: none;
}

/* List color dot */
.list-color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
}

/* User location blue dot with pulse */
:global(.user-location-marker) {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #2196F3;
    border: 2px solid #fff;
    box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.3);
    animation: user-pulse 2s ease-out infinite;
}

@keyframes user-pulse {
    0% {
        box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.4);
    }

    70% {
        box-shadow: 0 0 0 12px rgba(33, 150, 243, 0);
    }

    100% {
        box-shadow: 0 0 0 4px rgba(33, 150, 243, 0);
    }
}

/* MapLibre popup styling */
:global(.maplibregl-popup-content) {
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:global(.map-popup-content) {
    font-family: var(--f7-font-family);
}

:global(.map-popup-content .popup-title) {
    font-weight: 700;
    font-size: 15px;
    margin-bottom: 2px;
    color: #000;
}

:global(.map-popup-content .popup-subtitle) {
    font-size: 12px;
    color: #666;
    line-height: 1.3;
}

/* Force white text/icons for filled buttons in popups */
:global(.map-popup-content .button-fill) {
    --f7-button-text-color: #fff !important;
    color: #fff !important;
}

:global(.map-popup-content .button-fill i),
:global(.map-popup-content .button-fill span) {
    color: #fff !important;
}
</style>
