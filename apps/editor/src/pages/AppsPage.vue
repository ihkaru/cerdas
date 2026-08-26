<template>
    <f7-page name="apps" class="apps-page" @page:afterin="onPageAfterIn" @page:reinit="onPageReinit">
        <!-- Page Header -->
        <div class="page-header">
            <div class="header-info">
                <h1>Apps</h1>
                <p>Manage your data collection applications</p>
            </div>
            <div class="header-actions display-flex align-items-center gap-half">
                <f7-button outline @click="showTrashModal = true" class="trash-btn">
                    <f7-icon f7="trash" />
                    Trash
                    <span v-if="appStore.trashedApps?.length" class="trash-count-badge">
                        {{ appStore.trashedApps.length }}
                    </span>
                </f7-button>
                <f7-button fill @click="showCreateDialog" class="create-btn">
                    <f7-icon f7="plus" />
                    New App
                </f7-button>
            </div>
        </div>

        <!-- Apps Grid -->
        <div class="apps-grid" v-if="apps.length > 0">
            <a v-for="app in apps" :key="app.id" :href="`/apps/${app.slug}`" class="app-card">
                <div class="card-header">
                    <div class="app-avatar" :style="{ background: app.color }">
                        {{ app.name.substring(0, 2).toUpperCase() }}
                    </div>
                    <div class="card-menu">
                        <f7-link icon-f7="ellipsis" @click.prevent.stop="showAppMenu(app)" />
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

        <!-- App Trash Modal -->
        <AppTrashModal v-model:opened="showTrashModal" @restored="onAppRestored" />

        <!-- Create App Popup - MUST be inside f7-page for proper lifecycle management -->
        <f7-popup class="create-app-popup" v-model:opened="createPopupOpened" @popup:closed="resetCreateForm"
            @popup:open="onPopupOpen">
            <f7-page>
                <f7-navbar title="Create New App">
                    <f7-nav-right>
                        <f7-link popup-close>Cancel</f7-link>
                    </f7-nav-right>
                </f7-navbar>
                <f7-block style="margin-bottom: 72px;">
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
                        
                        <f7-list-item title="Collect Data Forever (No Deadline)">
                            <template #after>
                                <f7-toggle :checked="newApp.is_evergreen" color="green"
                                    @toggle:change="newApp.is_evergreen = $event" />
                            </template>
                        </f7-list-item>

                        <template v-if="!newApp.is_evergreen">
                            <f7-list-input 
                                label="Start Date & Time (Open)" 
                                type="datetime-local" 
                                placeholder="Select start date"
                                :value="newApp.start_date" 
                                @input="newApp.start_date = $event.target.value" 
                                clear-button 
                            />
                            <f7-list-input 
                                label="End Date & Time (Deadline)" 
                                type="datetime-local" 
                                placeholder="Select end date"
                                :value="newApp.end_date" 
                                @input="newApp.end_date = $event.target.value" 
                                clear-button 
                            />
                            <f7-list-item title="After Deadline Behavior" smart-select :smart-select-params="{ openIn: 'popover' }">
                                <select :value="newApp.expired_behavior" @change="e => newApp.expired_behavior = (e.target as HTMLSelectElement).value">
                                    <option value="read_only">Kunci Form (Read Only)</option>
                                    <option value="hidden">Sembunyikan Form (Hidden)</option>
                                </select>
                            </f7-list-item>
                        </template>
                    </f7-list>
                </f7-block>
                <f7-toolbar bottom class="create-app-footer">
                    <f7-button fill large @click="handleCreateApp" :loading="isCreating" :disabled="!newApp.name" style="width: 100%;">
                        Create App
                    </f7-button>
                </f7-toolbar>
            </f7-page>
        </f7-popup>
    </f7-page>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores';
import { f7 } from 'framework7-vue';
import { computed, reactive, ref, onMounted, onBeforeUnmount } from 'vue';
import AppTrashModal from './components/AppTrashModal.vue';

const appStore = useAppStore();

// ============================================================================
// State
// ============================================================================

const showTrashModal = ref(false);
const createPopupOpened = ref(false);
const isCreating = ref(false);
const newApp = reactive({
    name: '',
    description: '',
    mode: 'simple',
    is_evergreen: true,
    start_date: '',
    end_date: '',
    expired_behavior: 'read_only'
});

