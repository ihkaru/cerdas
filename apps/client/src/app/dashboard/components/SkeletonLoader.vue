<template>
    <f7-list v-if="loading" class="no-hairlines-between margin-top-half">
        <f7-list-item v-for="n in count" :key="n" class="group-item">
            <div slot="media" class="group-avatar skeleton-block"
                style="width: 48px; height: 48px; border-radius: 50%;"></div>
            <div slot="title" class="group-info" style="width: 100%; max-width: 240px;">
                <div class="group-name skeleton-block"
                    style="height: 16px; margin-bottom: 6px; width: 60%; border-radius: 4px;"></div>
                <div class="group-count skeleton-block" style="height: 12px; width: 40%; border-radius: 4px;"></div>
            </div>
        </f7-list-item>
    </f7-list>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    loading: boolean;
    count?: number;
}>(), {
    count: 6
});
</script>

<style scoped>
.skeleton-block {
    background-color: #e0e0e0;
    animation: skeleton-pulse 1.5s infinite ease-in-out;
}

@keyframes skeleton-pulse {
    0% {
        opacity: 0.6;
    }

    50% {
        opacity: 1;
    }

    100% {
        opacity: 0.6;
    }
}

.group-avatar {
    border-radius: 50%;
    margin-right: 16px;
    flex-shrink: 0;
}

/* Ensure structure matches the real list item for smoothness */
.group-item :deep(.item-content) {
    padding-left: 16px;
    padding-right: 16px;
    min-height: 72px;
}
</style>
