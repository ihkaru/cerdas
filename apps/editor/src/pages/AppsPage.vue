<template>
    <f7-page name="apps" class="apps-page" @page:afterin="onPageAfterIn" @page:reinit="onPageReinit">
        <!-- Page Header with Search & Actions -->
        <AppsPageHeader
            v-model:searchQuery="searchQuery"
            :trashed-count="appStore.trashedApps?.length || 0"
            @open-trash="showTrashModal = true"
            @open-sheet="showSheetModal = true"
            @create-app="showCreateDialog"
        />

        <!-- Apps Grid -->
        <div class="apps-grid" v-if="filteredApps.length > 0">
            <AppCard
                v-for="app in filteredApps"
                :key="app.id"
                :app="app"
                @menu="showAppMenu"
            />

            <!-- Create Blank App Card -->
            <div class="app-card add-card" @click="showCreateDialog" role="button" tabindex="0">
                <div class="add-icon">
                    <f7-icon f7="app_badge_fill" />
                </div>
                <span>Create Blank App</span>
                <p>Mulai rancang formulir dari lembar kosong</p>
            </div>

            <!-- Start from Google Sheets Card -->
            <div class="app-card add-card sheet-add-card" @click="showSheetModal = true" role="button" tabindex="0">
                <div class="add-icon sheet-add-icon">
                    <f7-icon f7="logo_google" />
                </div>
                <span>From Google Sheets</span>
                <p>Impor kolom &amp; sinkronisasi 2 arah</p>
            </div>
        </div>

        <!-- Empty State (No Search Match) -->
        <div v-else-if="searchQuery.trim()" class="empty-state-card">
            <f7-icon f7="search" size="44" class="empty-state-icon" />
            <h3 class="empty-state-title">Aplikasi Tidak Ditemukan</h3>
            <p class="empty-state-desc">Tidak ada aplikasi yang cocok dengan kata kunci "{{ searchQuery }}".</p>
            <button class="clear-filter-btn" @click="searchQuery = ''">
                Reset Pencarian
            </button>
        </div>

        <!-- Empty State (No Apps Created Yet) -->
        <div v-else class="empty-state-card">
            <f7-icon f7="app_badge" size="48" class="empty-state-icon" />
            <h3 class="empty-state-title">Belum Ada Aplikasi</h3>
            <p class="empty-state-desc">Buat aplikasi pertama Anda untuk mulai mengumpulkan data survei secara offline.</p>
            <div class="empty-actions">
                <f7-button fill @click="showCreateDialog" class="empty-create-btn">
                    <f7-icon f7="plus" size="14" class="margin-right-half" />
                    Buat Aplikasi Baru
                </f7-button>
                <f7-button outline @click="showSheetModal = true" class="empty-sheet-btn">
                    <f7-icon f7="logo_google" size="14" class="margin-right-half" />
                    Impor Google Sheets
                </f7-button>
            </div>
        </div>

        <!-- Modals & Dialogs -->
        <AppTrashModal v-model:opened="showTrashModal" @restored="onAppRestored" />
        <CreateAppFromSheetModal v-model:opened="showSheetModal" @created="onAppCreatedFromSheet" />
        <CreateAppPopup
            v-model:opened="createPopupOpened"
            :loading="isCreating"
            @submit="handleCreateApp"
        />
    </f7-page>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores';
import { f7 } from 'framework7-vue';
import { computed, onMounted, ref } from 'vue';

import AppCard from './components/apps/AppCard.vue';
import AppsPageHeader from './components/apps/AppsPageHeader.vue';
import CreateAppPopup from './components/apps/CreateAppPopup.vue';
import type { AppItem, CreateAppPayload } from './components/apps/apps.types';
import AppTrashModal from './components/AppTrashModal.vue';
import CreateAppFromSheetModal from './components/CreateAppFromSheetModal.vue';
import './AppsPage.css';

const appStore = useAppStore();

const searchQuery = ref('');
const showTrashModal = ref(false);
const showSheetModal = ref(false);
const createPopupOpened = ref(false);
const isCreating = ref(false);

const PALETTE = ['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#0d9488'];

