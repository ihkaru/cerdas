<template>
  <f7-popup class="command-palette-popup" :opened="opened" @popup:closed="emit('close')">
    <div class="palette-container">
      <div class="palette-search-bar">
        <f7-icon f7="search" size="18" class="palette-search-icon" />
        <input
          ref="searchInputRef"
          type="text"
          :value="modelValue"
          placeholder="Ketik untuk mencari aplikasi, navigasi, atau tindakan... (Esc untuk batal)"
          class="palette-input"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          @keydown="handleKeyNavigation"
        />
        <button v-if="modelValue" class="clear-btn" @click="emit('update:modelValue', '')">
          <f7-icon f7="xmark_circle_fill" size="14" />
        </button>
      </div>

      <div class="palette-results">
        <div v-if="results.length === 0" class="palette-empty">
          <f7-icon f7="search" size="32" color="gray" />
          <p>Tidak ada hasil yang cocok dengan "{{ modelValue }}"</p>
        </div>

        <div v-else class="results-list">
          <div
            v-for="(item, index) in results"
            :key="item.id"
            class="result-item"
            :class="{ active: selectedIndex === index }"
            @click="onSelect(item)"
            @mouseenter="selectedIndex = index"
          >
            <div class="item-icon" :class="item.category">
              <f7-icon :f7="item.icon" size="16" />
            </div>
            <div class="item-text">
              <div class="item-title">{{ item.title }}</div>
              <div v-if="item.subtitle" class="item-subtitle">{{ item.subtitle }}</div>
            </div>
            <span v-if="item.badge" class="item-badge">{{ item.badge }}</span>
            <span class="enter-hint">↵</span>
          </div>
        </div>
      </div>

      <div class="palette-footer">
        <div class="footer-hint">
          <kbd>↑</kbd> <kbd>↓</kbd> Navigasi
          <span class="hint-sep">•</span>
          <kbd>Enter</kbd> Pilih
          <span class="hint-sep">•</span>
          <kbd>Esc</kbd> Tutup
        </div>
      </div>
    </div>
  </f7-popup>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import type { SearchResultItem } from './search.types';

const props = defineProps<{
  opened: boolean;
  modelValue: string;
  results: SearchResultItem[];
}>();

const emit = defineEmits<{
  'update:modelValue': [val: string];
  close: [];
  select: [item: SearchResultItem];
}>();

const searchInputRef = ref<HTMLInputElement | null>(null);
const selectedIndex = ref(0);

watch(
  () => props.opened,
  (val) => {
    if (val) {
      selectedIndex.value = 0;
      nextTick(() => {
        searchInputRef.value?.focus();
      });
    }
  }
);

watch(
  () => props.results,
  () => {
    selectedIndex.value = 0;
  }
);

function onSelect(item: SearchResultItem) {
  emit('select', item);
}

function handleKeyNavigation(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (props.results.length > 0) {
      selectedIndex.value = (selectedIndex.value + 1) % props.results.length;
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (props.results.length > 0) {
      selectedIndex.value = (selectedIndex.value - 1 + props.results.length) % props.results.length;
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const item = props.results[selectedIndex.value];
    if (item) {
      onSelect(item);
    }
  }
}
</script>

<style scoped>
.palette-container {
  max-width: 620px;
  margin: 60px auto 0 auto;
  background: white;
  border-radius: 14px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.palette-search-bar {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  gap: 12px;
}

.palette-search-icon {
  color: #64748b;
}

.palette-input {
  flex: 1;
  border: none;
  font-size: 15px;
  color: #0f172a;
  outline: none;
  background: transparent;
}

.clear-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px;
}

.palette-results {
  max-height: 380px;
  overflow-y: auto;
  padding: 8px;
}

.palette-empty {
  text-align: center;
  padding: 40px 16px;
  color: #64748b;
  font-size: 13.5px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.result-item:hover,
.result-item.active {
  background: #f1f5f9;
}

.item-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-icon.app {
  background: #eff6ff;
  color: #2563eb;
}

.item-icon.navigation {
  background: #f0fdf4;
  color: #16a34a;
}

.item-icon.action {
  background: #faf5ff;
  color: #9333ea;
}

.item-text {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 13.5px;
  font-weight: 600;
  color: #0f172a;
}

.item-subtitle {
  font-size: 11.5px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-badge {
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  background: #e2e8f0;
  color: #475569;
}

.enter-hint {
  font-size: 12px;
  color: #94a3b8;
  opacity: 0;
  transition: opacity 0.12s;
}

.result-item.active .enter-hint {
  opacity: 1;
}

.palette-footer {
  padding: 10px 20px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
}

.footer-hint {
  font-size: 11.5px;
  color: #64748b;
}

.footer-hint kbd {
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 10.5px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
}

.hint-sep {
  margin: 0 6px;
  color: #cbd5e1;
}
</style>
