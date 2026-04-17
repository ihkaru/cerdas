import { maplibregl } from '@cerdas/form-engine';
import type { ShallowRef } from 'vue';
import { MARKER_ICONS, getMarkerImage } from '../utils/mapMarkers';

export const SOURCE_ID = 'markers-source';
export const CLUSTER_LAYER = 'clusters';
export const CLUSTER_COUNT_LAYER = 'cluster-count';
export const UNCLUSTERED_LAYER = 'unclustered-point';
export const UNCLUSTERED_ICON_LAYER = 'unclustered-icon';

export function useMapLayers(mapRef: ShallowRef<maplibregl.Map | null>, callbacks: {
    updateGeoJsonSourceAsync: () => void,
    onClusterClick: (clusterId: number, coordinates: [number, number]) => void,
    onPointClick: (feature: GeoJSON.Feature, coordinates: [number, number]) => void,
}) {
    const addSourceAndLayers = () => {
        const map = mapRef.value;
        if (!map) return;

        // Load icons if not already loaded
        Object.entries(MARKER_ICONS).forEach(([iconName, _svg]) => {
            const id = `marker-${iconName}`;
            if (map.hasImage(id)) return;

            const img = new Image();
            img.src = getMarkerImage(iconName as any, '#ffffff'); // White icon on colored circle
            img.onload = () => { if (!map.hasImage(id)) map.addImage(id, img); };
        });

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

        // Layer 3: Individual (unclustered) points (Circle Background)
        map.addLayer({
            id: UNCLUSTERED_LAYER,
            type: 'circle',
            source: SOURCE_ID,
            filter: ['!', ['has', 'point_count']],
            paint: {
                'circle-color': ['get', 'markerColor'],
                'circle-radius': [
                    'case',
                    ['==', ['get', 'symbolIcon'], ''], 7, // Default circle
                    12 // Larger background for icons
                ],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
            },
        });

        // Layer 4: Icons (Symbol)
        map.addLayer({
            id: UNCLUSTERED_ICON_LAYER,
            type: 'symbol',
            source: SOURCE_ID,
            filter: [
                'all',
                ['!', ['has', 'point_count']],
                ['!=', ['get', 'symbolIcon'], '']
            ],
            layout: {
                'icon-image': ['get', 'symbolIcon'],
                'icon-size': 0.6,
                'icon-allow-overlap': true,
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
        // Use both point and icon layers for click detection
        const layers = [UNCLUSTERED_LAYER, UNCLUSTERED_ICON_LAYER];
        map.on('click', layers, (e) => {
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
        
        layers.forEach(layer => {
            if (!map) return;
            map.on('mouseenter', layer, () => { if (mapRef.value) mapRef.value.getCanvas().style.cursor = 'pointer'; });
            map.on('mouseleave', layer, () => { if (mapRef.value) mapRef.value.getCanvas().style.cursor = ''; });
        });
    };

    return {
        addSourceAndLayers,
        fitBoundsToData,
        setupClickHandlers,
    };
}
