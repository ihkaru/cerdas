<template>
    <f7-page name="home" ptr @ptr:refresh="refresh" @page:afterin="onPageAfterIn">
        <f7-navbar :sliding="false">

            <f7-nav-title sliding>Dashboard</f7-nav-title>
            <f7-nav-right>
                <f7-link icon-f7="arrow_2_circlepath" @click="handleSync" :class="{ 'fa-spin': isSyncing }"></f7-link>
                <f7-link icon-f7="square_arrow_right" @click="handleLogout"></f7-link>
            </f7-nav-right>
        </f7-navbar>



        <!-- Statistics Section -->
        <DashboardStats :stats="assignmentStats" :total="totalAssignments" :last-sync-time="lastSyncTime" />

        <!-- App Gallery - Click to see assignments -->
        <AppGallery :apps="apps" @open-app="openApp" />

    </f7-page>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
import { useSync } from '../../../common/composables/useSync';
import { useAuthStore } from '../../../common/stores/authStore';
import AppGallery from '../components/AppGallery.vue';
import DashboardStats from '../components/DashboardStats.vue';
import { useDashboardStore } from '../stores/dashboardStore';

const dashboardStore = useDashboardStore();
const { apps, totalAssignments, assignmentStats, lastSyncTime } = storeToRefs(dashboardStore);
const sync = useSync();
const auth = useAuthStore();
const isSyncing = ref(false);

onMounted(() => {
    dashboardStore.loadData();
});

const onPageAfterIn = () => {
    // Refresh data when page becomes visible (back navigation)
    // Pass force=true to ensure we get latest DB state
    dashboardStore.loadData(true);
};

const handleSync = async () => {
    if (isSyncing.value) return;
    isSyncing.value = true;
    f7.toast.show({ text: 'Syncing data...', position: 'bottom', closeTimeout: 1000 });

    try {
        await sync.sync();
        await dashboardStore.loadData(true); // Force refresh
        f7.toast.show({ text: 'Sync complete', position: 'bottom', closeTimeout: 2000, cssClass: 'color-green' });
    } catch (e: any) {
        console.error('Sync error', e);
        f7.dialog.alert('Sync failed: ' + (e.message || 'Check connection'), 'Error');
    } finally {
        isSyncing.value = false;
    }
};

const refresh = async (done: () => void) => {
    await dashboardStore.loadData(true);
    done();
};

const props = defineProps<{
    f7route?: any;
    f7router?: any;
}>();

const handleLogout = async () => {
    await auth.logout();
    dashboardStore.reset();
    props.f7router?.navigate('/login') || f7.views.main.router.navigate('/login');
};

const openApp = (id: string) => {
    console.log('Dashboard: Opening App', id);
    if (props.f7router) {
        props.f7router.navigate(`/app/${id}`);
    } else {
        console.warn('Dashboard: f7router prop missing, using global');
        f7.views.main.router.navigate(`/app/${id}`);
    }
}

</script>

<style scoped>
.warning-bg {
    background-color: #ff9800;
}

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
