<template>
    <nav class="sidebar-tabs">
        <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: modelValue === tab.id }"
            @click="emit('update:modelValue', tab.id)">
            <f7-icon :f7="tab.icon" />
            <span>{{ tab.label }}</span>
        </button>
    </nav>
</template>

<script setup lang="ts">
interface Props {
    modelValue: string;
}

defineProps<Props>();

const emit = defineEmits<{
    'update:modelValue': [id: string];
}>();

const tabs = [
    { id: 'data', label: 'Data', icon: 'database_fill' }, // Rename from Fields or new tab?
    { id: 'fields', label: 'Fields', icon: 'list_bullet' },
    { id: 'settings', label: 'Settings', icon: 'gear' },
    { id: 'views', label: 'Views', icon: 'rectangle_3_offgrid' },
    { id: 'actions', label: 'Actions', icon: 'bolt' },
    { id: 'assignments', label: 'Assign', icon: 'person_2' },
];
</script>

<style scoped>
.sidebar-tabs {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: none;
    background: transparent;
    border-radius: 8px;
    color: #64748b;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
}

.tab-btn:hover {
    background: #f1f5f9;
    color: #1e293b;
}

.tab-btn.active {
    background: #eff6ff;
    color: #2563eb;
}

.tab-btn :deep(.icon) {
    font-size: 18px;
}
</style>
