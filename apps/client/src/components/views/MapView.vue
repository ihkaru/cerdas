<template>
    <div class="map-view-container display-flex flex-direction-column height-100">
        <div class="map-wrapper flex-shrink-0" style="height: 60vh; width: 100%; position: relative;">
            <div :id="mapId" class="map-container" style="height: 100%; width: 100%; z-index: 1;"></div>

            <!-- Locate Me FAB -->
            <div class="map-fab-container">
                <f7-button fab color="white" class="map-locate-btn" @click="locateUser" :loading="locating">
                    <f7-icon f7="location" size="22" color="blue"></f7-icon>
                </f7-button>
            </div>
        </div>

        <div class="list-container flex-grow-1 overflow-auto bg-color-white">
            <f7-block-title>Locations ({{ validLocations.length }})</f7-block-title>
            <f7-list media-list>
                <f7-list-item v-for="item in validLocations" :key="item.id || item.local_id"
                    :title="resolvePath(item, normalizedConfig.label) || resolvePath(item, normalizedConfig.popup_title) || 'Untitled'"
                    :subtitle="resolvePath(item, normalizedConfig.subtitle) || resolvePath(item, normalizedConfig.popup_subtitle) || ''"
                    @click="focusMap(item)" link="#">
                </f7-list-item>
            </f7-list>
        </div>
    </div>
</template>

<script setup lang="ts">
import { getCurrentPosition, getGoogleMapsUrl } from '@cerdas/form-engine';
import { f7 } from 'framework7-vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

// Fix Leaflet icon issue in Webpack/Vite
// @ts-ignore
import iconUrl from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const props = defineProps<{
    config: any;
    data: any[];
    contextId?: string;
}>();

// eslint-disable-next-line sonarjs/pseudo-random
const mapId = `map-${Math.random().toString(36).substr(2, 9)}`;
let map: L.Map | null = null;
let markers: L.LayerGroup | null = null;
let userMarker: L.CircleMarker | null = null;
const locating = ref(false);

const normalizedConfig = computed(() => {
    return props.config.map || props.config.config?.map || props.config.options || {};
});

const toNum = (v: any): number => {
    const n = parseFloat(String(v));
    return isNaN(n) ? NaN : n;
};

