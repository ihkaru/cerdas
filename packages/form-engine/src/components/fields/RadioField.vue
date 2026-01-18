<template>
  <div class="field-box">
    <label class="field-label">
      {{ field.label }}
      <span v-if="field.required" class="text-color-red">*</span>
    </label>

    <div class="radio-group" :class="{ 'is-disabled': field.readonly }">
      <label v-for="opt in options" :key="getValue(opt)" class="radio-option"
        :class="{ 'is-selected': value === getValue(opt) }">
        <input type="radio" :name="'radio-' + field.name" :value="getValue(opt)" :checked="value === getValue(opt)"
          @change="$emit('update:value', getValue(opt))" :disabled="field.readonly">
        <span class="radio-custom"></span>
        <span class="radio-text">{{ getLabel(opt) }}</span>
      </label>
    </div>

    <div v-if="error" class="field-error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FieldDefinition } from '../../types/schema';

const props = defineProps<{
  field: FieldDefinition;
  value: any;
  error?: string | null;
}>();

defineEmits(['update:value']);

const options = computed(() => props.field.options || []);

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

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-group.is-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.radio-option {
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

.radio-option.is-selected {
  background-color: rgba(var(--f7-theme-color-rgb), 0.1);
  border-color: var(--f7-theme-color);
}

.radio-option input {
  display: none;
}

.radio-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #bdbdbd;
  border-radius: 50%;
  margin-right: 12px;
  position: relative;
  flex-shrink: 0;
}

.radio-option.is-selected .radio-custom {
  border-color: var(--f7-theme-color);
}

.radio-option.is-selected .radio-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background-color: var(--f7-theme-color);
  border-radius: 50%;
}

.radio-text {
  font-size: 15px;
  color: #333;
}

.field-error {
  color: #ff3b30;
  font-size: 12px;
  margin-top: 4px;
}
</style>
