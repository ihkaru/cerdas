import { maplibregl, evaluate } from '@cerdas/form-engine';
import { ref, toRaw, watch, type Ref, type ShallowRef } from 'vue';
import { resolveColor } from '../utils/mapColorResolver';
import { getCoordinates } from '../utils/mapCoordinates';
import { SOURCE_ID } from './useMapLayers';

const CHUNK_SIZE = 2000;

export function useMapGeoJson(
    mapRef: ShallowRef<maplibregl.Map | null>,
    validLocations: Ref<any[]>,
    normalizedConfig: Ref<any>,
    markerStyleFn: Ref<any>,
    fitBoundsToData: (geojson: GeoJSON.FeatureCollection) => void
) {
    const isProcessing = ref(false);
    const processProgress = ref(0);
    let abortController: AbortController | null = null;
    let updateDebounce: ReturnType<typeof setTimeout> | null = null;

    const buildGeoJsonAsync = (signal: AbortSignal): Promise<GeoJSON.FeatureCollection | null> => {
        return new Promise((resolve) => {
            const mapConfig = normalizedConfig.value;
            const gpsCol = mapConfig.gps_column;
            const styleFn = markerStyleFn.value;

            // Use Valid Locations which are already filtered for valid coords
            const rawLocations = toRaw(validLocations.value);
            const total = rawLocations.length;
            const features: GeoJSON.Feature[] = [];

            if (total === 0) {
                resolve({ type: 'FeatureCollection', features: [] });
                return;
            }

            let index = 0;
            // Create a shared context for this GeoJSON build pass
            const evalContext = { items: rawLocations, cache: {} };

            /* eslint-disable-next-line sonarjs/cognitive-complexity */
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
                    let markerColor = resolveColor('orange');
                    let symbolIcon = '';

                    const data = item.response_data || item.data || {};

                    // 1. Check Format Rules (Simple UI)
                    const rules = mapConfig.format_rules || [];
                    for (const rule of rules) {
                        try {
                            if (evaluate(rule.condition, { row: data, item, ctx: evalContext })) {
                                if (rule.style?.color) markerColor = resolveColor(rule.style.color);
                                if (rule.style?.icon) symbolIcon = `marker-${rule.style.icon}`;
                                break; // First match wins
                            }
                        } catch { /* ignore */ }
                    }

                    // 2. Override with markerStyleFn (Advanced JS) if exists
                    if (styleFn) {
                        try {
                            const result = styleFn(data, item, evalContext);
                            if (result?.color) markerColor = resolveColor(result.color);
                            if (result?.icon) symbolIcon = `marker-${result.icon}`;
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
                            symbolIcon,
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

    const updateGeoJsonSourceAsync = async () => {
        if (!mapRef.value) return;

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
                const map = mapRef.value;
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

    const setupDataWatcher = (dataRef: Ref<any[]>) => {
        // Watch for data changes OR config changes (like GPS column or marker styles)
        watch([dataRef, normalizedConfig, markerStyleFn], () => {
            if (updateDebounce) clearTimeout(updateDebounce);
            updateDebounce = setTimeout(() => {
                updateGeoJsonSourceAsync();
            }, 300);
        }, { deep: true });
    };

    return {
        isProcessing,
        processProgress,
        updateGeoJsonSourceAsync,
        setupDataWatcher,
    };
}
