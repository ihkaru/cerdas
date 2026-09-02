<template>
    <div v-if="count > 0"
        :class="[
            'block block-strong no-margin display-flex justify-content-center align-items-center text-color-white cursor-pointer',
            isPreview ? 'bg-color-blue' : 'bg-color-orange'
        ]"
        @click="$emit('sync')" style="padding: 12px; cursor: pointer;">
        <f7-icon :f7="isPreview ? 'info_circle_fill' : 'cloud_upload_fill'" size="20" color="white" class="margin-right-half" />
        <span style="font-weight: 600">{{ message }}</span>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    count: number;
}>();

defineEmits<{
    (e: 'sync'): void;
}>();

const isPreview = computed(() => {
    return window.self !== window.top || !!(window as any).__SCHEMA_OVERRIDE;
});

const message = computed(() => {
    if (isPreview.value) {
        return `${props.count} Data disimpan lokal. Ketuk untuk info Sync.`;
    }
    return `${props.count} Data siap dikirim ke server. Ketuk untuk Sync.`;
});
</script>

<style scoped>
.bg-color-orange {
    background-color: #f97316 !important;
}

.bg-color-blue {
    background-color: #2196f3 !important;
}

.text-color-white {
    color: white !important;
}

.cursor-pointer {
    cursor: pointer;
}
</style>