const apps = computed(() => {
    const colors = ['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#ec4899'];
    return appStore.apps.map(app => ({
        id: app.id,
        slug: app.slug,
        name: app.name,
        description: app.description,
        color: colors[(typeof app.id === 'number' ? app.id : parseInt(String(app.id)) || 0) % colors.length] || colors[0],
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
    newApp.mode = 'simple';
    newApp.is_evergreen = true;
    newApp.start_date = '';
    newApp.end_date = '';
    newApp.expired_behavior = 'read_only';
    isCreating.value = false;
}

function onPopupOpen() {
    console.log('[AppsPage] popup:open EVENT FIRED, createPopupOpened:', createPopupOpened.value);
}

async function handleCreateApp() {
    if (!newApp.name || !newApp.name.trim()) return;

    isCreating.value = true;
    try {
        const payload: {
            name: string;
            description?: string;
            mode?: string;
            start_date?: string | null;
            end_date?: string | null;
            expired_behavior?: string;
        } = {
            name: newApp.name.trim(),
            description: newApp.description?.trim(),
            mode: newApp.mode
        };
        
        if (!newApp.is_evergreen) {
            payload.start_date = newApp.start_date ? new Date(newApp.start_date).toISOString() : null;
            payload.end_date = newApp.end_date ? new Date(newApp.end_date).toISOString() : null;
            payload.expired_behavior = newApp.expired_behavior;
        }

        await appStore.createApp(payload);
        f7.toast.show({ text: 'App created successfully', position: 'center', closeTimeout: 2000 });
        createPopupOpened.value = false;
    } catch (e: any) {
        f7.dialog.alert(e.message || 'Failed to create app');
    } finally {
        isCreating.value = false;
    }
}

function showAppMenu(app: any) {
    const actions = f7.actions.create({
        buttons: [
            [
                {
                    text: `Aplikasi: ${app.name}`,
                    label: true,
                },
                {
                    text: 'Open Application',
                    onClick: () => {
                        const f7Instance = f7 || (window as any).f7;
                        if (f7Instance?.views?.main?.router) {
                            f7Instance.views.main.router.navigate(`/apps/${app.slug || app.id}`);
                        } else {
                            window.location.href = `/apps/${app.slug || app.id}`;
                        }
                    }
                },
                {
                    text: 'Edit App Settings & Tables',
                    onClick: () => {
                        const f7Instance = f7 || (window as any).f7;
                        if (f7Instance?.views?.main?.router) {
                            f7Instance.views.main.router.navigate(`/editor/${app.slug || app.id}`);
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
                    onClick: () => {
                        confirmMoveToTrash(app);
                    }
                }
            ],
            [
                {
                    text: 'Cancel',
                    color: 'gray',
                }
            ]
        ]
    });
    actions.open();
}

function confirmMoveToTrash(app: any) {
    f7.dialog.confirm(
        `Pindahkan aplikasi "${app.name}" ke Sampah?\n\nFormulir akan dinonaktifkan untuk surveyor. Anda dapat memulihkannya kembali kapan saja dalam 30 hari.`,
        'Pindahkan ke Sampah',
        async () => {
            f7.preloader.show();
            try {
                await appStore.deleteApp(app.id);
                f7.preloader.hide();
                
                // Toast notification with UNDO action
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
                            } catch (e: any) {
                                f7.dialog.alert(e.message || 'Gagal memulihkan aplikasi');
                            }
                        }
                    }
                });
                undoToast.open();
            } catch (e: any) {
                f7.preloader.hide();
                f7.dialog.alert(e.message || 'Gagal memindahkan aplikasi ke sampah');
            }
        }
    );
}

function onAppRestored() {
    appStore.fetchApps();
    appStore.fetchTrashedApps();
}

function onPageAfterIn() {
    console.log('[AppsPage] page:afterin triggered, current apps:', appStore.apps.length);
    createPopupOpened.value = false;
    appStore.fetchApps();
    appStore.fetchTrashedApps();
}

function onPageReinit() {
    console.log('[AppsPage] page:reinit triggered, current apps:', appStore.apps.length);
    createPopupOpened.value = false;
    appStore.fetchApps();
    appStore.fetchTrashedApps();
}

onMounted(() => {
    console.log('[AppsPage] MOUNTED, current apps:', appStore.apps.length);
    createPopupOpened.value = false;
    appStore.fetchApps();
    appStore.fetchTrashedApps();
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

/* Create & Trash Buttons - consistent styling */
.create-btn {
    --f7-button-bg-color: #2563eb;
    --f7-button-hover-bg-color: #1d4ed8;
    border-radius: 8px;
    font-weight: 500;
}

.trash-btn {
    --f7-button-text-color: #64748b;
    --f7-button-border-color: #cbd5e1;
    border-radius: 8px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
}

.trash-btn:hover {
    --f7-button-text-color: #dc2626;
    --f7-button-border-color: #fca5a5;
    background: #fef2f2;
}

.trash-count-badge {
    background: #ef4444;
    color: white;
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 10px;
    font-weight: 600;
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

.create-app-footer {
    background: #fff !important;
    border-top: 1px solid #e2e8f0;
    height: 64px !important;
    padding: 0 16px;
    display: flex;
    align-items: center;
    box-sizing: border-box;
}
</style>
