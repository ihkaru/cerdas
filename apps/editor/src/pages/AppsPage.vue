<template>
    <f7-page name="apps" class="apps-page" @page:afterin="onPageAfterIn" @page:reinit="onPageReinit">
        <!-- Page Header -->
        <div class="page-header">
            <div class="header-info">
                <h1>Apps</h1>
                <p>Manage your data collection applications</p>
            </div>
            <f7-button fill @click="showCreateDialog" class="create-btn">
                <f7-icon f7="plus" />
                New App
            </f7-button>
        </div>

        <!-- Apps Grid -->
        <div class="apps-grid" v-if="apps.length > 0">
            <a v-for="app in apps" :key="app.id" :href="`/apps/${app.slug}`" class="app-card">
                <div class="card-header">
                    <div class="app-avatar" :style="{ background: app.color }">
                        {{ app.name.substring(0, 2).toUpperCase() }}
                    </div>
                    <div class="card-menu">
                        <f7-link icon-f7="ellipsis" @click.prevent="showAppMenu(app)" />
                    </div>
                </div>
                <div class="card-body">
                    <h3>{{ app.name }}</h3>
                    <p>{{ app.description || 'No description' }}</p>
                </div>
                <div class="card-stats">
                    <div class="stat">
                        <f7-icon f7="doc_text" />
                        <span>{{ app.formCount }} forms</span>
                    </div>
                    <div class="stat">
                        <f7-icon f7="person_2" />
                        <span>{{ app.memberCount }} members</span>
                    </div>
                </div>
                <div class="card-footer">
                    <span class="view-btn">
                        Open App
                        <f7-icon f7="arrow_right" />
                    </span>
                </div>
            </a>

            <!-- Add New App Card -->
            <div class="app-card add-card" @click="showCreateDialog">
                <div class="add-icon">
                    <f7-icon f7="app_badge_fill" />
                </div>
                <span>Create New App</span>
                <p>Start building a new data collection app</p>
            </div>
        </div>

        <div v-else class="empty-state-container" style="text-align: center; padding: 40px; color: #64748b;">
            <f7-icon f7="app_badge" size="48" style="margin-bottom: 16px; opacity: 0.5;"></f7-icon>
            <h3>No Apps Found</h3>
            <p>Create your first application to get started.</p>
            <f7-button fill @click="showCreateDialog" style="max-width: 200px; margin: 20px auto;">Create
                App</f7-button>
        </div>

        <!-- Recent Activity Section -->
        <section class="activity-section">
            <div class="section-header">
                <h2>Recent Activity</h2>
            </div>
            <div class="activity-list">
                <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
                    <div class="activity-icon" :class="activity.type">
                        <f7-icon :f7="activity.icon" />
                    </div>
                    <div class="activity-info">
                        <span class="activity-text">{{ activity.text }}</span>
                        <span class="activity-time">{{ activity.time }}</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Create App Popup - MUST be inside f7-page for proper lifecycle management -->
        <f7-popup class="create-app-popup" v-model:opened="createPopupOpened" @popup:closed="resetCreateForm"
            @popup:open="onPopupOpen">
            <f7-page>
                <f7-navbar title="Create New App">
                    <f7-nav-right>
                        <f7-link popup-close>Cancel</f7-link>
                    </f7-nav-right>
                </f7-navbar>
                <f7-block>
                    <p>Enter the details for your new application.</p>
                    <f7-list strong-ios dividers-ios inset-ios>
                        <f7-list-input label="App Name" type="text" placeholder="e.g. Housing Survey 2026"
                            :value="newApp.name" @input="newApp.name = $event.target.value" clear-button />
                        <f7-list-input type="textarea" label="Description" placeholder="Brief description of the app..."
                            :value="newApp.description" @input="newApp.description = $event.target.value" />
                        <f7-list-input label="Mode" type="select" :value="newApp.mode"
                            @change="newApp.mode = $event.target.value" placeholder="Select mode">
                            <option value="simple">Simple (Direct Membership)</option>
                            <option value="complex">Complex (Organization Based)</option>
                        </f7-list-input>
                    </f7-list>
                    <f7-button fill large @click="handleCreateApp" :loading="isCreating" :disabled="!newApp.name">
                        Create App
                    </f7-button>
                </f7-block>
            </f7-page>
        </f7-popup>
    </f7-page>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores';
import { f7 } from 'framework7-vue';
import { computed, reactive, ref } from 'vue';

const appStore = useAppStore();

// ============================================================================
// State
// ============================================================================

const createPopupOpened = ref(false);
const isCreating = ref(false);
const newApp = reactive({
    name: '',
    description: '',
    mode: 'simple'
});

const apps = computed(() => {
    const colors = ['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#ec4899'];
    return appStore.apps.map(app => ({
        id: app.id,
        slug: app.slug,
        name: app.name,
        description: app.description,
        color: colors[app.id % colors.length] || colors[0],
        formCount: app.tables_count || 0,
        memberCount: app.memberships_count || 0,
    }));
});

