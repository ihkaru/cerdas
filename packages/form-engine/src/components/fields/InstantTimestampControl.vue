<template>
  <div class="instant-timestamp-container">
    <!-- Not yet captured -->
    <f7-button
      v-if="!safeValue && !field.readonly"
      type="button"
      fill
      large
      color="blue"
      class="btn-capture-instant"
      @click="$emit('capture')"
    >
      <f7-icon :f7="pickerIcon" size="20" class="margin-right-half" />
      <span>{{ buttonLabel }}</span>
    </f7-button>

    <!-- Already captured or readonly -->
    <div v-else class="timestamp-card" :class="{ 'is-empty': !safeValue }">
      <div class="timestamp-content">
        <div class="timestamp-badge-row">
          <span v-if="safeValue" class="status-pill" :class="isFieldLocked ? 'pill-locked' : 'pill-recorded'">
            <f7-icon :f7="isFieldLocked ? 'lock_fill' : 'checkmark_alt'" size="12" class="margin-right-2" />
            {{ isFieldLocked ? 'Terkunci' : 'Tercatat' }}
          </span>
          <span v-else class="status-pill pill-empty">Belum Dicatat</span>
        </div>
        <div class="timestamp-display-text" :class="{ 'is-placeholder': !displayValue }">
          {{ displayValue || 'Belum ada waktu yang direkam' }}
        </div>
      </div>

      <!-- Actions if not locked -->
      <div v-if="!isFieldLocked && !field.readonly" class="timestamp-actions">
        <f7-button
          type="button"
          small
          outline
          color="blue"
          class="btn-action-icon"
          title="Ambil Ulang Waktu Sekarang"
          @click.stop="$emit('capture')"
        >
          <f7-icon f7="arrow_clockwise" size="16" />
        </f7-button>
        <f7-button
          v-if="safeValue"
          type="button"
          small
          outline
          color="red"
          class="btn-action-icon margin-left-half"
          title="Hapus Nilai"
          @click.stop="$emit('clear')"
        >
          <f7-icon f7="trash" size="16" />
        </f7-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldDefinition } from '../../types/schema';

defineProps<{
  field: FieldDefinition;
  safeValue: string;
  displayValue: string;
  isFieldLocked: boolean;
  buttonLabel: string;
  pickerIcon: string;
}>();

defineEmits<{
  (e: 'capture'): void;
  (e: 'clear'): void;
}>();
</script>

<style scoped>
.instant-timestamp-container {
  width: 100%;
}

.btn-capture-instant {
  height: 48px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: none;
  box-shadow: 0 2px 6px rgba(33, 150, 243, 0.25);
}

.timestamp-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background-color: #f8fbfd;
  border: 1px solid #d0e3f5;
  border-radius: 8px;
}

.timestamp-card.is-empty {
  background-color: #f9f9f9;
  border-color: #e0e0e0;
}

.timestamp-content {
  flex: 1;
  min-width: 0;
}

.timestamp-badge-row {
  margin-bottom: 3px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 12px;
}

.pill-recorded {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.pill-locked {
  background-color: #ede7f6;
  color: #512da8;
}

.pill-empty {
  background-color: #eeeeee;
  color: #757575;
}

.timestamp-display-text {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timestamp-display-text.is-placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.timestamp-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 10px;
}

.btn-action-icon {
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 480px) {
  .btn-capture-instant {
    height: 42px;
    font-size: 13.5px;
    border-radius: 7px;
  }

  .timestamp-card {
    padding: 8px 12px;
    border-radius: 7px;
  }

  .timestamp-display-text {
    font-size: 13.5px;
  }
}
</style>
