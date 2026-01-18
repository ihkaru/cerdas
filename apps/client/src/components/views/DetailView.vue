<template>
    <div class="detail-view">

        <!-- Image Header if available -->
        <div v-if="imageUrl" class="detail-header-image" :style="{ backgroundImage: `url(${imageUrl})` }"></div>
        <div v-else
            class="detail-header-placeholder bg-color-gray-light display-flex justify-content-center align-items-center">
            <f7-icon f7="photo" size="48" color="gray"></f7-icon>
        </div>

        <f7-block-title class="margin-top">{{ config.title }}</f7-block-title>

        <f7-list>
            <f7-list-item v-for="col in displayColumns" :key="col" :title="formatLabel(col)"
                :after="resolveValue(data[0], col)"></f7-list-item>
        </f7-list>

        <f7-block v-if="hasEditAction">
            <f7-button fill large @click="$emit('action', 'edit', data[0])">Edit Data</f7-button>
        </f7-block>

    </div>
</template>

<style scoped>
.detail-header-image {
    height: 250px;
    width: 100%;
    background-size: cover;
    background-position: center;
}

.detail-header-placeholder {
    height: 150px;
    width: 100%;
}
</style>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    config: any;
    data: any[]; // Expecting single item logic, but prop is array for consistency
}>();

const emit = defineEmits(['action']);

const displayColumns = computed(() => {
    return props.config.options?.columns || [];
});

const hasEditAction = computed(() => {
    return props.config.options?.actions?.includes('edit');
});

// Try to find an image column for header
const imageUrl = computed(() => {
    // 1. Look for 'photo', 'image' in columns
    const imgCol = displayColumns.value.find((c: string) => c.includes('photo') || c.includes('image'));
    if (imgCol && props.data[0]) {
        return resolveValue(props.data[0], imgCol);
    }
    return null;
});

const formatLabel = (col: string) => {
    // capitalize
    return col.charAt(0).toUpperCase() + col.slice(1);
};

const resolveValue = (obj: any, path: string) => {
    if (!obj || !path) return '';
    let target = obj;

    // Check Prelist Data
    if (path.startsWith('prelist_data.') || (!obj[path] && obj.prelist_data)) {
        if (typeof obj.prelist_data === 'string') {
            try {
                const prelist = JSON.parse(obj.prelist_data);
                target = { ...obj, ...prelist }; // Merge for easier access
            } catch { }
        } else {
            target = { ...obj, ...obj.prelist_data };
        }
    }

    return path.split('.').reduce((acc, part) => acc && acc[part], target) || '';
};

</script>
