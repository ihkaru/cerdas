<template>
  <div class="field-box">
    <label class="field-label">
      {{ field.label }}
      <span v-if="field.required" class="text-color-red">*</span>
    </label>

    <div class="checkbox-group" :class="{ 'is-disabled': field.readonly }">
      <label v-for="opt in options" :key="getValue(opt)" class="checkbox-option"
        :class="{ 'is-selected': isChecked(getValue(opt)) }">
        <input type="checkbox" :name="'checkbox-' + field.name" :value="getValue(opt)" :checked="isChecked(getValue(opt))"
          @change="toggleValue(getValue(opt))" :disabled="field.readonly">
        <span class="checkbox-custom"></span>
        <span class="checkbox-text">{{ getLabel(opt) }}</span>
      </label>
    </div>

    <div v-if="field.hint" class="field-hint">{{ field.hint }}</div>
    <div v-if="error" class="field-error">{{ error }}</div>
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
  value: () => [],
  error: null,
});

const emit = defineEmits(['update:value']);

const options = computed(() => props.field.options || []);

// Helper to ensure we have an array for value
const currentArrayValue = computed<any[]>(() => {
  if (Array.isArray(props.value)) {
    return props.value;
  }
  if (typeof props.value === 'string') {
    // If it's a comma-separated string, parse it or make array
    return props.value ? props.value.split(',').map(s => s.trim()) : [];
  }
  return [];
});

const isChecked = (val: any) => {
  return currentArrayValue.value.includes(val);
};

const toggleValue = (val: any) => {
  const arr = [...currentArrayValue.value];
  const idx = arr.indexOf(val);
  if (idx > -1) {
    arr.splice(idx, 1);
  } else {
    arr.push(val);
  }
  emit('update:value', arr);
};

const getValue = (opt: any) => typeof opt === 'object' ? opt.value : opt;
const getLabel = (opt: any) => typeof opt === 'object' ? opt.label : opt;
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
  margin-bottom: 12px;
  line-height: 1.4;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-group.is-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.checkbox-option {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.checkbox-option.is-selected {
  background-color: rgba(var(--f7-theme-color-rgb), 0.1);
  border-color: var(--f7-theme-color);
}

.checkbox-option input {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #bdbdbd;
  border-radius: 4px;
  margin-right: 12px;
  position: relative;
  flex-shrink: 0;
}

.checkbox-option.is-selected .checkbox-custom {
  border-color: var(--f7-theme-color);
  background-color: var(--f7-theme-color);
}

.checkbox-option.is-selected .checkbox-custom::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-text {
  font-size: 15px;
  color: #333;
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
