<template>
  <div class="field-box">
    <label class="field-label">
      {{ field.label }}
      <span v-if="field.required" class="text-color-red">*</span>
    </label>

    <div class="input-wrapper">
      <!-- Use native input without v-model to avoid reactivity overhead -->
      <input ref="inputRef" class="custom-input" type="text" :placeholder="field.placeholder" @input="onInput"
        @blur="onBlur" :required="field.required" :readonly="field.readonly" />
      <div v-if="error" class="field-error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
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

// Template ref for direct DOM manipulation - bypasses Vue reactivity for zero overhead
const inputRef = ref<HTMLInputElement | null>(null);
let emitTimeout: ReturnType<typeof setTimeout> | null = null;

// Set initial value after mount (direct DOM access)
onMounted(() => {
  if (inputRef.value && props.value != null) {
    inputRef.value.value = String(props.value);
  }
});

// NOTE: Watch props.value to handle external updates (e.g. navigation)
// We check equality to avoid interrupting typing loop
import { watch } from 'vue';

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

.custom-input[readonly] {
  background-color: #f0f0f0;
  color: #666;
  border-color: #ddd;
  pointer-events: none;
}

.field-error {
  color: #ff3b30;
  font-size: 12px;
  margin-top: 4px;
}
</style>
