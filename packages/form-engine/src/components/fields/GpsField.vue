<template>
  <div class="field-box">
    <label class="field-label">
      {{ field.label }}
      <span v-if="field.required" class="text-color-red">*</span>
    </label>

    <div class="input-wrapper gps-wrapper">
      <!-- Maps Preview Container -->
      <div v-if="value && value.coords" class="map-preview-container">
        <div :id="`map-${uniqueId}`" class="leaflet-map"></div>
      </div>

      <!-- Result Display -->
      <div v-if="value" class="gps-result display-flex justify-content-space-between align-items-center">
        <div class="gps-coords">
          <div class="coord-item">
            <span class="label">Lat:</span>
            <span class="val">{{ value.coords?.latitude?.toFixed(6) }}</span>
          </div>
          <div class="coord-item">
            <span class="label">Lng:</span>
            <span class="val">{{ value.coords?.longitude?.toFixed(6) }}</span>
          </div>
          <div class="coord-item" v-if="value.coords?.accuracy">
            <span class="label">Acc:</span>
            <span class="val">{{ value.coords?.accuracy?.toFixed(1) }}m</span>
          </div>
        </div>
        <f7-button v-if="!field.readonly" type="button" small fill color="red" class="btn-clear"
          @click.stop="clearLocation">
          <f7-icon f7="trash" size="16"></f7-icon>
        </f7-button>
      </div>

      <!-- Action Button -->
      <!-- If Readonly, we just show state, no button or disabled button -->
      <f7-button v-if="!field.readonly" fill large @click="captureLocation" :loading="loading" preloader
        class="custom-btn-action" :color="value ? 'gray' : 'primary'">
        <f7-icon f7="location_fill" size="18" class="margin-right-half"></f7-icon>
        <span>{{ value ? 'Update Location' : 'Get Current Location' }}</span>
      </f7-button>

      <!-- Directions Button -->
      <f7-button v-if="value && value.coords" fill large class="margin-top-half custom-btn-action" color="green"
        @click="openGoogleMaps">
        <f7-icon f7="map_fill" size="18" class="margin-right-half"></f7-icon>
        <span>Get Directions</span>
      </f7-button>

      <div v-else-if="!value" class="padding text-align-center text-color-gray bg-color-white">
        No Location Data
      </div>

      <div v-if="error" class="field-error">{{ error }}</div>
      <div v-if="devError" class="field-warning size-12 text-color-orange margin-top-half">{{ devError }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Geolocation } from '@capacitor/geolocation';
import { f7 } from 'framework7-vue';
// @ts-ignore removed
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import type { FieldDefinition } from '../../types/schema';

// Fix Leaflet Default Icon Issue in Webpack/Vite
// Use online icons or local assets if strictly offline. For now using CDN for reliability in dev.
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const props = defineProps<{
  field: FieldDefinition;
  value: any;
  error?: string | null;
}>();

const emit = defineEmits(['update:value']);
const loading = ref(false);
const devError = ref<string | null>(null);
const uniqueId = Math.random().toString(36).substr(2, 9);
let map: L.Map | null = null;
let marker: L.Marker | null = null;

const captureLocation = async () => {
  loading.value = true;
  devError.value = null;

  try {
    // 1. Check & Request Permissions explicitly
    const permStatus = await Geolocation.checkPermissions();
    if (permStatus.location !== 'granted') {
      const request = await Geolocation.requestPermissions();
      if (request.location !== 'granted') {
        throw new Error('Location permission denied');
      }
    }

    let coordinates;
    try {
      // 2. Try High Accuracy First (GPS) - 5s timeout
      coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 5000
      });
    } catch (err) {
      console.warn('High accuracy GPS failed, falling back to network...', err);
      // 3. Fallback to Low Accuracy (Network/Wifi) - Much faster indoors
      coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 10000
      });
    }

    if (!coordinates || !coordinates.coords) throw new Error('No coordinates received');

    emit('update:value', coordinates);

    // Auto-init map after update
    nextTick(() => {
      initOrUpdateMap(coordinates.coords.latitude, coordinates.coords.longitude);
    });

    f7.toast.show({ text: 'Location updated', closeTimeout: 2000, cssClass: 'color-green' });

  } catch (e: any) {
    console.error('GPS Error:', e);
    // User friendly error handling
    let msg = 'Failed to get location';
    if (e.message?.includes('permission')) msg = 'Permission denied. Please enable Location.';
    else if (e.message?.includes('timeout')) msg = 'GPS Timeout. Try outdoors.';

    f7.dialog.alert(msg, 'GPS Error');

    // Fallback/Warning for Laptop testing if needed
    devError.value = `Error: ${e.message || JSON.stringify(e)}`;
  } finally {
    loading.value = false;
  }
};

const clearLocation = () => {
  emit('update:value', null);
  if (map) {
    map.remove();
    map = null;
    marker = null;
  }
};

const openGoogleMaps = () => {
  if (props.value && props.value.coords) {
    const { latitude, longitude } = props.value.coords;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, '_blank');
  }
};

const initOrUpdateMap = (lat: number, lng: number) => {
  const mapId = `map-${uniqueId}`;
  const el = document.getElementById(mapId);

  if (!el) return;

  if (!map) {
    map = L.map(mapId, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false, // Cleaner look
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);
  } else {
    map.setView([lat, lng], 15);
  }

  if (marker) {
    marker.setLatLng([lat, lng]);
  } else {
    marker = L.marker([lat, lng]).addTo(map);
  }

  // Force map resize check
  setTimeout(() => {
    map?.invalidateSize();
  }, 200);
};

// Watch value to render map if initial data exists
watch(() => props.value, (newVal) => {
  if (newVal && newVal.coords) {
    nextTick(() => {
      initOrUpdateMap(newVal.coords.latitude, newVal.coords.longitude);
    });
  }
}, { immediate: true });

onBeforeUnmount(() => {
  if (map) {
    map.remove();
  }
});
</script>

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
}

.map-preview-container {
  height: 150px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
  background: #eee;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.leaflet-map {
  width: 100%;
  height: 100%;
  z-index: 1;
}

.gps-result {
  margin-bottom: 12px;
  background: white;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #eee;
}

.gps-coords {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.coord-item {
  font-size: 13px;
  display: flex;
  gap: 6px;
}

.coord-item .label {
  color: #888;
  font-weight: 500;
  width: 30px;
}

.coord-item .val {
  color: #333;
  font-family: monospace;
  font-weight: 600;
}

.custom-btn-action {
  font-weight: 600;
  text-transform: none;
  font-size: 14px;
  height: 44px;
  border-radius: 8px;
}

.btn-clear {
  height: 32px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.field-error {
  color: #ff3b30;
  font-size: 12px;
  margin-top: 8px;
}
</style>
