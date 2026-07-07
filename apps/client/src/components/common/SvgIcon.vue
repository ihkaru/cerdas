<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="['svg-icon', name]"
    aria-hidden="true"
  >
    <g v-if="name === 'arrow_left'">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </g>
    <g v-else-if="name === 'bars'">
      <line x1="4" y1="12" x2="20" y2="12"></line>
      <line x1="4" y1="6" x2="20" y2="6"></line>
      <line x1="4" y1="18" x2="20" y2="18"></line>
    </g>
    <g v-else-if="name === 'arrow_2_circlepath'">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3l.7 1.8M22 12.5a10 10 0 0 1-18.8 4.2l-.7-1.7" />
    </g>
    <g v-else-if="name === 'plus'">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </g>
    <g v-else-if="name === 'person_circle'">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M6 21a6 6 0 0 1 12 0" />
      <circle cx="12" cy="10" r="4" />
    </g>
    <g v-else-if="name === 'arrow_up_arrow_down'">
      <path d="M17 4v16M17 4l-4 4M17 4l4 4M7 20V4M7 20l-4-4M7 20l4-4" />
    </g>
    <g v-else-if="name === 'slider_horizontal_3'">
      <line x1="4" y1="21" x2="4" y2="14"></line>
      <line x1="4" y1="10" x2="4" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12" y2="3"></line>
      <line x1="20" y1="21" x2="20" y2="16"></line>
      <line x1="20" y1="12" x2="20" y2="3"></line>
      <line x1="2" y1="14" x2="6" y2="14"></line>
      <line x1="10" y1="8" x2="14" y2="8"></line>
      <line x1="18" y1="16" x2="22" y2="16"></line>
    </g>
    <g v-else>
      <!-- default / fallback square -->
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    </g>
  </svg>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  name: string;
  size?: number | string;
}>(), {
  size: 20
});
</script>

<style scoped>
.svg-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
