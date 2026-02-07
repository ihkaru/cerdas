<template>
  <div class="field-box">
    <label class="field-label">
      {{ field.label }}
      <span v-if="field.required" class="text-color-red">*</span>
    </label>

    <div class="input-wrapper gps-wrapper">

      <!-- 1. Map / Preview Area -->
      <div v-if="hasLocation" class="map-preview-container">
        <!-- Interactive Map (Online/Cached) -->
        <div :id="`map-${uniqueId}`" class="leaflet-map" v-show="!isOffline"></div>

        <!-- Offline Fallback / Static Placeholder -->
        <div v-if="isOffline" class="offline-placeholder">
          <f7-icon f7="wifi_slash" size="32" class="text-color-gray margin-bottom-half"></f7-icon>
          <span class="text-color-gray size-12">Map unavailable offline</span>
        </div>
      </div>

      <!-- 2. Coordinates Display -->
      <div v-if="hasLocation" class="gps-result display-flex justify-content-space-between align-items-center">
        <div class="gps-stats">
          <div class="stat-row">
            <div class="stat-item">
              <span class="label">Lat</span>
              <span class="val">{{ formatCoordinate(value.coords.latitude) }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Lng</span>
              <span class="val">{{ formatCoordinate(value.coords.longitude) }}</span>
            </div>
          </div>
          <div class="stat-row margin-top-limit">
            <div class="stat-item" v-if="value.coords.accuracy">
              <span class="label">Acc</span>
              <span class="val text-color-blue">±{{ Math.round(value.coords.accuracy) }}m</span>
            </div>
            <div class="stat-item" v-if="value.timestamp">
              <span class="label">Time</span>
              <span class="val">{{ formatTime(value.timestamp) }}</span>
            </div>
          </div>
        </div>

        <!-- Clear Action -->
        <f7-button v-if="!field.readonly" type="button" small fill color="red" class="btn-icon-only"
          @click.stop="clearLocation">
          <f7-icon f7="trash" size="16"></f7-icon>
        </f7-button>
      </div>

      <!-- 3. Main Action Button -->
      <div v-if="!field.readonly" class="action-area">
        <f7-button fill large @click="handleCapture" :loading="loading" preloader class="custom-btn-action"
          :color="hasLocation ? 'gray' : 'primary'" :text-color="hasLocation ? 'black' : 'white'">
          <f7-icon :f7="hasLocation ? 'arrow_clockwise' : 'location_fill'" size="18"
            class="margin-right-half"></f7-icon>
          <span>{{ hasLocation ? 'Update Location' : 'Get Current Location' }}</span>
        </f7-button>
      </div>

      <!-- 4. Directions (Readonly / External) -->
      <f7-button v-if="hasLocation" fill large class="margin-top-half custom-btn-action" color="green"
        @click="openDirections">
        <f7-icon f7="map_fill" size="18" class="margin-right-half"></f7-icon>
        <span>Open in Google Maps</span>
      </f7-button>

      <!-- 5. Empty State (Readonly) -->
      <div v-else-if="field.readonly && !hasLocation" class="padding text-align-center text-color-gray bg-color-white">
        <f7-icon f7="location_slash" size="24" class="margin-bottom-half"></f7-icon>
        <div>No location data</div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="field-error">
        <f7-icon f7="exclamationmark_circle_fill" size="14" class="margin-right-half"></f7-icon>
        {{ error }}
      </div>

      <!-- Friendly System Error -->
      <div v-if="systemError"
        class="field-warning size-12 text-color-orange margin-top-half display-flex align-items-center">
        <f7-icon f7="exclamationmark_triangle_fill" size="12" class="margin-right-half"></f7-icon>
        {{ systemError }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.field-box {
  margin-bottom: 24px;
  padding: 0 16px;
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
  line-height: 1.4;
}

.gps-wrapper {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px;
  overflow: hidden;
  position: relative;
}

/* Map Area */
.map-preview-container {
  height: 180px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
  background: #eee;
  border: 1px solid rgba(0, 0, 0, 0.1);
  position: relative;
}

.leaflet-map {
  width: 100%;
  height: 100%;
  z-index: 1;
}

.offline-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
}

/* Stats Display */
.gps-result {
  margin-bottom: 12px;
  background: white;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #eee;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.gps-stats {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12px;
}

.stat-item .label {
  color: #888;
  font-weight: 500;
  text-transform: uppercase;
  font-size: 10px;
}

.stat-item .val {
  color: #333;
  font-family: 'SF Mono', 'Roboto Mono', monospace;
  font-weight: 600;
}

.margin-top-limit {
  margin-top: 2px;
}

/* Buttons */
.custom-btn-action {
  font-weight: 600;
  text-transform: none;
  font-size: 14px;
  height: 44px;
  border-radius: 8px;
  box-shadow: none;
}

.btn-icon-only {
  height: 36px;
  width: 36px;
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 8px;
}

.field-error {
  color: #ff3b30;
  font-size: 12px;
  margin-top: 8px;
  display: flex;
  align-items: center;
  background: rgba(255, 59, 48, 0.1);
  padding: 6px 10px;
  border-radius: 6px;
}
</style>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
// @ts-ignore
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { FieldDefinition } from '../../types/schema';
import {
  formatCoordinate,
  getCurrentPosition,
  getGeoErrorMessage,
  getGoogleMapsUrl
} from '../../utils/geoUtils';

// ============================================================================
// Props
// ============================================================================

const props = defineProps<{
  field: FieldDefinition;
  value: any;
  error?: string | null;
}>();

const emit = defineEmits(['update:value']);

// ============================================================================
// State
// ============================================================================

const loading = ref(false);
const systemError = ref<string | null>(null);
const uniqueId = Math.random().toString(36).substring(2, 9);
const isOffline = ref(!navigator.onLine);

let map: L.Map | null = null;
let marker: L.Marker | null = null;

// ============================================================================
// Computed
// ============================================================================

const hasLocation = computed(() => {
  return props.value && props.value.coords &&
    typeof props.value.coords.latitude === 'number';
});

// ============================================================================
// Lifecycle & Watchers
// ============================================================================

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  if (hasLocation.value) {
    nextTick(() => initMap(props.value.coords.latitude, props.value.coords.longitude));
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
  destroyMap();
});