const recentActivity = ref([
    { id: '1', type: 'form', icon: 'doc_text_fill', text: 'Form Pendataan updated in Survey RTLH', time: '2 hours ago' },
    { id: '2', type: 'publish', icon: 'checkmark_circle_fill', text: 'Sakernas 2026 published v2', time: 'Yesterday' },
    { id: '3', type: 'user', icon: 'person_badge_plus_fill', text: '3 new members added to Census Pilot', time: '3 days ago' },
]);

// ============================================================================
// Methods
// ============================================================================

function showCreateDialog() {
    createPopupOpened.value = true;
}

function resetCreateForm() {
    newApp.name = '';
    newApp.description = '';
    isCreating.value = false;
}

function onPopupOpen() {
    console.log('[AppsPage] popup:open EVENT FIRED, createPopupOpened:', createPopupOpened.value, new Error().stack);
}

async function handleCreateApp() {
    if (!newApp.name || !newApp.name.trim()) return;

    isCreating.value = true;
    try {
        await appStore.createApp({
            name: newApp.name.trim(),
            description: newApp.description?.trim(),
            mode: newApp.mode
        });
        f7.toast.show({ text: 'App created successfully', position: 'center', closeTimeout: 2000 });
        createPopupOpened.value = false;
    } catch (e: any) {
        f7.dialog.alert(e.message || 'Failed to create app');
    } finally {
        isCreating.value = false;
    }
}

import { onMounted } from 'vue';

function showAppMenu(app: any) {
    f7.toast.show({ text: `Menu for ${app.name}`, position: 'center', closeTimeout: 1500 });
}

function onPageAfterIn() {
    console.log('[AppsPage] page:afterin triggered, current apps:', appStore.apps.length);
    // Ensure popup is closed when entering page
    createPopupOpened.value = false;
    appStore.fetchApps();
}

function onPageReinit() {
    console.log('[AppsPage] page:reinit triggered, current apps:', appStore.apps.length);
    // Ensure popup is closed when page is reinitialized
    createPopupOpened.value = false;
    appStore.fetchApps();
}

import { onBeforeUnmount } from 'vue';

onMounted(() => {
    console.log('[AppsPage] MOUNTED, current apps:', appStore.apps.length);
    // Ensure popup is closed on mount
    createPopupOpened.value = false;
    appStore.fetchApps();
});

onBeforeUnmount(() => {
    console.log('[AppsPage] UNMOUNTING, closing popup');
    createPopupOpened.value = false;
});
</script>

<style scoped>
/* ============================================================================
   Apps Page Styles
   ============================================================================ */

.apps-page {
    padding: 24px 32px;
    background: #f8fafc;
}

/* Create Button - consistent styling */
.create-btn {
    --f7-button-bg-color: #2563eb;
    --f7-button-hover-bg-color: #1d4ed8;
    border-radius: 8px;
    font-weight: 500;
}

/* Page Header */
.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
}

.page-header h1 {
    font-size: 24px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.page-header p {
    font-size: 14px;
    color: #64748b;
    margin: 4px 0 0 0;
}

/* Apps Grid */
.apps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
}

.app-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: all 0.2s;
    border: 1px solid transparent;
    text-decoration: none;
    display: block;
}

.app-card:hover {
    border-color: #2563eb;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.app-avatar {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
    font-weight: 600;
}

.card-menu {
    opacity: 0;
    transition: opacity 0.15s;
}

.app-card:hover .card-menu {
    opacity: 1;
}

.card-body h3 {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 8px 0;
}

.card-body p {
    font-size: 14px;
    color: #64748b;
    margin: 0;
    line-height: 1.4;
}

.card-stats {
    display: flex;
    gap: 20px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f1f5f9;
}

.stat {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #64748b;
}

.stat :deep(.icon) {
    font-size: 14px;
}

.card-footer {
    margin-top: 16px;
}

.view-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #2563eb;
    font-size: 14px;
    font-weight: 500;
}

.view-btn :deep(.icon) {
    font-size: 14px;
}

/* Add Card */
.add-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 2px dashed #e2e8f0;
    background: transparent;
    min-height: 240px;
    cursor: pointer;
    text-align: center;
}

.add-card:hover {
    border-color: #2563eb;
    background: #f8fafc;
}

.add-icon {
    color: #94a3b8;
    margin-bottom: 12px;
}

.add-icon :deep(.icon) {
    font-size: 40px;
}

.add-card>span {
    font-size: 16px;
    font-weight: 500;
    color: #1e293b;
}

.add-card>p {
    font-size: 13px;
    color: #64748b;
    margin-top: 4px;
}

/* Activity Section */
.activity-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
}

.section-header {
    margin-bottom: 20px;
}

.section-header h2 {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.activity-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.activity-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
}

.activity-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.activity-icon.form {
    background: #dbeafe;
    color: #2563eb;
}

.activity-icon.publish {
    background: #dcfce7;
    color: #16a34a;
}

.activity-icon.user {
    background: #fef3c7;
    color: #d97706;
}

.activity-icon :deep(.icon) {
    font-size: 16px;
}

.activity-info {
    flex: 1;
}

.activity-text {
    display: block;
    font-size: 14px;
    color: #1e293b;
}

.activity-time {
    display: block;
    font-size: 12px;
    color: #64748b;
    margin-top: 2px;
}
</style>
