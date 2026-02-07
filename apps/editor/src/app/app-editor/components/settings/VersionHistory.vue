<template>
    <div class="version-history">
        <div v-if="loading" class="loading-state">
            <f7-preloader />
            <span>Loading versions...</span>
        </div>
        <div v-else-if="versions.length === 0" class="empty-state">
            <f7-icon f7="clock" size="32" />
            <span>No version history yet</span>
        </div>
        <div v-else class="version-list">
            <div v-for="version in versions" :key="version.id" class="version-item"
                :class="{ 'is-current': version.version === currentVersion, 'is-draft': !version.is_published }">
                <div class="version-header">
                    <div class="version-number">
                        <f7-icon :f7="version.is_published ? 'checkmark_circle_fill' : 'pencil_circle'" />
                        <span>v{{ version.version }}</span>
                        <span v-if="version.version === currentVersion" class="current-badge">Current</span>
                        <span v-if="!version.is_published" class="draft-badge">Draft</span>
                    </div>
                    <div class="version-date">
                        {{ formatDate(version.is_published ? version.published_at : version.created_at) }}
                    </div>
                </div>
                <div v-if="version.changelog" class="version-changelog">
                    {{ version.changelog }}
                </div>
                <div v-if="version.version !== currentVersion" class="version-actions">
                    <f7-button small outline @click="handleRollback(version)">
                        <f7-icon f7="arrow_counterclockwise" size="14" />
                        Rollback to this version
                    </f7-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import { onMounted, ref, watch } from 'vue';

import { ApiClient } from '@/common/api/ApiClient';

interface Props {
    tableId: string;
    currentVersion?: number;
}

interface Version {
    id: string;
    version: number;
    changelog: string | null;
    is_published: boolean;
    published_at: string | null;
    created_at: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    rollback: [versionId: string, version: number];
}>();

const versions = ref<Version[]>([]);
const loading = ref(true);

async function fetchVersions() {
    console.log('[VersionHistory] Fetching versions for table:', props.tableId);
    if (!props.tableId) {
        console.warn('[VersionHistory] No tableId provided');
        loading.value = false;
        return;
    }

    loading.value = true;
    try {
        const response = await ApiClient.get(`/tables/${props.tableId}/versions`);
        console.log('[VersionHistory] Versions response:', response.data);
        versions.value = response.data.data || [];
    } catch (e) {
        console.error('[VersionHistory] Failed to fetch versions:', e);
        versions.value = [];
    } finally {
        loading.value = false;
    }
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function handleRollback(version: Version) {
    f7.dialog.confirm(
        `Are you sure you want to rollback to version ${version.version}? This will create a new draft with the fields from v${version.version}.`,
        'Rollback Version',
        () => {
            emit('rollback', version.id, version.version);
        }
    );
}

onMounted(fetchVersions);
watch(() => props.tableId, fetchVersions);
</script>

<style scoped>
.version-history {
    padding: 16px;
}

.loading-state,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px;
    color: #64748b;
}

.version-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.version-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
    transition: all 0.2s;
}

.version-item.is-current {
    border-color: #3b82f6;
    background: #eff6ff;
}

.version-item.is-draft {
    border-color: #fbbf24;
    background: #fefce8;
}

.version-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}

.version-number {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #1e293b;
}

.version-number :deep(.icon) {
    font-size: 16px;
    color: #16a34a;
}

.version-item.is-draft .version-number :deep(.icon) {
    color: #d97706;
}

.current-badge {
    background: #3b82f6;
    color: white;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
}

.draft-badge {
    background: #fbbf24;
    color: #78350f;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
}

.version-date {
    font-size: 12px;
    color: #64748b;
}

.version-changelog {
    font-size: 13px;
    color: #475569;
    margin-top: 4px;
    padding-left: 24px;
}

.version-actions {
    margin-top: 12px;
    padding-left: 24px;
}

.version-actions :deep(.button) {
    --f7-button-font-size: 12px;
}
</style>
