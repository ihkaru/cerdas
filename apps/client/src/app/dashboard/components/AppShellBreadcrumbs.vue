<template>
    <div v-if="groupPath && groupPath.length > 0" class="group-breadcrumbs-bar">
        <button type="button" class="crumb-back-btn" @click="$emit('navigate-up')" title="Kembali 1 tingkat">
            <f7-icon f7="chevron_left" size="14px"></f7-icon>
            <span>Kembali</span>
        </button>
        <div class="crumb-trail-scroll">
            <button type="button" class="crumb-link root-crumb" @click="$emit('navigate-level', -1)">
                <f7-icon f7="house_fill" size="12px" class="margin-right-2"></f7-icon>
                <span>Semua</span>
            </button>
            <template v-for="(crumb, idx) in groupPath" :key="idx">
                <span class="crumb-separator">/</span>
                <button type="button" class="crumb-link" 
                    :class="{ 'current-crumb': idx === groupPath.length - 1 }"
                    @click="$emit('navigate-level', idx)">
                    {{ crumb }}
                </button>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    groupPath: string[];
}>();

defineEmits<{
    (e: 'navigate-up'): void;
    (e: 'navigate-level', index: number): void;
}>();
</script>

<style scoped>
.margin-right-2 {
    margin-right: 4px;
}

.group-breadcrumbs-bar {
    display: flex;
    align-items: center;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 8px 12px;
    font-size: 13px;
    gap: 8px;
}

.crumb-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 12px;
    font-weight: 500;
    color: #475569;
    cursor: pointer;
    flex-shrink: 0;
}

.crumb-back-btn:active {
    background: #f1f5f9;
}

.crumb-trail-scroll {
    display: flex;
    align-items: center;
    overflow-x: auto;
    white-space: nowrap;
    gap: 4px;
    flex-grow: 1;
    scrollbar-width: none;
}

.crumb-trail-scroll::-webkit-scrollbar {
    display: none;
}

.crumb-link {
    background: transparent;
    border: none;
    padding: 2px 4px;
    font-size: 12px;
    color: #2563eb;
    cursor: pointer;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
}

.crumb-link.current-crumb {
    font-weight: 600;
    color: #0f172a;
    cursor: default;
}

.crumb-separator {
    color: #94a3b8;
    font-size: 11px;
}
</style>
