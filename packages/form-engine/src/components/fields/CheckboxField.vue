<template>
  <div class="field-box">
    <label class="field-label">
      {{ field.label }}
      <span v-if="field.required" class="text-color-red">*</span>
    </label>

    <!-- READ-ONLY MODE: Clean chip badges displaying only checked options -->
    <div v-if="field.readonly" class="checkbox-readonly-box" :class="{ 'is-empty': selectedLabels.length === 0 }">
      <div v-if="selectedLabels.length > 0" class="selected-chips-wrap">
        <span v-for="lbl in selectedLabels" :key="lbl" class="selected-chip">
          <span class="chip-check">✓</span>
          {{ lbl }}
        </span>
      </div>
      <span v-else class="text-color-gray italic size-13">— Tidak ada pilihan —</span>
    </div>

    <!-- EDITABLE MODE: Smart grid (inline side-by-side for short choices, vertical for multi-line) -->
    <div v-else class="checkbox-group" :class="{ 'checkbox-group--inline': isShortOptions }">
      <label
        v-for="opt in options"
        :key="getValue(opt)"
        class="checkbox-option"
        :class="{
          'is-selected': isChecked(getValue(opt)),
          'checkbox-option--inline': isShortOptions
        }"
      >
        <input
          type="checkbox"
          :name="'checkbox-' + field.name"
          :value="getValue(opt)"
          :checked="isChecked(getValue(opt))"
          @change="toggleValue(getValue(opt))"
        >
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

const selectedLabels = computed(() => {
  return currentArrayValue.value.map(val => {
    const match = options.value.find(opt => String(getValue(opt)) === String(val));
    return match ? getLabel(match) : String(val);
  });
});

const isShortOptions = computed(() => {
  if (options.value.length === 0 || options.value.length > 4) return false;
  return options.value.every((opt: any) => String(getLabel(opt)).trim().length <= 12);
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
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.checkbox-group--inline {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
}

/* ── Option Card ── */
.checkbox-option {
  display: flex;
  align-items: flex-start; /* Key: top-aligned with line 1 of text */
  padding: 10px 12px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.checkbox-option:active {
  background-color: #f1f5f9;
  transform: scale(0.99);
}

.checkbox-option--inline {
  justify-content: center;
  align-items: center;
  padding: 9px 8px;
}

.checkbox-option.is-selected {
  background-color: rgba(var(--f7-theme-color-rgb, 37, 99, 235), 0.08);
  border-color: var(--f7-theme-color, #2563eb);
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.12);
}

.checkbox-option input {
  display: none;
}

/* ── Checkbox Indicator ── */
.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #94a3b8;
  border-radius: 4px;
  margin-right: 10px;
  margin-top: 2px; /* Aligns with cap-height of line 1 */
  position: relative;
  flex-shrink: 0;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.checkbox-option--inline .checkbox-custom {
  margin-top: 0;
}

.checkbox-option.is-selected .checkbox-custom {
  border-color: var(--f7-theme-color, #2563eb);
  background-color: var(--f7-theme-color, #2563eb);
}

.checkbox-option.is-selected .checkbox-custom::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 1px;
  width: 5px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* ── Typography ── */
.checkbox-text {
  font-size: 14.5px;
  line-height: 1.45;
  color: #334155;
  word-break: break-word;
  transition: color 0.15s ease, font-weight 0.15s ease;
}

.checkbox-option.is-selected .checkbox-text {
  color: #0f172a;
  font-weight: 600;
}

/* ── Read-Only Container ── */
.checkbox-readonly-box {
  width: 100%;
  min-height: 42px;
  padding: 8px 12px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.selected-chips-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.selected-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  font-size: 13px;
  font-weight: 600;
  border-radius: 6px;
  line-height: 1.35;
}

.chip-check {
  font-size: 11px;
  font-weight: 700;
  color: #2563eb;
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

  .checkbox-option {
    padding: 8px 10px;
    border-radius: 7px;
  }

  .checkbox-option--inline {
    padding: 8px;
  }

  .checkbox-custom {
    width: 17px;
    height: 17px;
    margin-right: 8px;
    margin-top: 1.5px;
  }

  .checkbox-text {
    font-size: 13.5px;
    line-height: 1.4;
  }

  .checkbox-readonly-box {
    min-height: 38px;
    padding: 6px 10px;
    border-radius: 7px;
  }

  .selected-chip {
    font-size: 12px;
    padding: 3px 8px;
  }
}
</style>
