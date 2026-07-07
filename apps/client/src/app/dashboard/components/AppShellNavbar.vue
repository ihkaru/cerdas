<template>
    <f7-navbar :sliding="false" class="premium-navbar">
        <f7-nav-left v-if="showBack">
            <f7-link @click="$emit('back')" class="nav-icon-btn back-btn" aria-label="Kembali">
                <SvgIcon name="arrow_left" :size="22" />
            </f7-link>
        </f7-nav-left>

        <f7-nav-title class="premium-title">{{ title }}</f7-nav-title>

        <f7-nav-right>
            <f7-link v-for="action in actions" :key="action.id"
                @click="$emit('action', action)" 
                class="nav-icon-btn action-btn" 
                :class="{ 'spinning': action.id === 'sync' && isSyncing }"
                :aria-label="action.label || action.id">
                <SvgIcon :name="action.icon ?? 'square'" :size="22" />
            </f7-link>
            <f7-link @click="$emit('menu')" class="nav-icon-btn menu-btn" aria-label="Menu">
                <SvgIcon name="bars" :size="22" />
            </f7-link>
        </f7-nav-right>
    </f7-navbar>
</template>

<script setup lang="ts">
import SvgIcon from '@/components/common/SvgIcon.vue';

interface NavAction {
    id: string;
    icon?: string;
    color?: string;
    label?: string;
}

defineProps<{
    title: string;
    actions: NavAction[];
    isSyncing?: boolean;
    showBack?: boolean;
}>();

defineEmits<{
    (e: 'back'): void;
    (e: 'action', action: NavAction): void;
    (e: 'menu'): void;
}>();
</script>

<style scoped>
.premium-navbar {
    background: transparent !important;
}

/* Glassmorphism backing via Framework7's navbar-bg element */
:deep(.navbar-bg) {
    background: rgba(255, 255, 255, 0.8) !important;
    backdrop-filter: blur(16px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.02) !important;
}

:deep(.navbar-inner) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    padding: 0 8px !important;
}

/* Consistently Centered Title */
.premium-title, :deep(.title) {
    position: absolute !important;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
    margin: 0 !important;
    text-align: center;
    font-weight: 600 !important;
    font-size: 17px !important;
    color: #111827 !important; /* Premium Neutral Dark */
    width: auto !important;
    max-width: calc(100% - 130px) !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    pointer-events: none !important;
    display: block !important;
}

/* Modern Rounded Nav Buttons */
.nav-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    color: #4b5563 !important; /* Neutral slate */
    background: transparent;
    transition: background-color 0.2s ease, color 0.2s ease, transform 0.1s ease;
    margin: 0 2px;
}

.nav-icon-btn:active {
    background-color: rgba(0, 0, 0, 0.06);
    color: #111827 !important;
    transform: scale(0.95);
}

/* Micro animations for syncing rotation */
.spinning {
    animation: spin-refresh 1.2s linear infinite;
    color: var(--f7-theme-color, #2196f3) !important;
}

@keyframes spin-refresh {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>