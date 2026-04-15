<template>
  <div class="field-box">
    <label class="field-label">
      {{ field.label }}
      <span v-if="field.required" class="text-color-red">*</span>
    </label>

    <div class="input-wrapper">
      <div class="date-input-container" :class="{ 'is-readonly': field.readonly }" @click="openPicker">
        <span class="date-value" :class="{ 'is-placeholder': !displayValue }">
          {{ displayValue || field.placeholder || 'Select...' }}
        </span>
        <f7-icon
          :f7="field.type === 'time' ? 'clock' : field.type === 'datetime' ? 'calendar_badge_clock' : 'calendar'"
          size="18"
          class="date-icon"
        />
      </div>

      <!-- Hidden input for F7 to attach pickers to -->
      <input
        ref="hiddenInputRef"
        type="text"
        class="hidden-picker-input"
        :readonly="true"
      />

      <div v-if="field.hint" class="field-hint">{{ field.hint }}</div>
      <div v-if="error" class="field-error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { f7 } from 'framework7-vue';
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

const hiddenInputRef = ref<HTMLInputElement | null>(null);
const pickerInstance = ref<any>(null);
const calendarInstance = ref<any>(null);

const safeValue = computed(() => props.value ?? '');

const use24h = computed(() => props.field.config?.use24h ?? false);

// Human-readable display value
const displayValue = computed(() => {
  if (!safeValue.value) return '';

  if (props.field.type === 'time') {
    return formatTimeDisplay(safeValue.value);
  }

  const raw = safeValue.value;
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return raw;

  if (props.field.type === 'datetime') {
    const datePart = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = use24h.value
      ? date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
      : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${datePart}, ${timePart}`;
  }

  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
});

const formatTimeDisplay = (val: string) => {
  if (!val) return '';
  const parts = val.split(':');
  let h = parseInt(parts[0] || '0');
  const m = (parts[1] || '00').substring(0, 2);
  if (use24h.value) {
    return `${h.toString().padStart(2, '0')}:${m}`;
  }
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
};

// === F7 Calendar (for date / datetime) ===
const openPicker = () => {
  if (props.field.readonly) return;

  if (props.field.type === 'time') {
    if (pickerInstance.value) pickerInstance.value.open();
    return;
  }

  if (calendarInstance.value) {
    calendarInstance.value.open();
    return;
  }

  const isDateTime = props.field.type === 'datetime';
  const initialValue = safeValue.value ? (() => {
    const raw = safeValue.value;
    const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? [] : [d];
  })() : [];

  calendarInstance.value = f7.calendar.create({
    inputEl: hiddenInputRef.value as HTMLElement,
    openIn: 'customModal',
    animate: true,
    backdrop: true,
    closeOnSelect: !isDateTime,
    timePicker: isDateTime,
    timePicker24h: use24h.value,
    dateFormat: props.field.config?.format || (isDateTime ? 'yyyy-mm-dd HH:mm' : 'yyyy-mm-dd'),
    toolbarCloseText: 'Done',
    value: initialValue,
    on: {
      change: (_calendar: any, val: any) => {
        onCalendarChange(val);
      }
    }
  });

  calendarInstance.value.open();
};

// val[0] is already a Date object returned by F7 Calendar
const onCalendarChange = (val: any) => {
  if (Array.isArray(val) && val.length > 0) {
    const d = val[0];
    if (!(d instanceof Date) || isNaN(d.getTime())) return;

    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');

    if (props.field.type === 'datetime') {
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      emit('update:value', `${year}-${month}-${day} ${hours}:${mins}`);
    } else {
      emit('update:value', `${year}-${month}-${day}`);
    }
  }
};

// === F7 Picker (for time only) ===
const setupTimePicker = () => {
  if (props.field.type !== 'time') return;
  if (pickerInstance.value) {
    pickerInstance.value.destroy();
    pickerInstance.value = null;
  }

  const inputEl = hiddenInputRef.value;
  if (!inputEl) return;

  const hours24 = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const hours12 = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const columns = use24h.value
    ? [
        { values: hours24, textAlign: 'center' },
        { divider: true, content: ':' },
        { values: minutes, textAlign: 'center' },
      ]
    : [
        { values: hours12, textAlign: 'center' },
        { divider: true, content: ':' },
        { values: minutes, textAlign: 'center' },
        { values: ['AM', 'PM'], textAlign: 'center' },
      ];

  pickerInstance.value = f7.picker.create({
    inputEl,
    rotateEffect: true,
    value: parseValueForPicker(safeValue.value),
    cols: columns,
    on: {
      change: (_picker: any, value: any) => {
        const values = value as any[];
        let newValue = '';
        if (use24h.value) {
          newValue = `${values[0]}:${values[1]}`;
        } else {
          let h = parseInt(values[0]);
          const m = values[1];
          const ampm = values[2];
          if (ampm === 'PM' && h < 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
          newValue = `${h.toString().padStart(2, '0')}:${m}`;
        }
        emit('update:value', newValue);
      },
    },
  });
};

const parseValueForPicker = (val: string) => {
  if (!val) return use24h.value ? ['12', '00'] : ['12', '00', 'AM'];
  const parts = val.split(':');
  let h = parseInt(parts[0] || '12');
  const m = (parts[1] || '00').substring(0, 2);

  if (use24h.value) {
    return [h.toString().padStart(2, '0'), m];
  } else {
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return [h.toString().padStart(2, '0'), m, ampm];
  }
};

onMounted(() => {
  if (props.field.type === 'time') {
    setupTimePicker();
  }
});

onUnmounted(() => {
  if (pickerInstance.value) {
    pickerInstance.value.destroy();
    pickerInstance.value = null;
  }
  if (calendarInstance.value) {
    calendarInstance.value.destroy();
    calendarInstance.value = null;
  }
});

watch(() => use24h.value, () => {
  // Destroy and recreate calendar with updated 24h setting
  if (calendarInstance.value) {
    calendarInstance.value.destroy();
    calendarInstance.value = null;
  }
  if (props.field.type === 'time') {
    setTimeout(setupTimePicker, 0);
  }
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

.date-input-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 48px;
  padding: 8px 12px;
  font-size: 16px;
  background-color: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-sizing: border-box;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: border-color 0.15s, background-color 0.15s;
}

.date-input-container:active {
  background-color: #f0f0f0;
}

.date-input-container.is-readonly {
  background-color: #f0f0f0;
  cursor: default;
  pointer-events: none;
  border-color: #ddd;
}

.date-value {
  flex: 1;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date-value.is-placeholder {
  color: #999;
}

.date-icon {
  color: #aaa;
  flex-shrink: 0;
  margin-left: 8px;
}

/* Hidden input strictly for attaching F7 pickers */
.hidden-picker-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
  border: none;
  padding: 0;
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