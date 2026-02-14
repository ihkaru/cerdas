<template>
    <div class="map-view-container display-flex flex-direction-column height-100">
        <div :id="mapId" class="map-container flex-shrink-0" style="height: 60vh; width: 100%; z-index: 1;"></div>

        <div class="list-container flex-grow-1 overflow-auto bg-color-white">
            <f7-block-title>Locations ({{ validLocations.length }})</f7-block-title>
            <f7-list media-list>
                <f7-list-item v-for="item in validLocations" :key="item.id || item.local_id"
                    :title="resolvePath(item, normalizedConfig.label || normalizedConfig.popup_title || 'name')"
                    :subtitle="resolvePath(item, normalizedConfig.popup_subtitle || 'address')" @click="focusMap(item)"
                    link="#">
                </f7-list-item>
            </f7-list>
        </div>
    </div>
</template>

<script setup lang="ts">
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { computed, onMounted, onUnmounted, watch } from 'vue';

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
}>();

// eslint-disable-next-line sonarjs/pseudo-random
const mapId = `map-${Math.random().toString(36).substr(2, 9)}`;
let map: L.Map | null = null;
let markers: L.LayerGroup | null = null;

const normalizedConfig = computed(() => {
    return props.config.map || props.config.config?.map || props.config.options || {};
});

const toNum = (v: any): number => {
    const n = parseFloat(String(v));
    return isNaN(n) ? NaN : n;
};

const parseLatLongString = (val: any): [number, number] | null => {
    if (typeof val === 'string' && val.includes(',')) {
        const [a, b] = val.split(',');
        const lat = toNum(a), lng = toNum(b);
        if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    }
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

    // Log config to debug
    console.log('Map Config Source:', props.config);
    console.log('Resolved Map Config:', mapConfig);
    console.log('Target GPS Col:', gpsCol);

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
    const val = getDeep(obj, path) ||
        getDeep(obj.response_data, path) ||
        getDeep(obj.data, path);

    if (val !== undefined && val !== null && val !== '') return val;
    return '';
};

const initMap = () => {
    if (map) return;

    map = L.map(mapId).setView([-6.2088, 106.8456], 13);

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
    const titleCol = mapConfig.label || mapConfig.popup_title || 'name';

    // Explicitly type as tuple array for fitBounds
    const bounds: [number, number][] = [];

    validLocations.value.forEach(item => {
        const coords = getCoordinates(item, gpsCol);
        if (!coords) return;

        const [lat, lng] = coords;
        const title = resolvePath(item, titleCol);
        const style = getMarkerStyle(item);

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

        const marker = L.marker([lat, lng], { icon: customIcon })
            .bindPopup(title)
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

onMounted(() => {
    setTimeout(() => {
        initMap();
    }, 500);
});

onUnmounted(() => {
    if (map) {
        map.remove();
        map = null;
    }
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
</style>
