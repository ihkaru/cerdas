<template>
    <div v-if="count > 0"
        class="block block-strong no-margin display-flex justify-content-center align-items-center bg-color-orange text-color-white cursor-pointer"
        @click="$emit('sync')" style="padding: 12px; cursor: pointer;">
        <f7-icon f7="cloud_upload_fill" size="20" color="white" class="margin-right-half" />
        <span style="font-weight: 600">{{ count }} Data belum disinkronisasi. Ketuk untuk Sync.</span>
    </div>
</template>

<script setup lang="ts">

defineProps<{
    count: number;
}>();

defineEmits<{
    (e: 'sync'): void;
}>();
</script>

<style scoped>
.bg-color-orange {
    background-color: #f97316 !important;
}

.text-color-white {
    color: white !important;
}

.cursor-pointer {
    cursor: pointer;
}
</style>
