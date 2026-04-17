<template>
  <div class="async-image-container" :style="{ width: width + 'px', height: height + 'px' }">
    <!-- Image (Always in DOM to ensure loading triggers) -->
    <img
      ref="imgRef"
      :src="src"
      :width="width"
      :height="height"
      :loading="loading"
      @load="onLoad"
      @error="onError"
      class="main-image"
      :class="{ 'is-loaded': status === 'loaded' }"
    />

    <!-- Overlays -->
    <transition name="fade">
      <div v-if="status === 'loading'" key="loading" class="image-overlay loading">
        <f7-preloader size="16" />
      </div>
      <div v-else-if="status === 'error'" key="error" class="image-overlay error">
        <f7-icon f7="exclamationmark_triangle" size="20" color="gray" />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

const props = withDefaults(defineProps<{
  src: string;
  width?: number | string;
  height?: number | string;
  loading?: 'lazy' | 'eager';
}>(), {
  width: 44,
  height: 44,
  loading: 'lazy'
});

const status = ref<'loading' | 'loaded' | 'error'>('loading');
const imgRef = ref<HTMLImageElement | null>(null);

// 1. Initial/Watcher Reset
watch(() => props.src, (newSrc) => {
  if (!newSrc) {
    status.value = 'error';
  } else {
    status.value = 'loading';
    // Small chance it fires too fast for watcher, but onLoad handles it
  }
}, { immediate: true });

// 2. Cache-Hit Protection (On Mount)
onMounted(() => {
  if (imgRef.value && imgRef.value.complete && imgRef.value.naturalWidth !== 0) {
    status.value = 'loaded';
  }
});

function onLoad() {
  status.value = 'loaded';
}

function onError() {
  status.value = 'error';
}
</script>

<style scoped>
.async-image-container {
  position: relative;
  display: inline-block;
  overflow: hidden;
  border-radius: 4px;
  background: #f5f5f5;
  border: 1px solid #ddd;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  pointer-events: none;
}

.image-overlay.loading {
  background: #f8f9fa;
}

.main-image {
  display: block;
  object-fit: cover;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.main-image.is-loaded {
  opacity: 1;
}

/* Smooth Fade for Overlays */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
