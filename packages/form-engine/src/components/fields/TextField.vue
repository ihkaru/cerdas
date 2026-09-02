<template>
  <div class="field-box">
    <label class="field-label">
      {{ field.label }}
      <span v-if="field.required" class="text-color-red">*</span>
    </label>

    <div class="input-wrapper">
      <!-- Read-Only Mode: Natural wrapping container displaying complete text -->
      <div v-if="field.readonly" class="custom-input-readonly">
        {{ (value !== null && value !== undefined && String(value).trim() !== '') ? String(value) : '—' }}
      </div>

      <!-- Editable Mode: Native input -->
      <input v-else ref="inputRef" class="custom-input" type="text" :placeholder="field.placeholder" @input="onInput"
        @blur="onBlur" :required="field.required" />

      <!-- Smart Detection Helper -->
      <div v-if="detectedCoords && !field.readonly"
        class="coord-detected-tip margin-top-half display-flex flex-direction-column">
        <div class="display-flex align-items-center text-color-blue margin-bottom-half">
          <f7-icon f7="compass" size="14" class="margin-right-half"></f7-icon>
          <span class="size-12 font-weight-bold">Koordinat terdeteksi</span>
        </div>
        <div class="display-flex align-items-center gap-10">
          <f7-link small class="size-12" color="blue" @click="handleSwitchToGps">
            Gunakan Komponen Peta
          </f7-link>
          <div class="v-separator"></div>
          <f7-link small class="size-12" color="green" @click="openDirections">
            <f7-icon f7="map_fill" size="12" class="margin-right-half"></f7-icon>
            Buka Petunjuk Arah
          </f7-link>
        </div>
      </div>

      <div v-if="field.hint" class="field-hint">{{ field.hint }}</div>
      <div v-if="error" class="field-error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { FieldDefinition } from '../../types/schema';
import { parseCoordsString, getGoogleMapsUrl } from '../../utils/geoUtils';

const props = withDefaults(defineProps<{
  field: FieldDefinition;
  value?: string | number | null;
  error?: string | null;
}>(), {
  value: '',
  error: null,
});

const emit = defineEmits(['update:value']);

// Smart Coordinate Detection
const detectedCoords = computed(() => {
  if (typeof props.value !== 'string' || props.field.type === 'gps') return null;
  return parseCoordsString(props.value);
});

const handleSwitchToGps = () => {
  // We can't actually change the field type in the parent from here easily
  // without a "Force GPS Mode" flag in the field config.
  // But for now, we'll suggest using GpsField or auto-fix the type in local state if possible.
  // Actually, let's just emit a special event or alert the user.
  import('framework7-vue').then(({ f7 }) => {
    f7.dialog.confirm(
      'Ubah tampilan kolom ini menjadi Peta?',
      'Deteksi Koordinat',
      () => {
        // Technically this should be handled by the parent (FormRenderer/FieldRenderer)
        // by updating the schema. For now, we'll emit an event that parent can listen to.
        // But the easiest "fix" is telling the user they forgot to set the type in Editor.
        f7.dialog.alert('Silakan ubah tipe kolom ini menjadi "GPS Location" di Editor untuk tampilan peta permanen.', 'Info');
      }
    );
  });
};

const openDirections = () => {
  if (detectedCoords.value) {
    const { latitude, longitude } = detectedCoords.value.coords;
    window.open(getGoogleMapsUrl(latitude, longitude), '_blank');
  }
};

// Template ref for direct DOM manipulation - bypasses Vue reactivity for zero overhead
const inputRef = ref<HTMLInputElement | null>(null);
let emitTimeout: ReturnType<typeof setTimeout> | null = null;

// Set initial value after mount (direct DOM access)
onMounted(() => {
  if (inputRef.value && props.value !== null && props.value !== undefined) {
    inputRef.value.value = String(props.value);
  }
});

// NOTE: Watch props.value to handle external updates (e.g. navigation)
// We check equality to avoid interrupting typing loop

watch(() => props.value, (newVal) => {
  if (inputRef.value && String(newVal ?? '') !== inputRef.value.value) {
    inputRef.value.value = String(newVal ?? '');
  }
});

const onInput = () => {
  const start = performance.now();
  // Don't emit on every keystroke - just debounce heavily
  if (emitTimeout) clearTimeout(emitTimeout);
  emitTimeout = setTimeout(() => {
    const emitStart = performance.now();
    if (inputRef.value) {
      emit('update:value', inputRef.value.value);
    }
    console.warn(`[PERF] TextField.emit took ${(performance.now() - emitStart).toFixed(2)}ms`);
  }, 500); // Only emit after 500ms of no typing
  console.warn(`[PERF] TextField.onInput took ${(performance.now() - start).toFixed(2)}ms`);
};

const onBlur = () => {
  // Always emit on blur (user left the field)
  if (emitTimeout) clearTimeout(emitTimeout);
  if (inputRef.value) {
    emit('update:value', inputRef.value.value);
  }
};
</script>


<style scoped>
.field-box {
  margin-bottom: 20px;
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

.input-wrapper {
  position: relative;
}

.custom-input {
  width: 100%;
  height: 48px;
  padding: 8px 12px;
  font-size: 16px;
  color: #333;
  background-color: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  /* Removed transition to eliminate input lag */
  -webkit-appearance: none;
  appearance: none;
  box-sizing: border-box;
}

.custom-input:focus {
  border-color: var(--f7-theme-color);
  background-color: #fff;
}

.custom-input-readonly {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  font-size: 14.5px;
  color: #334155;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
  user-select: text;
  box-sizing: border-box;
}

@media (max-width: 480px) {
  .field-box {
    margin-bottom: 12px;
    padding: 0 14px;
  }

  .field-label {
    font-size: 13px;
    margin-bottom: 5px;
    line-height: 1.35;
  }

  .custom-input {
    height: 40px;
    font-size: 13.5px;
    padding: 6px 10px;
    border-radius: 7px;
  }

  .custom-input-readonly {
    min-height: 38px;
    font-size: 13.5px;
    padding: 7px 10px;
    border-radius: 7px;
    line-height: 1.45;
  }
}

.field-error {
  color: #ff3b30;
  font-size: 12px;
  margin-top: 4px;
}

.field-hint {
  color: #666;
  font-size: 12px;
  margin-top: 4px;
}

.coord-detected-tip {
  background: #e3f2fd;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #bbdefb;
}

.margin-top-half {
  margin-top: 8px;
}

.v-separator {
  width: 1px;
  height: 12px;
  background: #bbdefb;
}

.gap-10 {
  gap: 10px;
}

.margin-bottom-half {
  margin-bottom: 4px;
}
</style>
