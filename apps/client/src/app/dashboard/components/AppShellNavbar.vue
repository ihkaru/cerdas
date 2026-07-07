<template>
    <f7-navbar :sliding="false">
        <f7-nav-left>
            <f7-link @click="$emit('back')" class="back-nav-link">
                <f7-icon f7="arrow_left"></f7-icon>
                <span class="back-label">Kembali</span>
            </f7-link>
        </f7-nav-left>

        <f7-nav-title sliding>{{ title }}</f7-nav-title>

        <f7-nav-right>
            <f7-link v-for="action in actions" :key="action.id" :color="action.color"
                @click="$emit('action', action)" class="action-nav-link">
                <f7-icon :f7="action.icon ?? 'square'"></f7-icon>
                <span v-if="action.id === 'sync'" class="sync-label">Sync</span>
            </f7-link>
            <f7-link @click="$emit('menu')" class="menu-nav-link">
                <f7-icon f7="bars"></f7-icon>
                <span class="menu-label">Menu</span>
            </f7-link>
        </f7-nav-right>
    </f7-navbar>
</template>

<script setup lang="ts">
interface NavAction {
    id: string;
    icon?: string;
    color?: string;
}

defineProps<{
    title: string;
    actions: NavAction[];
}>();

defineEmits<{
    (e: 'back'): void;
    (e: 'action', action: NavAction): void;
    (e: 'menu'): void;
}>();
</script>

<style scoped>
.back-nav-link, .action-nav-link, .menu-nav-link {
    display: flex;
    align-items: center;
    gap: 4px;
}
.back-label, .sync-label, .menu-label {
    font-size: 14px;
    font-weight: 500;
}
@media (max-width: 360px) {
    .back-label, .sync-label, .menu-label {
        display: none; /* Hide text on extremely narrow screens to avoid overlapping */
    }
}
</style>