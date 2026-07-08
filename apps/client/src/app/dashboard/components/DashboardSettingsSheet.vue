<template>
    <f7-sheet class="settings-sheet app-sheet" :opened="opened" @sheet:closed="$emit('update:opened', false)" swipe-to-close backdrop>
        <f7-page-content>
            <!-- Drag Handle -->
            <div class="sheet-drag-handle"></div>

            <!-- Profile Header -->
            <div class="profile-header">
                <div class="avatar">
                    <f7-icon f7="person_fill" size="28" color="white"></f7-icon>
                </div>
                <div class="profile-info">
                    <div class="profile-name">{{ user?.name || 'User' }}</div>
                    <div class="profile-email">{{ user?.email || '' }}</div>
                </div>
            </div>

            <!-- Main Actions -->
            <f7-list inset class="settings-list">
                <f7-list-item link @click="onSync" :class="{ 'syncing': isSyncing }">
                    <template #media>
                        <f7-icon f7="arrow_2_circlepath" color="blue"></f7-icon>
                    </template>
                    <template #title>Sync Data</template>
                    <template #after>
                        <span v-if="isSyncing" class="sync-label">Syncing...</span>
                    </template>
                </f7-list-item>
                <f7-list-item link @click="onLogout" class="logout-item">
                    <template #media>
                        <f7-icon f7="square_arrow_right" color="orange"></f7-icon>
                    </template>
                    <template #title>Sign Out</template>
                </f7-list-item>
            </f7-list>

            <!-- Danger Zone -->
            <div class="danger-label">DANGER ZONE</div>
            <f7-list inset class="danger-list">
                <f7-list-item link @click="onResetDatabase" class="danger-item">
                    <template #media>
                        <f7-icon f7="trash_fill" color="red"></f7-icon>
                    </template>
                    <template #title>Reset Local Database</template>
                    <template #subtitle>Deletes all offline data. Cannot be undone.</template>
                </f7-list-item>
            </f7-list>

            <!-- Version -->
            <div class="version-label" @click="handleVersionTap" style="cursor: pointer; user-select: none; padding: 12px; margin-top: 10px;">{{ versionText || 'v0.2.7' }}</div>
        </f7-page-content>
    </f7-sheet>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import { computed } from 'vue';

const props = defineProps<{
    opened: boolean;
    user?: { name?: string; email?: string } | null;
    isSyncing?: boolean;
    appVersion?: string;
}>();

const emit = defineEmits<{
    (e: 'update:opened', val: boolean): void;
    (e: 'sync'): void;
    (e: 'logout'): void;
    (e: 'reset-database'): void;
}>();

const versionText = computed(() => props.appVersion ? `v${props.appVersion}` : '');

let versionTapCount = 0;
let versionTapTimer: any = null;

const handleVersionTap = () => {
    versionTapCount++;
    console.log(`[Debug] Version tapped: ${versionTapCount}/5`);
    if (versionTapTimer) clearTimeout(versionTapTimer);
    versionTapTimer = setTimeout(() => { versionTapCount = 0; }, 2000);

    if (versionTapCount >= 5) {
        console.log('[Debug] Triggering open-debug-menu event from settings');
        window.dispatchEvent(new CustomEvent('open-debug-menu'));
        versionTapCount = 0;
        if (versionTapTimer) clearTimeout(versionTapTimer);
        close();
    }
};

const close = () => emit('update:opened', false);

const onSync = () => {
    close();
    emit('sync');
};

const onLogout = () => {
    close();
    f7.dialog.confirm('Are you sure you want to sign out?', 'Sign Out', () => {
        emit('logout');
    });
};

const onResetDatabase = () => {
    f7.dialog.confirm(
        'This will permanently delete all offline data (apps, tables, assignments) from this device. You will need to re-sync after this.',
        'Reset Local Database',
        () => emit('reset-database')
    );
};
</script>

<style scoped>
/* .sheet-drag-handle is defined globally in style.css */


/* Profile */
.profile-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 16px 12px;
}

.avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--f7-theme-color, #007aff);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.profile-name {
    font-size: 17px;
    font-weight: 600;
    color: var(--f7-text-color);
}

.profile-email {
    font-size: 13px;
    color: var(--f7-label-color);
    margin-top: 2px;
}

/* Lists */
.settings-list {
    margin-top: 8px;
    margin-bottom: 8px;
}

.sync-label {
    font-size: 12px;
    color: var(--f7-label-color);
}

.logout-item :deep(.item-title) {
    color: #ff9500;
    font-weight: 500;
}

/* Danger Zone */
.danger-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #ff3b30;
    padding: 4px 32px 4px;
}

.danger-list {
    margin-top: 0;
    margin-bottom: 8px;
}

.danger-item :deep(.item-title) {
    color: #ff3b30;
    font-weight: 500;
}

.danger-item :deep(.item-subtitle) {
    color: var(--f7-label-color);
    font-size: 12px;
}

/* Version */
.version-label {
    text-align: center;
    font-size: 12px;
    color: var(--f7-label-color);
    opacity: 0.5;
    padding: 8px 0 24px;
}

/* Syncing animation */
.syncing :deep(.item-media .icon) {
    animation: spin 1s infinite linear;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>
