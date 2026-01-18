<template>
  <div :data-field-name="field.name" class="field-wrapper">
    <!-- Section Separator -->
    <f7-block-title v-if="field.type === 'separator'" class="section-title">
      {{ field.label }}
      <span v-if="error" class="text-color-red size-12 display-block">{{ error }}</span>
    </f7-block-title>

    <!-- HTML Block (static content) -->
    <HtmlBlockField v-else-if="field.type === 'html_block'" :field="field" />

    <!-- Nested Form Field (needs context) -->
    <NestedFormField v-else-if="field.type === 'nested' || field.type === 'nested_form'" :field="field"
      v-model:value="modelValue" :error="error" :context="context" :parent-form-data="formData"
      @update:value="$emit('update:value', $event)" />

    <!-- Dynamic Form Fields -->
    <component v-else :is="componentMap[field.type]" :field="field" v-model:value="modelValue" :error="error"
      :context="context" @update:value="$emit('update:value', $event)" />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import type { FieldDefinition } from '../types/schema';
import DateField from './fields/DateField.vue';
import GpsField from './fields/GpsField.vue';
import HtmlBlockField from './fields/HtmlBlockField.vue';
import ImageField from './fields/ImageField.vue';
import NumberField from './fields/NumberField.vue';
import RadioField from './fields/RadioField.vue';
import SelectField from './fields/SelectField.vue';
import TextField from './fields/TextField.vue';

// Async import for larger components
const NestedFormField = defineAsyncComponent(() => import('./fields/NestedFormField.vue'));
const SignatureField = defineAsyncComponent(() => import('./fields/SignatureField.vue'));

const props = defineProps<{
  field: FieldDefinition;
  value: any;
  error?: string | null;
  context?: Record<string, any>;    // Passed down for nested forms
  formData?: Record<string, any>;   // Current form data for nested forms
}>();

const emit = defineEmits(['update:value']);

const modelValue = computed({
  get: () => props.value,
  set: (val) => emit('update:value', val)
});

const componentMap: Record<string, any> = {
  text: TextField,
  number: NumberField,
  select: SelectField,
  date: DateField,
  radio: RadioField,
  image: ImageField,
  gps: GpsField,
  signature: SignatureField,
};
</script>

<style scoped>
.section-title {
  margin-top: 24px;
  margin-bottom: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--f7-theme-color);
  text-transform: none;
  letter-spacing: 0;
}
</style>
