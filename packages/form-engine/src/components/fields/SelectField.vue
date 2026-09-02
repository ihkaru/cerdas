<template>
  <div class="field-box">
    <label class="field-label">
      {{ field.label }}
      <span v-if="field.required" class="text-color-red">*</span>
    </label>

    <div class="input-wrapper select-wrapper">
      <!-- Read-Only Mode: Display selected label with natural text wrapping -->
      <div v-if="field.readonly" class="custom-input-readonly">
        {{ selectedLabel || '—' }}
      </div>

      <!-- Editable Mode: Native select -->
      <select v-else class="custom-input custom-select" :value="safeValue"
        @change="$emit('update:value', ($event.target as HTMLSelectElement).value)" :required="field.required">
        <option value="" disabled selected>{{ field.placeholder || 'Select an option' }}</option>
        <option v-for="opt in options" :key="getValue(opt)" :value="getValue(opt)">
          {{ getLabel(opt) }}
        </option>
      </select>
      <div v-if="field.hint" class="field-hint">{{ field.hint }}</div>
      <div v-if="error" class="field-error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FieldDefinition } from '../../types/schema';

const props = withDefaults(defineProps<{
  field: FieldDefinition;
  value?: any;
  error?: string | null;
}>(), {
  value: '',
  error: null,
});

defineEmits(['update:value']);

const options = computed(() => props.field.options || []);

// Safe value to handle undefined/null
const safeValue = computed(() => props.value ?? '');

const getValue = (opt: any) => typeof opt === 'object' ? opt.value : opt;
const getLabel = (opt: any) => typeof opt === 'object' ? opt.label : opt;

const selectedLabel = computed(() => {
  if (props.value === null || props.value === undefined || props.value === '') return '';
  const match = options.value.find(opt => String(getValue(opt)) === String(props.value));
  return match ? getLabel(match) : String(props.value);
});
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
  transition: border-color 0.2s, background-color 0.2s;
  -webkit-appearance: none;
  appearance: none;
  box-sizing: border-box;
}

.custom-select {
  padding-right: 32px;
  /* Space for chevron */
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%20fill%3D%22%23999%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 24px;
}

.custom-input:focus {
  border-color: var(--f7-theme-color);
  background-color: #fff;
}

.custom-input:disabled {
  background-color: #f0f0f0;
  color: #666;
  border-color: #ddd;
  pointer-events: none;
  opacity: 1;
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

  .custom-select {
    padding-right: 26px;
    background-size: 18px;
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
</style>
