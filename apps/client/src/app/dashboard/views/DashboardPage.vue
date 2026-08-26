<template>
    <f7-page name="home" ptr @ptr:refresh="refresh" @page:afterin="onPageAfterIn">
        <f7-navbar :sliding="false" class="premium-navbar">
            <f7-nav-title class="premium-title" style="user-select: none;">
                <span @click="handleTitleTap" style="cursor: pointer; display: inline-block; padding: 12px 24px; margin: -12px -24px; position: relative; z-index: 99999; pointer-events: auto;">Dashboard</span>
            </f7-nav-title>
            <f7-nav-right>
                <f7-link @click="handleSync" class="nav-icon-btn action-btn" :class="{ 'spinning': isSyncing }" aria-label="Sync">
                    <SvgIcon name="arrow_2_circlepath" :size="22" />
                </f7-link>
                <f7-link @click="settingsOpen = true" class="nav-icon-btn profile-btn" aria-label="Profil">
                    <SvgIcon name="person_circle" :size="22" />
                </f7-link>
            </f7-nav-right>
        </f7-navbar>

        <DashboardStats :stats="assignmentStats" :total="totalAssignments" :last-sync-time="lastSyncTime" />

        <ApkDownloadCard :latest-apk="latestApk" />

        <AppGallery :apps="appsWithStats" @open-app="openApp" @join-app="triggerJoinApp" />

        <!-- Settings / Profile Sheet -->
        <DashboardSettingsSheet v-model:opened="settingsOpen" :user="auth.user" :is-syncing="isSyncing"
            @sync="handleSync" @logout="handleLogout" @reset-database="handleResetDatabase" @join-app="triggerJoinApp" />
    </f7-page>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted, ref } from 'vue';
import SvgIcon from '@/components/common/SvgIcon.vue';
import { apiClient } from '@/common/api/ApiClient';
import { useDatabase } from '../../../common/composables/useDatabase';
import { useSync } from '../../../common/composables/useSync';
import { useAuthStore } from '../../../common/stores/authStore';
import AppGallery from '../components/AppGallery.vue';
import ApkDownloadCard from '../components/ApkDownloadCard.vue';
import DashboardSettingsSheet from '../components/DashboardSettingsSheet.vue';
import DashboardStats from '../components/DashboardStats.vue';
import { useDashboardStore } from '../stores/dashboardStore';

const props = defineProps<{
    f7route?: any;
    f7router?: any;
}>();

const dashboardStore = useDashboardStore();
const { apps, appsWithStats, totalAssignments, assignmentStats, lastSyncTime, latestApk } = storeToRefs(dashboardStore);
const sync = useSync();
const auth = useAuthStore();
const db = useDatabase();
const isSyncing = ref(false);
const settingsOpen = ref(false);

let titleTapCount = 0;
let titleTapTimer: any = null;

const handleTitleTap = () => {
    titleTapCount++;
    console.log(`[Debug] Dashboard title tapped: ${titleTapCount}/5`);
    if (titleTapTimer) clearTimeout(titleTapTimer);
    titleTapTimer = setTimeout(() => { titleTapCount = 0; }, 2000);

    if (titleTapCount >= 5) {
        console.log('[Debug] Triggering open-debug-menu event');
        window.dispatchEvent(new CustomEvent('open-debug-menu'));
        titleTapCount = 0;
        if (titleTapTimer) clearTimeout(titleTapTimer);
    }
};

const handleAppsDeactivated = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (detail && detail.names) {
        f7.dialog.alert(
            `Aplikasi (${detail.names}) telah dinonaktifkan oleh administrator. Seluruh data lokal aplikasi tersebut telah dibersihkan demi keamanan.`, 
            'Aplikasi Dinonaktifkan'
        );
    }
};

const handleApkUpdated = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (detail) {
        dashboardStore.latestApk = detail;
    }
};

