<template>
  <div class="field-box">
    <label class="field-label">
      {{ field.label }}
      <span v-if="field.required" class="text-color-red">*</span>
    </label>

    <div class="input-wrapper">
      <input class="custom-input" type="date" :value="safeValue" :min="field.min" :max="field.max"
        :required="field.required" :readonly="field.readonly" @input="onInput" />
      <div v-if="error" class="field-error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FieldDefinition } from '../../types/schema';

const props = withDefaults(defineProps<{
  field: FieldDefinition;
  value?: string | null;
  error?: string | null;
}>(), {
  value: '',
  error: null,
});

const emit = defineEmits(['update:value']);

const safeValue = computed(() => props.value ?? '');

const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit('update:value', target.value);
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
