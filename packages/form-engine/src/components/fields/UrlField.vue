<template>
  <div class="field-box">
    <label class="field-label">
      {{ field.label }}
      <span v-if="field.required" class="text-color-red">*</span>
    </label>

    <div class="input-wrapper">
      <!-- READ-ONLY MODE -->
      <div v-if="field.readonly" class="url-readonly-container">
        <a v-if="value" :href="safeUrl" class="url-button" target="_blank" @click.stop>
          <f7-icon f7="link" size="14" class="margin-right-half"></f7-icon>
          <span>{{ field.config?.display_label || value }}</span>
          <f7-icon f7="arrow_up_right" size="10" class="margin-left-half opacity-60"></f7-icon>
        </a>
        <div v-else class="text-color-gray size-13 italic padding-left-half">— Tautan kosong —</div>
      </div>

      <!-- EDITABLE MODE -->
      <template v-else>
        <div class="input-actions-row display-flex justify-content-between align-items-center margin-bottom-half">
          <div class="display-flex gap-5">
            <f7-link small class="action-link" color="blue" @click="handlePaste">
              <f7-icon f7="doc_on_clipboard" size="12" class="margin-right-half"></f7-icon>
              Tempel
            </f7-link>
            <span class="v-separator"></span>
            <f7-link small class="action-link" :color="isValidUrl ? 'green' : 'gray'" :disabled="!isValidUrl" @click="handleTestLink">
              <f7-icon f7="arrow_up_right_circle" size="12" class="margin-right-half"></f7-icon>
              Tes Tautan
            </f7-link>
          </div>
        </div>

        <input ref="inputRef" class="custom-input" :class="{ 'has-error': !!error || !isValidInput }" type="url" :placeholder="field.placeholder || 'https://example.com'" @input="onInput"
          @blur="onBlur" :required="field.required" />
      </template>

      <div v-if="field.hint" class="field-hint">{{ field.hint }}</div>
      <div v-if="error" class="field-error">{{ error }}</div>
      <div v-else-if="!isValidInput && !field.readonly" class="field-error">Format tautan tidak valid (harus dimulai dengan http:// atau https://)</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { FieldDefinition } from '../../types/schema';

const props = withDefaults(defineProps<{
  field: FieldDefinition;
  value?: string | number | null;
  error?: string | null;
}>(), {
  value: '',
  error: null,
});

const emit = defineEmits(['update:value']);

// URL Validation and safety formatting
const safeUrl = computed(() => {
  if (!props.value) return '';
  const urlStr = String(props.value).trim();
  if (/^https?:\/\//i.test(urlStr)) return urlStr;
  return `https://${urlStr}`;
});

const isValidUrl = computed(() => {
  if (!props.value) return false;
  const urlStr = String(props.value).trim();
  // Simple validation for test button
  return /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(urlStr) || /^[^\s/$.?#].[^\s]*$/i.test(urlStr);
});

const isValidInput = computed(() => {
  if (!props.value) return true; // Empty is valid unless required (handled by form engine)
  const urlStr = String(props.value).trim();
  return /^https?:\/\//i.test(urlStr);
});

// Clipboard paste helper
const handlePaste = async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text && inputRef.value) {
      inputRef.value.value = text;
      onInput();
    }
  } catch (err) {
    console.warn('Clipboard read failed, showing fallback dialog', err);
    import('framework7-vue').then(({ f7 }) => {
      f7.dialog.alert('Gunakan pintasan Ctrl+V atau tekan lama kolom input untuk menempelkan tautan.', 'Tempel Tautan');
    });
  }
};

const handleTestLink = () => {
  if (isValidUrl.value && props.value) {
    window.open(safeUrl.value, '_blank');
  }
};

// Template ref for direct DOM manipulation (Performance / Zero Typing Lag)
const inputRef = ref<HTMLInputElement | null>(null);
let emitTimeout: ReturnType<typeof setTimeout> | null = null;

onMounted(() => {
  if (inputRef.value && props.value !== null && props.value !== undefined) {
    inputRef.value.value = String(props.value);
  }
});

watch(() => props.value, (newVal) => {
  if (inputRef.value && String(newVal ?? '') !== inputRef.value.value) {
    inputRef.value.value = String(newVal ?? '');
  }
});

const onInput = () => {
  if (emitTimeout) clearTimeout(emitTimeout);
  emitTimeout = setTimeout(() => {
    if (inputRef.value) {
      emit('update:value', inputRef.value.value);
    }
  }, 300);
};

const onBlur = () => {
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
  -webkit-appearance: none;
  appearance: none;
  box-sizing: border-box;
}

.custom-input:focus {
  border-color: var(--f7-theme-color);
  background-color: #fff;
}

.custom-input.has-error {
  border-color: #ff3b30;
  background-color: #fffbfa;
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

/* Premium Tautan Card Button (Readonly) */
.url-readonly-container {
  padding: 4px 0;
}

.url-button {
  display: inline-flex;
  align-items: center;
  padding: 10px 16px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #2563eb;
  font-size: 13.5px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s, border-color 0.15s;
}

.url-button:hover {
  background: #dbeafe;
  border-color: #93c5fd;
}

.margin-right-half {
  margin-right: 6px;
}

.margin-left-half {
  margin-left: 6px;
}

.padding-left-half {
  padding-left: 4px;
}

.input-actions-row {
  margin-bottom: 6px;
}

.action-link {
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
}

.v-separator {
  width: 1px;
  height: 12px;
  background: #cbd5e1;
  align-self: center;
}

.gap-5 {
  gap: 8px;
}
</style>
