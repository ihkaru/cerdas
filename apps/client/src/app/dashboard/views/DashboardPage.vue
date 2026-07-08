<template>
    <f7-page name="home" ptr @ptr:refresh="refresh" @page:afterin="onPageAfterIn">
        <f7-navbar :sliding="false" class="premium-navbar">
            <f7-nav-title class="premium-title" @click="handleTitleTap" style="cursor: pointer; user-select: none;">Dashboard</f7-nav-title>
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

        <AppGallery :apps="appsWithStats" @open-app="openApp" />

        <!-- Settings / Profile Sheet -->
        <DashboardSettingsSheet v-model:opened="settingsOpen" :user="auth.user" :is-syncing="isSyncing"
            @sync="handleSync" @logout="handleLogout" @reset-database="handleResetDatabase" />
    </f7-page>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
import SvgIcon from '@/components/common/SvgIcon.vue';
import { useDatabase } from '../../../common/composables/useDatabase';
import { useSync } from '../../../common/composables/useSync';
import { useAuthStore } from '../../../common/stores/authStore';
import AppGallery from '../components/AppGallery.vue';
import DashboardSettingsSheet from '../components/DashboardSettingsSheet.vue';
import DashboardStats from '../components/DashboardStats.vue';
import { useDashboardStore } from '../stores/dashboardStore';

const props = defineProps<{
    f7route?: any;
    f7router?: any;
}>();

const dashboardStore = useDashboardStore();
const { apps, appsWithStats, totalAssignments, assignmentStats, lastSyncTime } = storeToRefs(dashboardStore);
const sync = useSync();
const auth = useAuthStore();
const db = useDatabase();
const isSyncing = ref(false);
const settingsOpen = ref(false);

let titleTapCount = 0;
let titleTapTimer: any = null;

const handleTitleTap = () => {
    titleTapCount++;
    if (titleTapTimer) clearTimeout(titleTapTimer);
    titleTapTimer = setTimeout(() => { titleTapCount = 0; }, 2000);

    if (titleTapCount >= 5) {
        window.dispatchEvent(new CustomEvent('open-debug-menu'));
        titleTapCount = 0;
        if (titleTapTimer) clearTimeout(titleTapTimer);
    }
};

onMounted(async () => {
    await dashboardStore.loadData();

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
    await dashboardStore.loadData(true);
    done();
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