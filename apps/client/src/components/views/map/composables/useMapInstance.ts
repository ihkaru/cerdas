import { createMap, destroyMap, maplibregl } from '@cerdas/form-engine';
import { ref, shallowRef } from 'vue';
import { GoogleHybridStyle, GoogleStreetsStyle } from '../utils/mapStyles';

export function useMapInstance(mapId: string, callbacks: { onLoad: () => void, onStyleChange: () => void }) {
    const mapLoading = ref(true);
    const mapRef = shallowRef<maplibregl.Map | null>(null);
    const currentStyle = ref<'satellite' | 'streets'>('satellite');

    const toggleMapStyle = () => {
        const map = mapRef.value;
        if (!map) return;
        const newStyle = currentStyle.value === 'satellite' ? 'streets' : 'satellite';
        currentStyle.value = newStyle;

        const styleConfig = newStyle === 'satellite' ? GoogleHybridStyle : GoogleStreetsStyle;

        // Switch style and re-add layers once loaded
        map.setStyle(styleConfig as any);
        map.once('styledata', () => {
            callbacks.onStyleChange();
        });
    };

    const initMap = () => {
        if (mapRef.value) return;

        mapRef.value = createMap(mapId, {
            navigationControl: 'bottom-right',
            style: GoogleHybridStyle as any, // Default to Hybrid
        });

        mapRef.value.on('load', () => {
            mapLoading.value = false;
            callbacks.onLoad();
        });

        mapRef.value.on('error', () => {
            mapLoading.value = false;
        });
    };

    const destroyMapInstance = () => {
        if (mapRef.value) {
            destroyMap(mapRef.value);
            mapRef.value = null;
        }
    };

    return {
        mapRef,
        mapLoading,
        currentStyle,
        toggleMapStyle,
        initMap,
        destroyMapInstance,
    };
}
