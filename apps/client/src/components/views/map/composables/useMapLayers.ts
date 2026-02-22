import { maplibregl } from '@cerdas/form-engine';
import type { ShallowRef } from 'vue';

export const SOURCE_ID = 'markers-source';
export const CLUSTER_LAYER = 'clusters';
export const CLUSTER_COUNT_LAYER = 'cluster-count';
export const UNCLUSTERED_LAYER = 'unclustered-point';

export function useMapLayers(mapRef: ShallowRef<maplibregl.Map | null>, callbacks: {
    updateGeoJsonSourceAsync: () => void,
    onClusterClick: (clusterId: number, coordinates: [number, number]) => void,
    onPointClick: (feature: GeoJSON.Feature, coordinates: [number, number]) => void,
}) {
    const addSourceAndLayers = () => {
        const map = mapRef.value;
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
        callbacks.updateGeoJsonSourceAsync();

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
    };

    const fitBoundsToData = (geojson: GeoJSON.FeatureCollection) => {
        const map = mapRef.value;
        if (!map || geojson.features.length === 0) return;

        // PERFORMANCE: Sample max 500 points for bounds calculation
        const bounds = new maplibregl.LngLatBounds();
        const limit = Math.min(geojson.features.length, 500);
        const sample = geojson.features.slice(0, limit);

        for (const feature of sample) {
            const coords = (feature.geometry as GeoJSON.Point).coordinates;
            bounds.extend(coords as [number, number]);
        }

        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 50, maxZoom: 16 });
        }
    };

    const setupClickHandlers = () => {
        const map = mapRef.value;
        if (!map) return;

        // Click on cluster → zoom in
        map.on('click', CLUSTER_LAYER, (e) => {
            if (!mapRef.value) return;
            const features = mapRef.value.queryRenderedFeatures(e.point, { layers: [CLUSTER_LAYER] });
            if (!features.length) return;

            const feature = features[0];
            if (!feature) return;
            const clusterId = feature.properties?.cluster_id;
            callbacks.onClusterClick(clusterId, (feature.geometry as GeoJSON.Point).coordinates as [number, number]);
        });

        // Click on individual point → show popup
        map.on('click', UNCLUSTERED_LAYER, (e) => {
            if (!mapRef.value || !e.features?.length) return;
            const feature = e.features[0];
            if (!feature) return;

            const geometry = feature.geometry as GeoJSON.Point;
            const coords = geometry.coordinates.slice() as [number, number];

            callbacks.onPointClick(feature, coords);
        });

        // Cursor changes
        map.on('mouseenter', CLUSTER_LAYER, () => { if (mapRef.value) mapRef.value.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', CLUSTER_LAYER, () => { if (mapRef.value) mapRef.value.getCanvas().style.cursor = ''; });
        map.on('mouseenter', UNCLUSTERED_LAYER, () => { if (mapRef.value) mapRef.value.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', UNCLUSTERED_LAYER, () => { if (mapRef.value) mapRef.value.getCanvas().style.cursor = ''; });
    };

    return {
        addSourceAndLayers,
        fitBoundsToData,
        setupClickHandlers,
    };
}
