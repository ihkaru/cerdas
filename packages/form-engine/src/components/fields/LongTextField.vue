<template>
  <div class="field-box">
    <div class="field-label-row">
      <label class="field-label">
        {{ field.label }}
        <span v-if="field.required" class="text-color-red">*</span>
      </label>
      <span v-if="maxLength && !field.readonly" class="char-counter" :class="{ 'char-limit-near': charCount > maxLength * 0.9 }">
        {{ charCount }}/{{ maxLength }}
      </span>
    </div>

    <div class="input-wrapper">
      <!-- READ-ONLY MODE: Natural multi-line container displaying complete text -->
      <div v-if="field.readonly" class="custom-readonly-text" :class="{ 'is-empty': !hasValue }">
        {{ hasValue ? String(value) : '— Tidak ada catatan —' }}
      </div>

      <!-- EDITABLE MODE: Auto-expanding textarea -->
      <textarea
        v-else
        ref="textareaRef"
        class="custom-textarea"
        :class="{ 'has-error': !!error }"
        :placeholder="field.placeholder || 'Tulis catatan di sini...'"
        :rows="effectiveRows"
        :maxlength="maxLength"
        :required="field.required"
        @input="onInput"
        @blur="onBlur"
      ></textarea>

      <div v-if="field.hint" class="field-hint">{{ field.hint }}</div>
      <div v-if="error" class="field-error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick } from 'vue';
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

const textareaRef = ref<HTMLTextAreaElement | null>(null);
let emitTimeout: ReturnType<typeof setTimeout> | null = null;

const effectiveRows = computed(() => props.field.config?.rows || 3);
const maxLength = computed(() => props.field.config?.maxLength || undefined);

const hasValue = computed(() => {
  return props.value !== null && props.value !== undefined && String(props.value).trim() !== '';
});

const charCount = computed(() => {
  return props.value ? String(props.value).length : 0;
});

function adjustHeight() {
  const el = textareaRef.value;
  if (!el || props.field.readonly) return;
  // Reset height to compute true scrollHeight
  el.style.height = 'auto';
  const newHeight = Math.max(el.scrollHeight, effectiveRows.value * 24 + 16);
  el.style.height = `${newHeight}px`;
}

onMounted(() => {
  if (textareaRef.value && props.value !== null && props.value !== undefined) {
    textareaRef.value.value = String(props.value);
    nextTick(adjustHeight);
  }
});

watch(() => props.value, (newVal) => {
  if (textareaRef.value && String(newVal ?? '') !== textareaRef.value.value) {
    textareaRef.value.value = String(newVal ?? '');
    nextTick(adjustHeight);
  }
});

const onInput = () => {
  adjustHeight();
  if (emitTimeout) clearTimeout(emitTimeout);
  emitTimeout = setTimeout(() => {
    if (textareaRef.value) {
      emit('update:value', textareaRef.value.value);
    }
  }, 300);
};

const onBlur = () => {
  if (emitTimeout) clearTimeout(emitTimeout);
  if (textareaRef.value) {
    emit('update:value', textareaRef.value.value);
  }
};
</script>

<style scoped>
.field-box {
  margin-bottom: 18px;
  padding: 0 16px;
}

.field-label-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 7px;
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
}

.char-counter {
  font-size: 11px;
  color: #94a3b8;
  font-variant-numeric: tabular-nums;
}

.char-limit-near {
  color: #f59e0b;
  font-weight: 600;
}

.input-wrapper {
  position: relative;
}

.custom-textarea {
  width: 100%;
  min-height: 72px;
  padding: 10px 12px;
  font-size: 15px;
  font-family: inherit;
  color: #1e293b;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  outline: none;
  resize: vertical;
  line-height: 1.5;
  box-sizing: border-box;
  transition: border-color 0.15s ease, background-color 0.15s ease;
  -webkit-appearance: none;
  appearance: none;
}

.custom-textarea:focus {
  border-color: var(--f7-theme-color, #2563eb);
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.custom-textarea.has-error {
  border-color: #ef4444;
  background-color: #fffaf0;
}

/* ── Read-Only Presentation ── */
.custom-readonly-text {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  font-size: 14.5px;
  line-height: 1.55;
  color: #334155;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  word-break: break-word;
  white-space: pre-wrap;
  user-select: text;
  box-sizing: border-box;
}

.custom-readonly-text.is-empty {
  color: #94a3b8;
  font-style: italic;
  font-size: 13px;
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
    margin-bottom: 5px;
    line-height: 1.35;
  }

  .custom-textarea {
    min-height: 64px;
    font-size: 13.5px;
    padding: 8px 10px;
    border-radius: 7px;
  }

  .custom-readonly-text {
    min-height: 38px;
    font-size: 13.5px;
    padding: 8px 10px;
    border-radius: 7px;
    line-height: 1.5;
  }
}
</style>
