import { getCurrentPosition, maplibregl } from '@cerdas/form-engine';
import { f7 } from 'framework7-vue';
import { ref, type ShallowRef } from 'vue';

export function useMapUserLocation(mapRef: ShallowRef<maplibregl.Map | null>) {
    const locating = ref(false);
    let userMarker: maplibregl.Marker | null = null;

    const locateUser = async () => {
        const map = mapRef.value;
        if (!map) return;
        locating.value = true;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pos = await getCurrentPosition({ enableHighAccuracy: true }) as any;
            const { latitude, longitude } = pos.coords;

            if (userMarker) {
                userMarker.setLngLat([longitude, latitude]);
            } else {
                // Create a blue dot marker for user location
                const el = document.createElement('div');
                el.className = 'user-location-marker';
                userMarker = new maplibregl.Marker({ element: el })
                    .setLngLat([longitude, latitude])
                    .addTo(map);
            }
            map.flyTo({ center: [longitude, latitude], zoom: 16 });
        } catch (e) {
            console.error('Failed to locate user:', e);
            f7.toast.show({
                text: 'Gagal mendapatkan lokasi',
                closeTimeout: 2000,
                cssClass: 'color-red'
            });
        } finally {
            locating.value = false;
        }
    };

    const destroyUserLocation = () => {
        if (userMarker) {
            userMarker.remove();
            userMarker = null;
        }
    };

    return {
        locating,
        locateUser,
        destroyUserLocation
    };
}
