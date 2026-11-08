<template>
    <f7-fab v-if="visible" position="right-bottom" slot="fixed"
        :class="['app-fab', 'premium-fab', { 'fab-with-toolbar': hasToolbar }]"
        @click="$emit('click')">
        <SvgIcon name="plus" :size="24" />
    </f7-fab>
</template>

<script setup lang="ts">
import SvgIcon from '@/components/common/SvgIcon.vue';

defineProps<{
    visible: boolean;
    hasToolbar?: boolean;
}>();

defineEmits<{
    (e: 'click'): void;
}>();
</script>

<style scoped>
.app-fab {
    transition: transform 0.18s ease, box-shadow 0.18s ease !important;
}

.app-fab:active {
    transform: scale(0.9) !important;
}

.premium-fab {
    --f7-fab-bg-color: var(--f7-theme-color, #2196f3);
    --f7-fab-pressed-bg-color: #1976d2;
    --f7-fab-box-shadow: 0 4px 14px rgba(33, 150, 243, 0.4);
    bottom: calc(var(--f7-safe-area-bottom, env(safe-area-inset-bottom, 0px)) + 16px) !important;
    right: calc(var(--f7-safe-area-right, env(safe-area-inset-right, 0px)) + 16px) !important;
}

.premium-fab.fab-with-toolbar {
    bottom: calc(var(--f7-safe-area-bottom, env(safe-area-inset-bottom, 0px)) + 56px + 16px) !important;
}

.premium-fab:active {
    --f7-fab-box-shadow: 0 2px 6px rgba(33, 150, 243, 0.2);
}
</style>
