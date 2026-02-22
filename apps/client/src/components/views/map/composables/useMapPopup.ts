import { getGoogleMapsUrl, maplibregl } from '@cerdas/form-engine';
import { f7 } from 'framework7-vue';
import type { Ref, ShallowRef } from 'vue';
import { getCoordinates, resolvePath } from '../utils/mapCoordinates';

export function useMapPopup(
    mapRef: ShallowRef<maplibregl.Map | null>,
    validLocations: Ref<any[]>,
    normalizedConfig: Ref<any>
) {
    let popup: maplibregl.Popup | null = null;

    const buildPopupHtml = (item: any, lat: number, lng: number) => {
        const mapConfig = normalizedConfig.value;
        const title = resolvePath(item, mapConfig.label) || resolvePath(item, mapConfig.popup_title) || 'Untitled';
        const subtitle = resolvePath(item, mapConfig.subtitle) || resolvePath(item, mapConfig.popup_subtitle) || '';
        const itemId = item.id || item.local_id;

        return `
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
    };

    const handlePointClick = (feature: GeoJSON.Feature, coords: [number, number]) => {
        const map = mapRef.value;
        if (!map) return;

        const itemId = feature.properties?.id;
        const item = validLocations.value.find((x: any) =>
            String(x.id) === String(itemId) || String(x.local_id) === String(itemId)
        );

        if (!item) {
            console.warn('Marker clicked but item not found:', itemId);
            return;
        }

        const [lat, lng] = [coords[1], coords[0]];
        const popupHtml = buildPopupHtml(item, lat, lng);

        if (popup) popup.remove();

        popup = new maplibregl.Popup({ maxWidth: '260px' })
            .setLngLat(coords)
            .setHTML(popupHtml)
            .addTo(map);
    };

    const focusMap = (item: any) => {
        const map = mapRef.value;
        const mapConfig = normalizedConfig.value;
        const gpsCol = mapConfig.gps_column;
        const coords = getCoordinates(item, gpsCol);

        if (coords && map) {
            const [lat, lng] = coords;
            map.flyTo({ center: [lng, lat], zoom: 18 });

            map.once('moveend', () => {
                if (!mapRef.value) return;
                const popupHtml = buildPopupHtml(item, lat, lng);

                if (popup) popup.remove();
                popup = new maplibregl.Popup({ maxWidth: '260px' })
                    .setLngLat([lng, lat])
                    .setHTML(popupHtml)
                    .addTo(mapRef.value);
            });
        }
    };

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

    const setupPopupLinkHandler = () => {
        document.addEventListener('click', handlePopupClick);
    };

    const teardownPopupLinkHandler = () => {
        document.removeEventListener('click', handlePopupClick);
    };

    const destroyPopup = () => {
        if (popup) {
            popup.remove();
            popup = null;
        }
    };

    return {
        handlePointClick,
        focusMap,
        setupPopupLinkHandler,
        teardownPopupLinkHandler,
        destroyPopup,
    };
}