const apps = computed<AppItem[]>(() => {
    return appStore.apps.map(app => {
        const idNum = typeof app.id === 'number' ? app.id : parseInt(String(app.id)) || 0;
        const color = PALETTE[Math.abs(idNum) % PALETTE.length] ?? '#2563eb';
        return {
            id: app.id,
            slug: app.slug,
            name: app.name,
            description: app.description,
            color,
            formCount: app.tables_count || 0,
            memberCount: app.memberships_count || 0,
        };
    });
});

const filteredApps = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    if (!q) return apps.value;
    return apps.value.filter(app => {
        return app.name.toLowerCase().includes(q) || (app.description && app.description.toLowerCase().includes(q));
    });
});

function showCreateDialog() {
    createPopupOpened.value = true;
}

async function handleCreateApp(payload: CreateAppPayload) {
    isCreating.value = true;
    try {
        await appStore.createApp(payload);
        f7.toast.show({ text: 'Aplikasi berhasil dibuat', position: 'center', closeTimeout: 2000 });
        createPopupOpened.value = false;
        await appStore.fetchApps();
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Gagal membuat aplikasi';
        f7.dialog.alert(message);
    } finally {
        isCreating.value = false;
    }
}

async function onAppCreatedFromSheet() {
    await appStore.fetchApps();
}

function showAppMenu(app: AppItem) {
    const actions = f7.actions.create({
        buttons: [
            [
                { text: `Aplikasi: ${app.name}`, label: true },
                {
                    text: 'Open Application',
                    onClick: () => {
                        const router = f7?.views?.main?.router;
                        if (router) {
                            router.navigate(`/apps/${app.slug || app.id}`);
                        } else {
                            window.location.href = `/apps/${app.slug || app.id}`;
                        }
                    }
                },
                {
                    text: 'Edit App Settings & Tables',
                    onClick: () => {
                        const router = f7?.views?.main?.router;
                        if (router) {
                            router.navigate(`/editor/${app.slug || app.id}`);
                        } else {
                            window.location.href = `/editor/${app.slug || app.id}`;
                        }
                    }
                }
            ],
            [
                {
                    text: 'Move to Trash',
                    color: 'red',
                    onClick: () => confirmMoveToTrash(app),
                }
            ],
            [
                { text: 'Batal', color: 'gray' }
            ]
        ]
    });
    actions.open();
}

function confirmMoveToTrash(app: AppItem) {
    f7.dialog.confirm(
        `Pindahkan aplikasi "${app.name}" ke Sampah?\n\nFormulir akan dinonaktifkan untuk surveyor. Anda dapat memulihkannya kembali kapan saja dalam 30 hari.`,
        'Pindahkan ke Sampah',
        async () => {
            f7.preloader.show();
            try {
                await appStore.deleteApp(app.id);
                f7.preloader.hide();
                
                const undoToast = f7.toast.create({
                    text: `"${app.name}" dipindahkan ke Sampah`,
                    position: 'bottom',
                    closeButton: true,
                    closeButtonText: 'Batalkan (Undo)',
                    closeButtonColor: 'yellow',
                    closeTimeout: 7000,
                    on: {
                        closeButtonClick: async () => {
                            try {
                                await appStore.restoreApp(app.id);
                                f7.toast.show({
                                    text: `Aplikasi "${app.name}" telah dipulihkan!`,
                                    position: 'center',
                                    closeTimeout: 2000,
                                    cssClass: 'color-green'
                                });
                            } catch (restoreErr: unknown) {
                                const msg = restoreErr instanceof Error ? restoreErr.message : 'Gagal memulihkan aplikasi';
                                f7.dialog.alert(msg);
                            }
                        }
                    }
                });
                undoToast.open();
            } catch (err: unknown) {
                f7.preloader.hide();
                const msg = err instanceof Error ? err.message : 'Gagal memindahkan aplikasi ke sampah';
                f7.dialog.alert(msg);
            }
        }
    );
}

function refreshPageData() {
    createPopupOpened.value = false;
    appStore.fetchApps();
    appStore.fetchTrashedApps();
}

const onAppRestored = refreshPageData;
const onPageAfterIn = refreshPageData;
const onPageReinit = refreshPageData;

onMounted(() => {
    refreshPageData();
});
</script>
