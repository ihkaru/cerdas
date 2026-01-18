<template>
    <div class="map-view-container display-flex flex-direction-column height-100">
        <div :id="mapId" class="map-container flex-shrink-0" style="height: 60vh; width: 100%; z-index: 1;"></div>

        <div class="list-container flex-grow-1 overflow-auto bg-color-white">
            <f7-block-title>Locations ({{ validLocations.length }})</f7-block-title>
            <f7-list media-list>
                <f7-list-item v-for="item in validLocations" :key="item.id || item.local_id"
                    :title="resolvePath(item, config.options.popup_title || 'name')"
                    :subtitle="resolvePath(item, config.options.popup_subtitle || 'address')" @click="focusMap(item)"
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

const mapId = `map-${Math.random().toString(36).substr(2, 9)}`;
let map: L.Map | null = null;
let markers: L.LayerGroup | null = null;

const validLocations = computed(() => {
    const gpsCol = props.config.options?.gps_column;
    if (!gpsCol) return [];

    return props.data.filter(item => {
        const val = resolvePath(item, gpsCol);
        // Simple check: "lat, long"
        return val && val.includes(',') && val.split(',').length === 2;
    });
});

const resolvePath = (obj: any, path: string) => {
    if (!obj || !path) return '';
    let target = obj;
    if (path.startsWith('prelist_data.')) {
        if (typeof obj.prelist_data === 'string') {
            try { target.prelist_data = JSON.parse(obj.prelist_data); } catch { }
        }
    }
    return path.split('.').reduce((acc, part) => acc && acc[part], target) || '';
};

const initMap = () => {
    if (map) return;

    map = L.map(mapId).setView([-6.2088, 106.8456], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
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

const updateMarkers = () => {
    if (!map || !markers) return;
    markers.clearLayers();

    const gpsCol = props.config.options?.gps_column;
    const titleCol = props.config.options?.popup_title || 'name';

    // Explicitly type as tuple array for fitBounds
    const bounds: [number, number][] = [];

    validLocations.value.forEach(item => {
        const val = resolvePath(item, gpsCol);
        const [latStr, lngStr] = val.split(',');
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);

        if (!isNaN(lat) && !isNaN(lng)) {
            const title = resolvePath(item, titleCol);
            const marker = L.marker([lat, lng])
                .bindPopup(title)
                .on('click', () => { });

            markers?.addLayer(marker);
            bounds.push([lat, lng]);
        }
    });

    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
    }
};

const focusMap = (item: any) => {
    const gpsCol = props.config.options?.gps_column;
    const val = resolvePath(item, gpsCol);
    if (!val) return;
    const [lat, lng] = val.split(',').map(parseFloat);
    if (!isNaN(lat) && !isNaN(lng) && map) {
        map.setView([lat, lng], 18);
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
</style>
