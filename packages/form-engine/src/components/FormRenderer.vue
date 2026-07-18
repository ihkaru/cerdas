<template>
  <div class="form-container">
    <div class="custom-form-layout">
      <FieldRenderer v-for="field in displayedFields" :key="field.id" :field="field" :value="formData[field.name]"
        :error="errors[field.name]" :context="contextValue" :form-data="formData"
        @update:value="updateField(field.name, $event)" />

      <!-- Sentinel for Progressive Loading -->
      <div ref="sentinel" class="padding-top-half text-align-center" v-if="hasMoreFields">
        <f7-preloader size="24" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Container spacing - minimalistic */
.form-container {
  padding-bottom: 40px;
}

.custom-form-layout {
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* Consistent gap between fields */
}
</style>

<style>
/* Global highlight animation for scroll-to-field */
.highlight-field {
  animation: highlightPulse 2s ease-out;
}

@keyframes highlightPulse {

  0%,
  20% {
    background-color: rgba(255, 193, 7, 0.4);
    box-shadow: 0 0 0 4px rgba(255, 193, 7, 0.3);
    border-radius: 8px;
  }

  100% {
    background-color: transparent;
    box-shadow: none;
  }
}
</style>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, toRef, watch } from 'vue';
import { useFormLogic } from '../composables/useFormLogic';
import { useFormNavigation } from '../composables/useFormNavigation';
import { useFormValidation } from '../composables/useFormValidation';
import type { AppSchema, FieldDefinition } from '../types/schema';
import { executeClosure, defaultUtils } from '../utils/ClosureCompiler';
import { evaluate } from '@cerdas/expression-engine';
import FieldRenderer from './FieldRenderer.vue';

const props = defineProps<{
  schema: AppSchema;
  initialData?: Record<string, unknown>;
  context?: Record<string, unknown>; // Extra context like user, assignment details
  readonly?: boolean;
}>();

const emit = defineEmits(['update:data']);

// --- Refs & Context ---
const contextRef = computed(() => props.context || {});
const contextValue = computed(() => contextRef.value); // For template compatibility
const schemaRef = toRef(props, 'schema');
const renderLimit = ref(8);
const sentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null; // UI Observer for scrolling

// --- 1. Core Logic (State, Visibility, Formulas) ---
const {
  formData,
  errors,
  visibleFields,
  createContext,
  evaluateEffectiveValue,
  initDefaults,
  updateField
} = useFormLogic(schemaRef, props.initialData, contextRef, emit);

// --- 2. Validation Logic ---
const { validate, getValidationSummary } = useFormValidation(
  formData,
  errors,
  visibleFields,
  contextRef,
  evaluateEffectiveValue
);

// --- 3. Navigation ---
const { scrollToField } = useFormNavigation(renderLimit, schemaRef);

// --- 4. UI Logic (Processed Fields & Progressive Rendering) ---

const processedFields = computed(() => {
  return visibleFields.value.slice(0, renderLimit.value).map(field => {
    // 1. Logic for Flags
    const isEditable = evaluateEffectiveValue(field, 'editable_if', true);
    const isRequired = evaluateEffectiveValue(field, 'required_if', !!field.required);

    // 2. Logic for Options (Dynamic Options)
    let effectiveOptions = field.options;
    if (field.options_fn) {
      const ctx = createContext();
      const res = executeClosure(field.options_fn, ctx, []);
      if (Array.isArray(res)) effectiveOptions = res;
    }

    return {
      ...field,
      readonly: props.readonly || !isEditable,
      required: isRequired,
      options: effectiveOptions
    };
  });
});

const displayedFields = computed(() => processedFields.value);

const hasMoreFields = computed(() => {
  return renderLimit.value < visibleFields.value.length;
});

// UI Observer Logic (remains in component as it deals with Refs)
const setupObserver = () => {
  if (observer) observer.disconnect();
  observer = new IntersectionObserver((entries) => {
    if (entries && entries[0] && entries[0].isIntersecting && hasMoreFields.value) {
      renderLimit.value += 20;
    }
  }, { rootMargin: '200px' });
  if (sentinel.value) observer.observe(sentinel.value);
};

watch(hasMoreFields, (val) => {
  if (val) nextTick(setupObserver);
});

onMounted(() => {
  initDefaults();
  setupObserver();
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});

// --- Scrubbing Helpers (visibility-based data cleaning) ---

type ScrubContext = Record<string, unknown>;

const evaluateFieldVisibility = (
  field: FieldDefinition,
  dataObj: Record<string, unknown>,
  parentCtx: ScrubContext
): boolean => {
  const ctx = { row: dataObj, utils: defaultUtils, ...parentCtx };

  if (field.show_if_fn) {
    return !!executeClosure(field.show_if_fn as string, ctx, true);
  }

  const val = field.show_if ?? field.show_if_js;
  if (val === undefined || val === null) return true;
  if (typeof val === 'boolean') return val;
  if (typeof val !== 'string' || val.trim() === '') return true;

  const expr = val.startsWith('=') ? val.substring(1) : val;
  try {
    return !!evaluate(expr, { row: dataObj, ...parentCtx });
  } catch {
    return true;
  }
};

const scrubNestedRows = (
  rows: Record<string, unknown>[],
  childFields: FieldDefinition[],
  parentData: Record<string, unknown>,
  parentCtx: ScrubContext
) => {
  rows.forEach((nestedRow, index) => {
    const nestedCtx: ScrubContext = { ...parentCtx, row: nestedRow, parentRow: parentData, rowIndex: index };
    scrubFields(childFields, nestedRow, nestedCtx);
  });
};

// Forward declaration for mutual recursion
const scrubFields: (fields: FieldDefinition[], dataObj: Record<string, unknown>, ctx: ScrubContext) => void =
  (fields, dataObj, ctx) => {
    if (!dataObj) return;
    fields.forEach(field => {
      if (!evaluateFieldVisibility(field, dataObj, ctx)) {
        delete dataObj[field.name];
        return;
      }
      const isNested = field.type === 'nested' || field.type === 'nested_form';
      const rows = dataObj[field.name];
      if (isNested && field.fields && Array.isArray(rows)) {
        scrubNestedRows(rows as Record<string, unknown>[], field.fields, dataObj, ctx);
      }
    });
  };

/**
 * Returns a deep-copy of formData with values of hidden fields removed.
 * The in-memory formData is NOT mutated, preserving user input until page close.
 */
const getScrubbedData = (): Record<string, unknown> => {
  const cleanData = JSON.parse(JSON.stringify(formData)) as Record<string, unknown>;
  scrubFields(schemaRef.value.fields || [], cleanData, contextRef.value);
  return cleanData;
};

// Expose methods to parent
defineExpose({ validate, getValidationSummary, scrollToField, getScrubbedData });
</script>
