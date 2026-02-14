<template>
    <f7-page name="sync-manager">
        <f7-navbar title="Sync Manager" back-link="Back">
            <f7-nav-right>
                <f7-link icon-f7="cloud_upload" @click="pushSync" :class="{ 'fa-spin': isSyncing }"></f7-link>
            </f7-nav-right>
        </f7-navbar>

        <f7-block-title>Sync Status</f7-block-title>
        <f7-block strong inset class="text-align-center">
            <div class="display-flex justify-content-center align-items-center flex-direction-column">
                <f7-icon :f7="isOnline ? 'wifi' : 'wifi_slash'" size="48"
                    :color="isOnline ? 'green' : 'gray'"></f7-icon>
                <h3 class="no-margin-bottom">{{ isOnline ? 'Online' : 'Offline' }}</h3>
                <p class="text-color-gray no-margin">
                    {{ pendingItems.length }} items pending upload
                </p>
            </div>
            <div class="margin-top">
                <f7-button fill large :disabled="isSyncing || pendingItems.length === 0" @click="pushSync">
                    {{ isSyncing ? 'Syncing...' : 'Sync Now' }}
                </f7-button>
            </div>
        </f7-block>

        <f7-block-title>Pending Queue</f7-block-title>
        <f7-list media-list v-if="pendingItems.length > 0">
            <f7-list-item v-for="item in pendingItems" :key="item.local_id"
                :title="`Response for #${item.assignment_id}`" :subtitle="formatDate(item.updated_at)">
                <template #media>
                    <f7-icon f7="doc_text" color="orange"></f7-icon>
                </template>
                <template #after>
                    <f7-icon f7="exclamationmark_circle" color="orange"></f7-icon>
                </template>
            </f7-list-item>
        </f7-list>
        <f7-block v-else class="text-align-center text-color-gray">
            <p>Queue is empty. All safe.</p>
        </f7-block>

    </f7-page>
</template>

<style scoped>
.fa-spin {
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

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import { onMounted, ref } from 'vue';
import { useDatabase } from '../common/composables/useDatabase';
import { useSync } from '../common/composables/useSync';

const db = useDatabase();
const sync = useSync();
const pendingItems = ref<any[]>([]);
const isSyncing = ref(false);
const isOnline = ref(navigator.onLine);

const loadQueue = async () => {
    const conn = await db.getDB();
    const res = await conn.query(`SELECT * FROM responses WHERE is_synced = 0 ORDER BY updated_at DESC`);
    if (res.values) {
        pendingItems.value = res.values;
    }
}

const pushSync = async () => {
    if (isSyncing.value) return;
    isSyncing.value = true;
    try {
        await sync.push();
        await loadQueue();
        f7.toast.show({ text: 'Sync complete', position: 'center', closeTimeout: 1500 });
    } catch {
        f7.dialog.alert('Sync failed. Please check connection.', 'Error');
    } finally {
        isSyncing.value = false;
    }
}

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
}

onMounted(() => {
    loadQueue();
    window.addEventListener('online', () => isOnline.value = true);
    window.addEventListener('offline', () => isOnline.value = false);
});
</script>