watch(() => props.value, (newVal) => {
  if (newVal && newVal.coords) {
    nextTick(() => {
      initMap(newVal.coords.latitude, newVal.coords.longitude);
    });
  } else {
    destroyMap();
  }
}, { deep: true });

// ============================================================================
// Methods
// ============================================================================

const updateOnlineStatus = () => {
  isOffline.value = !navigator.onLine;
  if (!isOffline.value && hasLocation.value) {
    // Re-init map if coming back online
    nextTick(() => initMap(props.value.coords.latitude, props.value.coords.longitude));
  }
};

const handleCapture = async () => {
  if (props.field.readonly) return;

  loading.value = true;
  systemError.value = null;

  try {
    const position = await getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000
    });

    emit('update:value', position);
    f7.toast.show({
      text: 'Location updated',
      closeTimeout: 2000,
      cssClass: 'color-green',
      icon: '<i class="f7-icons">checkmark_alt</i>'
    });

  } catch (e: any) {
    console.error('[GpsField] Capture failed:', e);
    systemError.value = getGeoErrorMessage(e);
    f7.toast.show({
      text: 'Failed to get location',
      closeTimeout: 2000,
      cssClass: 'color-red'
    });
  } finally {
    loading.value = false;
  }
};

const clearLocation = () => {
  emit('update:value', null);
  destroyMap();
};

const openDirections = () => {
  if (hasLocation.value) {
    const { latitude, longitude } = props.value.coords;
    window.open(getGoogleMapsUrl(latitude, longitude), '_blank');
  }
};

const formatTime = (ts: number) => {
  if (!ts) return '-';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ============================================================================
// Map Handling (Leaflet)
// ============================================================================

const initMap = (lat: number, lng: number) => {
  if (isOffline.value) return; // Don't init map if offline

  const mapId = `map-${uniqueId}`;
  const el = document.getElementById(mapId);
  if (!el) return;

  // If map exists, just update view
  if (map) {
    map.setView([lat, lng], 16);
    if (marker) marker.setLatLng([lat, lng]);
    return;
  }

  try {
    // Fix Leaflet Icons
    // Use inline SVG Data URI for guaranteed offline/no-network access

    // Safe Default Icon (Inline SVG Data URI - clean and always works)
    // Simple blue location marker pin
    const iconUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNSIgaGVpZ2h0PSI0MSIgdmlld0JveD0iMCAwIDI1IDQxIj48cGF0aCBmaWxsPSIjMjE5NkYzIiBkPSJNMTIuNSAwQzUuNiAwIDAgNS42IDAgMTIuNWMwIDkuNCAxMi41IDI4LjUgMTIuNSAyOC41UzI1IDIxLjkgMjUgMTIuNUMyNSA1LjYgMTkuNCAwIDEyLjUgMHoiLz48Y2lyY2xlIGZpbGw9IiNmZmYiIGN4PSIxMi41IiBjeT0iMTIuNSIgcj0iNSIvPjwvc3ZnPg==';
    const iconRetinaUrl = iconUrl;
    const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'; // Use CDN for shadow or skip it

    // Default Icon Setup
    const DefaultIcon = L.icon({
      iconUrl,
      iconRetinaUrl,
      // shadowUrl, // Skip shadow for cleaner look/offline
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      // shadowSize: [41, 41]
    });

    // Map Init
    map = L.map(el, {
      center: [lat, lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    // Tile Layer (OSM)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Marker
    marker = L.marker([lat, lng], { icon: DefaultIcon }).addTo(map);

  } catch (e) {
    console.warn('[GpsField] Map init failed:', e);
  }
};

const destroyMap = () => {
  if (map) {
    map.remove();
    map = null;
    marker = null;
  }
};
</script>
