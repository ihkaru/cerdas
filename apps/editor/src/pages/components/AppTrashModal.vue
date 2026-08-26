<template>
    <f7-popup class="app-trash-modal" :opened="opened" @popup:closed="emit('update:opened', false)">
        <f7-page>
            <f7-navbar>
                <f7-nav-left>
                    <f7-link popup-close>Close</f7-link>
                </f7-nav-left>
                <f7-nav-title>Trash / Deleted Applications</f7-nav-title>
                <f7-nav-right>
                    <f7-link icon-f7="arrow_2_circlepath" @click="fetchTrashed"
                        :class="{ 'anim-spin': store.loading }" />
                </f7-nav-right>
            </f7-navbar>

            <!-- Retention Policy Notice -->
            <div class="trash-notice-banner" v-if="store.trashedApps?.length">
                <f7-icon f7="info_circle_fill" size="18" color="blue" />
                <span>Applications in trash are kept for <b>30 days</b> before permanent removal.</span>
            </div>

            <!-- Empty State -->
            <f7-block class="text-color-gray text-align-center empty-trash-block" v-if="!store.trashedApps?.length && !store.loading">
                <div class="trash-icon-wrap">
                    <f7-icon f7="trash" size="56" class="text-color-gray opacity-40" />
                </div>
                <h3 class="margin-top-half font-bold">Trash is empty</h3>
                <p class="size-14 text-color-gray max-w-400 margin-horizontal-auto">
                    Soft-deleted applications will appear here for 30 days. You can restore them anytime or permanently delete them.
                </p>
            </f7-block>

            <!-- Trashed Apps List -->
            <f7-list v-else media-list inset strong class="trashed-apps-list">
                <f7-list-item v-for="app in store.trashedApps" :key="app.id"
                    :title="app.name"
                    :text="app.description || 'No description'">
                    <template #media>
                        <div class="app-trash-avatar">
                            {{ (app.name || 'AP').substring(0, 2).toUpperCase() }}
                        </div>
                    </template>
                    <template #subtitle>
                        <div class="display-flex align-items-center gap-half flex-wrap margin-top-xs">
                            <span class="size-12 text-color-gray">Dihapus: {{ formatDate(app.deleted_at) }}</span>
                            <span class="badge" :class="getDaysRemainingClass(app.deleted_at)">
                                {{ getDaysRemainingText(app.deleted_at) }}
                            </span>
                            <span class="size-12 text-color-gray">• {{ app.tables_count || 0 }} forms</span>
                        </div>
                    </template>
                    <template #after>
                        <div class="action-buttons-wrap display-flex align-items-center gap-half">
                            <f7-button small outline color="green" @click="handleRestore(app)">
                                <f7-icon f7="arrow_uturn_backward" size="14" class="margin-right-xs" />
                                Restore
                            </f7-button>
                            <f7-button small fill color="red" @click="handleForceDelete(app)">
                                <f7-icon f7="trash_fill" size="14" class="margin-right-xs" />
                                Delete Forever
                            </f7-button>
                        </div>
                    </template>
                </f7-list-item>
            </f7-list>
        </f7-page>
    </f7-popup>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app.store';
import { f7 } from 'framework7-vue';
import { watch } from 'vue';

const props = defineProps<{
    opened: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:opened', value: boolean): void;
    (e: 'restored', app: any): void;
}>();

const store = useAppStore();

function fetchTrashed() {
    store.fetchTrashedApps();
}

watch(() => props.opened, (newVal) => {
    if (newVal) {
        fetchTrashed();
    }
});

function formatDate(dateStr?: string) {
    if (!dateStr) return 'Baru saja';
    try {
        return new Date(dateStr).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateStr;
    }
}

function getDaysRemaining(dateStr?: string): number {
    if (!dateStr) return 30;
    try {
        const deletedTime = new Date(dateStr).getTime();
        const purgeTime = deletedTime + (30 * 24 * 60 * 60 * 1000);
        const diffMs = purgeTime - Date.now();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    } catch {
        return 30;
    }
}

function getDaysRemainingText(dateStr?: string): string {
    const days = getDaysRemaining(dateStr);
    if (days <= 0) return 'Kedaluwarsa (Siap Purge)';
    if (days === 1) return '1 hari tersisa';
    return `${days} hari tersisa`;
}

function getDaysRemainingClass(dateStr?: string): string {
    const days = getDaysRemaining(dateStr);
    if (days <= 3) return 'color-red';
    if (days <= 7) return 'color-orange';
    return 'color-gray';
}

async function handleRestore(app: any) {
    f7.preloader.show();
    try {
        await store.restoreApp(app.id);
        f7.toast.show({
            text: `Aplikasi "${app.name}" berhasil dipulihkan`,
            position: 'center',
            closeTimeout: 2000,
            cssClass: 'color-green'
        });
        emit('restored', app);
    } catch (e: any) {
        f7.dialog.alert(e.message || 'Gagal memulihkan aplikasi');
    } finally {
        f7.preloader.hide();
    }
}

function handleForceDelete(app: any) {
    f7.dialog.prompt(
        `Tindakan ini BERSIFAT PERMANEN & TIDAK DAPAT DIBATALKAN. Seluruh formulir, data respon, konfigurasi, dan penugasan pada aplikasi ini akan dimusnahkan.\n\nKetik "${app.name}" untuk mengonfirmasi:`,
        'Hapus Aplikasi Selamanya?',
        async (val) => {
            const trimmed = val?.trim();
            if (trimmed !== app.name && trimmed?.toUpperCase() !== 'DELETE') {
                f7.dialog.alert('Teks konfirmasi tidak cocok. Penghapusan permanen dibatalkan.');
                return;
            }

            f7.preloader.show();
            try {
                await store.forceDeleteApp(app.id);
                f7.toast.show({
                    text: `Aplikasi "${app.name}" telah dihapus secara permanen`,
                    position: 'center',
                    closeTimeout: 2000,
                    cssClass: 'color-red'
                });
            } catch (e: any) {
                f7.dialog.alert(e.message || 'Gagal menghapus permanen');
            } finally {
                f7.preloader.hide();
            }
        }
    );
}
</script>

<style scoped>
.trash-notice-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 16px;
    padding: 12px 16px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    font-size: 13px;
    color: #1e40af;
}

.empty-trash-block {
    padding: 60px 20px;
}

.trash-icon-wrap {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
}

.app-trash-avatar {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    background: #e2e8f0;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 15px;
}

.trashed-apps-list {
    margin-top: 12px;
}

.action-buttons-wrap {
    margin-top: 4px;
}

.max-w-400 {
    max-width: 400px;
}

.margin-horizontal-auto {
    margin-left: auto;
    margin-right: auto;
}

.size-14 {
    font-size: 14px;
}

.size-12 {
    font-size: 12px;
}

.margin-top-xs {
    margin-top: 4px;
}

.margin-right-xs {
    margin-right: 4px;
}

.anim-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    100% {
        transform: rotate(360deg);
    }
}
</style>
