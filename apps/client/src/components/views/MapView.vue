<template>
    <div class="map-view-container display-flex flex-direction-column height-100">
        <MapContainer :mapId="mapId" :mapLoading="mapLoading" :isProcessing="isProcessing"
            :processProgress="processProgress" :validLocations="validLocations" :currentStyle="currentStyle"
            :locating="locating" @toggle-style="toggleMapStyle" @locate="locateUser" />
        <MapListPanel :validLocations="validLocations" :normalizedConfig="normalizedConfig"
            :markerStyleFn="markerStyleFn" @focus-item="focusMap" />
    </div>
</template>

<script setup lang="ts">
import { maplibregl } from '@cerdas/form-engine';
import 'maplibre-gl/dist/maplibre-gl.css';
import { computed, onMounted, onUnmounted, toRaw } from 'vue';
import MapContainer from './map/components/MapContainer.vue';
import MapListPanel from './map/components/MapListPanel.vue';
import { useMapGeoJson } from './map/composables/useMapGeoJson';
import { useMapInstance } from './map/composables/useMapInstance';
import { useMapLayers } from './map/composables/useMapLayers';
import { useMapPopup } from './map/composables/useMapPopup';
import { useMapUserLocation } from './map/composables/useMapUserLocation';
import { getCoordinates } from './map/utils/mapCoordinates';

const props = defineProps<{
    config: any;
    data: any[];
    contextId?: string;
}>();

// eslint-disable-next-line sonarjs/pseudo-random
const mapId = `map-${Math.random().toString(36).substr(2, 9)}`;

// Config Parsing
const normalizedConfig = computed(() => {
    // Utility to find a block containing any of the target keys, digging into .config/options
    const findBlock = (root: any, targetKeys: string[]): any => {
        if (!root || typeof root !== 'object') return null;
        if (targetKeys.some(k => k in root)) return root;
        if (root.map) return root.map; // Fast path for map
        if (root.config) return findBlock(root.config, targetKeys);
        if (root.options) return findBlock(root.options, targetKeys);
        return null;
    };

    const targetKeys = ['gps_column', 'latitude_column', 'marker_style_fn'];
    const mapCfg = findBlock(props.config, targetKeys) || {};

    // Ensure critical fields are available at the top level with fallbacks
    return {
        ...mapCfg,
        gps_column: mapCfg.gps_column || mapCfg.latitude_column,
        label: mapCfg.label || mapCfg.popup_title,
        subtitle: mapCfg.subtitle || mapCfg.popup_subtitle
    };
});

const markerStyleFn = computed(() => {
    const fnBody = normalizedConfig.value.marker_style_fn;
    if (!fnBody) return null;
    try {
        /* eslint-disable-next-line sonarjs/code-eval */
        return new Function('data', 'item', 'ctx', fnBody);
    } catch (e) {
        console.error('Invalid marker logic:', e);
        return null;
    }
});

const validLocations = computed(() => {
    // PERFORMANCE: Use toRaw to avoid Proxy overhead when iterating 30k+ items
    const rawData = toRaw(props.data);
    const mapConfig = normalizedConfig.value;
    const gpsCol = mapConfig.gps_column;
    if (!gpsCol) {
        return [];
    }
    const result = rawData.filter(item => {
        // Simple filter remains synchronous as it is fast
        return getCoordinates(item, gpsCol) !== null;
    });
    return result;
});

// Composables Setup
const { mapRef, mapLoading, currentStyle, toggleMapStyle, initMap, destroyMapInstance } = useMapInstance(mapId, {
    onLoad: () => {
        addSourceAndLayers();
        setupClickHandlers();
    },
    onStyleChange: () => addSourceAndLayers()
});

const { locating, locateUser, destroyUserLocation } = useMapUserLocation(mapRef);

const { handlePointClick, focusMap, setupPopupLinkHandler, teardownPopupLinkHandler, destroyPopup } = useMapPopup(
    mapRef,
    validLocations,
    normalizedConfig
);

const { addSourceAndLayers, fitBoundsToData, setupClickHandlers } = useMapLayers(mapRef, {
    updateGeoJsonSourceAsync: () => updateGeoJsonSourceAsync(),
    onClusterClick: (clusterId, coords) => {
        const map = mapRef.value;
        if (!map) return;
        const source = map.getSource('markers-source') as maplibregl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
            map.easeTo({ center: coords, zoom });
        });
    },
    onPointClick: (feature, coords) => handlePointClick(feature, coords)
});

const { isProcessing, processProgress, updateGeoJsonSourceAsync, setupDataWatcher } = useMapGeoJson(
    mapRef,
    validLocations,
    normalizedConfig,
    markerStyleFn,
    fitBoundsToData
);

// Setup Watcher
const dataRef = computed(() => props.data);
setupDataWatcher(dataRef);

// Lifecycle
let initTimeout: any = null;
onMounted(() => {
    initTimeout = setTimeout(() => {
        // Safety check: ensure the container still exists in the DOM after the delay
        if (document.getElementById(mapId)) {
            initMap();
        }
    }, 300);
    setupPopupLinkHandler();
});

onUnmounted(() => {
    if (initTimeout) clearTimeout(initTimeout);
    destroyPopup();
    destroyUserLocation();
    destroyMapInstance();
    teardownPopupLinkHandler();
});
</script>

<style scoped>
.map-view-container {
    height: 100%;
    overflow: hidden;
}
</style>
