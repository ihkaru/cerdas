/**
 * MapLibre GL JS Utilities
 * Shared map initialization, tile caching, and helpers for MapView + GpsField.
 *
 * Tile Caching Strategy:
 * - Uses maplibregl.addProtocol('cached-tile') to intercept tile requests
 * - Tiles stored in IndexedDB via idb-keyval (persists across app restarts)
 * - Cache-first: serves from IDB if available, fetches from network if not
 * - Works identically in browser (LivePreview) and Capacitor (Android)
 */

import { createStore, get, set } from 'idb-keyval';
import maplibregl from 'maplibre-gl';

// ============================================================================
// Types
// ============================================================================

export interface MapOptions {
    center?: [number, number]; // [lng, lat] — MapLibre uses lng,lat order
    zoom?: number;
    interactive?: boolean;
    attributionControl?: boolean;
    navigationControl?: boolean | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

interface CachedTile {
    data: ArrayBuffer;
    timestamp: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Default center: Jakarta, Indonesia */
const DEFAULT_CENTER: [number, number] = [106.8456, -6.2088];
const DEFAULT_ZOOM = 13;

/** Tile cache TTL: 30 days in milliseconds */
const TILE_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

/** OSM Raster tile URL template */
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

// ============================================================================
// IndexedDB Tile Cache
// ============================================================================

/** Dedicated IDB store for map tiles — separate from app data */
const tileStore = createStore('maplibre-tile-cache', 'tiles');

let protocolRegistered = false;

/**
 * Register the 'cached-tile' protocol with MapLibre.
 * This intercepts tile requests and serves from IndexedDB cache when available.
 * Must be called before creating any map instances.
 */
function registerTileCacheProtocol(): void {
    if (protocolRegistered) return;

    maplibregl.addProtocol('cached-tile', async (params) => {
        // params.url format: cached-tile://https://tile.openstreetmap.org/...
        const actualUrl = params.url.replace('cached-tile://', '');
        const cacheKey = actualUrl;

        try {
            // 1. Check IndexedDB cache
            const cached = await get<CachedTile>(cacheKey, tileStore);

            if (cached && (Date.now() - cached.timestamp) < TILE_CACHE_TTL) {
                // Cache HIT — return from IndexedDB
                return { data: cached.data };
            }

            // 2. Cache MISS or expired — fetch from network
            const response = await fetch(actualUrl);
            if (!response.ok) {
                throw new Error(`Tile fetch failed: ${response.status}`);
            }

            const data = await response.arrayBuffer();

            // 3. Store in IndexedDB for offline use (fire-and-forget)
            set(cacheKey, { data, timestamp: Date.now() } as CachedTile, tileStore)
                .catch(() => { /* Ignore storage errors silently */ });

            return { data };
        } catch (error) {
            // If network fails, try returning stale cache as last resort
            const stale = await get<CachedTile>(cacheKey, tileStore).catch(() => undefined);
            if (stale) {
                return { data: stale.data };
            }
            throw error;
        }
    });

    protocolRegistered = true;
}

// ============================================================================
// Default Map Style
// ============================================================================

/**
 * OSM raster style using the cached-tile protocol.
 * All tile requests go through IndexedDB cache automatically.
 */
function getDefaultStyle(): maplibregl.StyleSpecification {
    return {
        version: 8,
        sources: {
            'osm-tiles': {
                type: 'raster',
                tiles: [`cached-tile://${OSM_TILE_URL}`],
                tileSize: 256,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxzoom: 19,
            },
        },
        layers: [
            {
                id: 'osm-tiles-layer',
                type: 'raster',
                source: 'osm-tiles',
                minzoom: 0,
                maxzoom: 22,
            },
        ],
    };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Create a MapLibre GL map with offline tile caching enabled.
 *
 * @param container - HTML element ID or DOM element
 * @param options - Map configuration
 * @returns MapLibre map instance
 */
export function createMap(
    container: string | HTMLElement,
    options: MapOptions & { style?: maplibregl.StyleSpecification | string } = {},
): maplibregl.Map {
    // Ensure cache protocol is registered
    registerTileCacheProtocol();

    const map = new maplibregl.Map({
        container,
        style: options.style ?? getDefaultStyle(),
        center: options.center ?? DEFAULT_CENTER,
        zoom: options.zoom ?? DEFAULT_ZOOM,
        interactive: options.interactive ?? true,
        attributionControl: options.attributionControl === true ? {} : false,
    });

    // Add navigation control if requested
    if (options.navigationControl !== false) {
        const position = (typeof options.navigationControl === 'string'
            ? options.navigationControl
            : 'bottom-right') as maplibregl.ControlPosition;
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), position);
    }

    return map;
}

/**
 * Properly destroy a map instance and clean up resources.
 */
export function destroyMap(map: maplibregl.Map | null): void {
    if (map) {
        map.remove();
    }
}

// Re-export maplibregl for convenience
export { maplibregl };

