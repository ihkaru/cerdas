<template>
    <nav class="sidebar-tabs">
        <button v-for="tab in tabs" :key="tab.id" class="tab-btn"
            :class="{ active: modelValue === tab.id, disabled: isTabDisabled(tab.id) }"
            :title="isTabDisabled(tab.id) ? 'Pilih Data Source terlebih dahulu' : ''" @click="handleTabClick(tab.id)">
            <f7-icon :f7="tab.icon" />
            <span>{{ tab.label }}</span>
            <f7-icon v-if="isTabDisabled(tab.id)" f7="lock_fill" class="lock-icon" />
        </button>
    </nav>
</template>

<script setup lang="ts">
interface Props {
    modelValue: string;
    hasFormSelected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    hasFormSelected: false
});

const emit = defineEmits<{
    'update:modelValue': [id: string];
}>();

const tabs = [
    { id: 'data', label: 'Data', icon: 'database_fill', requiresForm: false },
    { id: 'fields', label: 'Fields', icon: 'list_bullet', requiresForm: true },
    { id: 'settings', label: 'Settings', icon: 'gear', requiresForm: false },
    { id: 'views', label: 'Views', icon: 'rectangle_3_offgrid', requiresForm: true },
    { id: 'actions', label: 'Actions', icon: 'bolt', requiresForm: true },
    { id: 'assignments', label: 'Assign', icon: 'person_2', requiresForm: true },
    { id: 'code', label: 'Code', icon: 'chevron_left_slash_chevron_right', requiresForm: true },
];

function isTabDisabled(tabId: string): boolean {
    const tab = tabs.find(t => t.id === tabId);
    return tab?.requiresForm === true && !props.hasFormSelected;
}

function handleTabClick(tabId: string) {
    if (isTabDisabled(tabId)) {
        return; // Don't switch to disabled tab
    }
    emit('update:modelValue', tabId);
}
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

.tab-btn.disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.tab-btn.disabled:hover {
    background: transparent;
    color: #64748b;
}

.lock-icon {
    font-size: 12px !important;
    margin-left: auto;
    opacity: 0.6;
}
</style>
