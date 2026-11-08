<template>
    <div v-if="!connected" class="offline-banner">
        <f7-icon f7="wifi_slash" size="14" />
        OFFLINE MODE
    </div>
</template>

<script setup lang="ts">
defineProps<{
    connected: boolean;
}>();
</script>

<style scoped>
.offline-banner {
    background: var(--f7-color-orange);
    color: white;
    text-align: center;
    font-size: 11px;
    font-weight: bold;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    letter-spacing: 0.5px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