onMounted(async () => {
    await dashboardStore.loadData();
    window.addEventListener('apps-deactivated', handleAppsDeactivated);
    window.addEventListener('latest-apk-updated', handleApkUpdated);

    if (navigator.onLine) {
        // If it's the first time (no apps, no last sync), show a non-obstructive preloader
        const isFirstSync = apps.value.length === 0 && !lastSyncTime.value;
        if (isFirstSync) isSyncing.value = true;

        sync.sync()
            .then(() => dashboardStore.loadData(true))
            .catch(err => console.error('Background sync failed', err))
            .finally(() => {
                if (isFirstSync) isSyncing.value = false;
            });
    }
});

onUnmounted(() => {
    window.removeEventListener('apps-deactivated', handleAppsDeactivated);
    window.removeEventListener('latest-apk-updated', handleApkUpdated);
});

const onPageAfterIn = () => {
    dashboardStore.loadData(true);
};

const handleSync = async () => {
    if (isSyncing.value) return;
    isSyncing.value = true;
    f7.toast.show({ text: 'Syncing data...', position: 'bottom', closeTimeout: 1000 });

    try {
        await sync.sync();
        await dashboardStore.loadData(true);
        f7.toast.show({ text: 'Sync complete', position: 'bottom', closeTimeout: 2000, cssClass: 'color-green' });
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Check connection';
        console.error('Sync error', e);
        f7.dialog.alert('Sync failed: ' + message, 'Error');
    } finally {
        isSyncing.value = false;
    }
};

const refresh = async (done: () => void) => {
    try {
        if (navigator.onLine) {
            await sync.sync();
        }
        await dashboardStore.loadData(true);
    } catch (e) {
        console.error('Pull-to-refresh sync error:', e);
    } finally {
        done();
    }
};

const handleLogout = async () => {
    await auth.logout();
    dashboardStore.reset();
    props.f7router?.navigate('/login') ?? f7.views.main.router.navigate('/login');
};

const handleResetDatabase = async () => {
    f7.dialog.preloader('Resetting local data...');
    try {
        await db.reset?.();
        f7.dialog.close();
        f7.toast.show({ text: 'Local data cleared. Please sync to restore.', position: 'bottom', closeTimeout: 3000 });
    } catch (e: any) {
        f7.dialog.close();
        f7.dialog.alert('Reset failed: ' + e.message, 'Error');
    }
};

const openApp = (id: string) => {
    props.f7router
        ? props.f7router.navigate(`/app/${id}`)
        : f7.views.main.router.navigate(`/app/${id}`);
};

const triggerJoinApp = () => {
    f7.dialog.prompt(
        'Masukkan Link atau Kode Undangan:',
        'Gabung Aplikasi',
        async (input?: string) => {
            if (!input) return;
            const clean = input.trim();
            let token = clean;
            if (clean.includes('/join/')) {
                const parts = clean.split('/join/');
                const lastPart = parts[parts.length - 1];
                token = lastPart ? (lastPart.split(/[?#]/)[0] || '') : '';
            }
            
            if (!token) {
                f7.dialog.alert('Format link atau kode undangan tidak valid.', 'Error');
                return;
            }

            f7.dialog.preloader('Memproses Undangan...');
            try {
                const res = await apiClient.post('/join', { token });
                f7.dialog.close();
                
                if (res.success) {
                    f7.dialog.alert(
                        `Berhasil bergabung! Melakukan sinkronisasi data aplikasi baru...`, 
                        'Sukses', 
                        async () => {
                            await handleSync();
                        }
                    );
                } else {
                    f7.dialog.alert(res.message || 'Gagal bergabung ke aplikasi.', 'Error');
                }
            } catch (err: any) {
                f7.dialog.close();
                const msg = err.response?.data?.message || 'Gagal bergabung. Tautan mungkin tidak valid atau sudah kedaluwarsa.';
                f7.dialog.alert(msg, 'Error');
            }
        }
    );
};
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