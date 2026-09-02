<template>
  <div class="field-box">
    <label class="field-label">
      {{ field.label }}
      <span v-if="field.required" class="text-color-red">*</span>
    </label>

    <!-- READ-ONLY MODE: High-signal, clean single card for the chosen answer -->
    <div v-if="field.readonly" class="radio-readonly-box" :class="{ 'is-empty': !hasSelectedValue }">
      <div v-if="hasSelectedValue" class="selected-badge">
        <span class="badge-dot"></span>
        <span class="badge-text">{{ selectedLabel }}</span>
      </div>
      <span v-else class="text-color-gray italic size-13">— Belum dipilih —</span>
    </div>

    <!-- EDITABLE MODE: Smart grid (inline side-by-side for short options like Ya/Tidak, vertical for multi-line) -->
    <div v-else class="radio-group" :class="{ 'radio-group--inline': isShortOptions }">
      <label
        v-for="opt in options"
        :key="getValue(opt)"
        class="radio-option"
        :class="{
          'is-selected': value === getValue(opt),
          'radio-option--inline': isShortOptions
        }"
      >
        <input
          type="radio"
          :name="'radio-' + field.name"
          :value="getValue(opt)"
          :checked="value === getValue(opt)"
          @change="$emit('update:value', getValue(opt))"
        >
        <span class="radio-custom"></span>
        <span class="radio-text">{{ getLabel(opt) }}</span>
      </label>
    </div>

    <div v-if="field.hint" class="field-hint">{{ field.hint }}</div>
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

const hasSelectedValue = computed(() => {
  return props.value !== null && props.value !== undefined && props.value !== '';
});

const selectedLabel = computed(() => {
  if (!hasSelectedValue.value) return '';
  const match = options.value.find(opt => String(getValue(opt)) === String(props.value));
  return match ? getLabel(match) : String(props.value);
});

// Automatically arrange short choices (e.g. Ya/Tidak, <= 3 options, each <= 14 chars) side-by-side
const isShortOptions = computed(() => {
  if (options.value.length === 0 || options.value.length > 3) return false;
  return options.value.every((opt: any) => String(getLabel(opt)).trim().length <= 14);
});
</script>

<style scoped>
.field-box {
  margin-bottom: 18px;
  padding: 0 16px;
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
  line-height: 1.4;
}

/* ── Group Layouts ── */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.radio-group--inline {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
}

/* ── Option Card ── */
.radio-option {
  display: flex;
  align-items: flex-start; /* Key: top-aligned with first line of text */
  padding: 10px 12px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.radio-option:active {
  background-color: #f1f5f9;
  transform: scale(0.99);
}

.radio-option--inline {
  justify-content: center;
  align-items: center;
  padding: 9px 8px;
}

.radio-option.is-selected {
  background-color: rgba(var(--f7-theme-color-rgb, 37, 99, 235), 0.08);
  border-color: var(--f7-theme-color, #2563eb);
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.12);
}

.radio-option input {
  display: none;
}

/* ── Circle Indicator ── */
.radio-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #94a3b8;
  border-radius: 50%;
  margin-right: 10px;
  margin-top: 2px; /* Aligns with cap-height of line 1 */
  position: relative;
  flex-shrink: 0;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.radio-option--inline .radio-custom {
  margin-top: 0;
}

.radio-option.is-selected .radio-custom {
  border-color: var(--f7-theme-color, #2563eb);
  background-color: #ffffff;
}

.radio-option.is-selected .radio-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 9px;
  height: 9px;
  background-color: var(--f7-theme-color, #2563eb);
  border-radius: 50%;
}

/* ── Typography ── */
.radio-text {
  font-size: 14.5px;
  line-height: 1.45;
  color: #334155;
  word-break: break-word;
  transition: color 0.15s ease, font-weight 0.15s ease;
}

.radio-option.is-selected .radio-text {
  color: #0f172a;
  font-weight: 600;
}

/* ── Read-Only Container ── */
.radio-readonly-box {
  width: 100%;
  min-height: 42px;
  padding: 9px 12px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.selected-badge {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  color: #1e293b;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
  word-break: break-word;
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--f7-theme-color, #2563eb);
  margin-top: 5px;
  flex-shrink: 0;
}

.field-error {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

.field-hint {
  color: #64748b;
  font-size: 12px;
  margin-top: 4px;
}

/* ── Compact Small Screen Scaling (iPhone SE / <= 480px) ── */
@media (max-width: 480px) {
  .field-box {
    margin-bottom: 12px;
    padding: 0 14px;
  }

  .field-label {
    font-size: 13px;
    margin-bottom: 6px;
    line-height: 1.35;
  }

  .radio-option {
    padding: 8px 10px;
    border-radius: 7px;
  }

  .radio-option--inline {
    padding: 8px;
  }

  .radio-custom {
    width: 17px;
    height: 17px;
    margin-right: 8px;
    margin-top: 1.5px;
  }

  .radio-text {
    font-size: 13.5px;
    line-height: 1.4;
  }

  .radio-readonly-box {
    min-height: 38px;
    padding: 7px 10px;
    border-radius: 7px;
  }

  .selected-badge {
    font-size: 13.5px;
  }
}
</style>