const parseLatLongString = (val: any): [number, number] | null => {
    if (typeof val !== 'string') return null;

    // Support both comma and space separation
    const parts = val.includes(',') ? val.split(',') : val.trim().split(/\s+/);

    // Explicitly destructure and check for existence to satisfy TypeScript
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

const validLocations = computed(() => {
    const mapConfig = normalizedConfig.value;
    const gpsCol = mapConfig.gps_column;

    if (!gpsCol) return [];

    return props.data.filter(item => {
        return getCoordinates(item, gpsCol) !== null;
    });
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

    // Try multiple sources in order
    // Added prelist_data fallback as most imported data lives there
    const val = getDeep(obj, path) ||
        getDeep(obj.response_data, path) ||
        getDeep(obj.data, path) ||
        getDeep(obj.prelist_data, path);

    if (val !== undefined && val !== null && val !== '') return val;
    return '';
};

const initMap = () => {
    if (map) return;

    map = L.map(mapId, {
        zoomControl: false // Move zoom control to custom position or hide for cleaner mobile UI
    }).setView([-6.2088, 106.8456], 13);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        crossOrigin: true
    }).addTo(map);

    markers = L.layerGroup().addTo(map);

    updateMarkers();

    // Fix icons
    const DefaultIcon = L.icon({
        iconUrl: iconUrl,
        iconRetinaUrl: iconRetinaUrl,
        shadowUrl: shadowUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = DefaultIcon;
};

const locateUser = async () => {
    if (!map) return;
    locating.value = true;
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pos = await getCurrentPosition({ enableHighAccuracy: true }) as any;
        const { latitude, longitude } = pos.coords;

        if (userMarker) {
            userMarker.setLatLng([latitude, longitude]);
        } else {
            userMarker = L.circleMarker([latitude, longitude], {
                radius: 8,
                fillColor: '#2196F3',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map);
        }
        map.setView([latitude, longitude], 16);
    } catch (e) {
        console.error('Failed to locate user:', e);
    } finally {
        locating.value = false;
    }
};

const markerStyleFn = computed(() => {
    const fnBody = normalizedConfig.value.marker_style_fn;
    if (!fnBody) return null;
    try {
        // Safe-ish evaluation
        /* eslint-disable-next-line sonarjs/code-eval */
        return new Function('data', 'item', fnBody);
    } catch (e) {
        console.error('Invalid marker logic:', e);
        return null;
    }
});

const getMarkerStyle = (item: any) => {
    const defaultStyle = { icon: 'location_fill', color: 'blue' }; // Default F7 icon

    if (!markerStyleFn.value) return defaultStyle;

    try {
        // Resolve data context (Assignment Response or Raw Data)
        const data = item.response_data || item.data || {};
        const result = markerStyleFn.value(data, item);

        return {
            icon: result?.icon || defaultStyle.icon,
            color: result?.color || defaultStyle.color
        };
    } catch {
        return defaultStyle;
    }
}

const updateMarkers = () => {
    if (!map || !markers) return;
    markers.clearLayers();

    const mapConfig = normalizedConfig.value;
    const gpsCol = mapConfig.gps_column;

    // Explicitly type as tuple array for fitBounds
    const bounds: [number, number][] = [];

    validLocations.value.forEach(item => {
        const coords = getCoordinates(item, gpsCol);
        if (!coords) return;

        const [lat, lng] = coords;
        const title = resolvePath(item, mapConfig.label) || resolvePath(item, mapConfig.popup_title) || 'Untitled';
        const subtitle = resolvePath(item, mapConfig.subtitle) || resolvePath(item, mapConfig.popup_subtitle) || '';
        const style = getMarkerStyle(item);
        const itemId = item.id || item.local_id;

        // Create Custom Icon (DivIcon with F7 Icon)
        const customIcon = L.divIcon({
            className: 'custom-map-marker',
            html: `<div class="marker-pin bg-color-${style.color}">
                     <i class="f7-icons text-color-white size-18">${style.icon}</i>
                   </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32], // Bottom center
            popupAnchor: [0, -32]
        });

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

        const marker = L.marker([lat, lng], { icon: customIcon })
            .bindPopup(popupHtml, { minWidth: 200 })
            .on('click', () => { });

        markers?.addLayer(marker);
        bounds.push([lat, lng]);
    });

    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
    }
};

const focusMap = (item: any) => {
    const mapConfig = normalizedConfig.value;
    const gpsCol = mapConfig.gps_column;
    const coords = getCoordinates(item, gpsCol);

    if (coords && map) {
        map.setView(coords, 18);
    }
};

watch(() => props.data, () => {
    updateMarkers();
}, { deep: true });

/**
 * Delegated click listener for Leaflet popups.
 * Leaflet popups are raw HTML in the DOM, so Framework7's router doesn't automatically capture their links.
 */
const handlePopupClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[data-item-id]');
    if (link) {
        const href = link.getAttribute('href');
        if (href) {
            e.preventDefault();
            // Use Framework7 router for internal navigation
            f7.view.main.router.navigate(href);
        }
    }
};

onMounted(() => {
    setTimeout(() => {
        initMap();
    }, 500);
    document.addEventListener('click', handlePopupClick);
});

onUnmounted(() => {
    if (map) {
        map.remove();
        map = null;
    }
    document.removeEventListener('click', handlePopupClick);
});
</script>

<style scoped>
.map-view-container {
    height: 100%;
    overflow: hidden;
}

/* Global styles for dynamic markers (Leaflet renders outside scoped) */
:global(.custom-map-marker) {
    background: transparent;
    border: none;
}

:global(.marker-pin) {
    width: 32px;
    height: 32px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    border: 2px solid white;
}

:global(.marker-pin i) {
    transform: rotate(45deg);
    /* Counter rotate icon */
    margin-top: 2px;
    margin-left: 2px;
}

.map-fab-container {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 1000;
}

.map-locate-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
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
