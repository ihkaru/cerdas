<template>
    <f7-page name="home" class="home-page" @page:afterin="onPageAfterIn">
        <!-- Welcome Section -->

        <section class="welcome-section">
            <div class="welcome-text">
                <h1>Welcome back, Admin</h1>
                <p>Create and manage your data collection apps</p>
            </div>
            <f7-button fill href="/apps" class="create-btn">
                <f7-icon f7="app_badge" />
                Browse Apps
            </f7-button>
        </section>

        <!-- Stats Cards -->
        <section class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue">
                    <f7-icon f7="app_fill" />
                </div>
                <div class="stat-info">
                    <div class="stat-value">{{ stats.totalApps }}</div>
                    <div class="stat-label">Total Apps</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">
                    <f7-icon f7="doc_text_fill" />
                </div>
                <div class="stat-info">
                    <div class="stat-value">{{ stats.totalForms }}</div>
                    <div class="stat-label">Total Forms</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">
                    <f7-icon f7="checkmark_circle_fill" />
                </div>
                <div class="stat-info">
                    <div class="stat-value">{{ stats.published }}</div>
                    <div class="stat-label">Published</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple">
                    <f7-icon f7="doc_on_clipboard_fill" />
                </div>
                <div class="stat-info">
                    <div class="stat-value">{{ stats.responses }}</div>
                    <div class="stat-label">Responses</div>
                </div>
            </div>
        </section>

        <!-- Two Column Layout -->
        <div class="content-grid">
            <!-- Recent Forms -->
            <section class="content-card">
                <div class="card-header">
                    <h2>Recent Forms</h2>
                    <f7-link href="/apps">View All →</f7-link>
                </div>
                <div class="form-list">
                    <a v-for="form in recentForms" :key="form.id" :href="`/forms/${form.id}`" class="form-item">
                        <div class="form-icon" :class="form.status">
                            <f7-icon :f7="form.icon" />
                        </div>
                        <div class="form-info">
                            <div class="form-name">{{ form.name }}</div>
                            <div class="form-meta">{{ form.appName }}</div>
                        </div>
                        <div class="form-status">
                            <span class="status-badge" :class="form.status">{{ form.status }}</span>
                            <span class="form-time">{{ form.updatedAt }}</span>
                        </div>
                    </a>
                </div>
            </section>

            <!-- Quick Actions -->
            <section class="content-card">
                <div class="card-header">
                    <h2>Quick Actions</h2>
                </div>
                <div class="actions-grid">
                    <a href="/apps" class="action-card">
                        <div class="action-icon blue">
                            <f7-icon f7="app_badge_fill" />
                        </div>
                        <div class="action-text">
                            <div class="action-title">New App</div>
                            <div class="action-desc">Create new application</div>
                        </div>
                    </a>
                    <a href="#" class="action-card">
                        <div class="action-icon teal">
                            <f7-icon f7="arrow_down_doc_fill" />
                        </div>
                        <div class="action-text">
                            <div class="action-title">Import</div>
                            <div class="action-desc">From JSON file</div>
                        </div>
                    </a>
                    <a href="#" class="action-card">
                        <div class="action-icon orange">
                            <f7-icon f7="doc_on_doc_fill" />
                        </div>
                        <div class="action-text">
                            <div class="action-title">Templates</div>
                            <div class="action-desc">Start from template</div>
                        </div>
                    </a>
                    <a href="#" class="action-card">
                        <div class="action-icon purple">
                            <f7-icon f7="person_2_fill" />
                        </div>
                        <div class="action-text">
                            <div class="action-title">Team</div>
                            <div class="action-desc">Manage members</div>
                        </div>
                    </a>
                </div>
            </section>
        </div>
    </f7-page>
</template>

<script setup lang="ts">
import { useAppStore, type RecentForm } from '@/stores';
import { computed } from 'vue';

const appStore = useAppStore();

// ============================================================================
// State
// ============================================================================

const stats = computed(() => appStore.stats);

const recentForms = computed(() => {
    return appStore.recentForms.map((f: RecentForm) => ({
        id: f.id,
        name: f.name,
        appName: f.app_name || 'Unknown App',
        icon: 'doc_text_fill', // Default icon
        status: f.version ? 'v' + f.version : 'Draft',
        updatedAt: new Date(f.updated_at).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
    }));
});


const onPageAfterIn = () => {
    // Fetch data only when page is fully visible
    // Check if data is already loaded to avoid excessive refetches if desired,
    // but for dashboard fresher data is usually better.
    appStore.fetchDashboard();
};

</script>

<style scoped>
/* ============================================================================
   Home Page Content Styles
   ============================================================================ */

.home-page {
    padding: 24px 32px;
    background: #f8fafc;
}

/* Welcome Section */
.welcome-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
}

.welcome-text h1 {
    font-size: 24px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px 0;
}

.welcome-text p {
    font-size: 14px;
    color: #64748b;
    margin: 0;
}

.create-btn {
    --f7-button-bg-color: #2563eb;
    --f7-button-hover-bg-color: #1d4ed8;
    border-radius: 8px;
    font-weight: 500;
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
}

.stat-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.stat-icon.blue {
    background: #eff6ff;
    color: #2563eb;
}

.stat-icon.green {
    background: #f0fdf4;
    color: #16a34a;
}

.stat-icon.orange {
    background: #fff7ed;
    color: #ea580c;
}

.stat-icon.purple {
    background: #faf5ff;
    color: #9333ea;
}

.stat-icon :deep(.icon) {
    font-size: 22px;
}

.stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
}

.stat-label {
    font-size: 13px;
    color: #64748b;
}

/* Content Grid */
.content-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;
}

.content-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.card-header h2 {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.card-header a {
    font-size: 13px;
    color: #2563eb;
    text-decoration: none;
}

/* Form List */
.form-list {
    display: flex;
    flex-direction: column;
}

.form-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    text-decoration: none;
    transition: background 0.15s;
}

.form-item:hover {
    background: #f8fafc;
}

.form-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f5f9;
    color: #64748b;
}

.form-icon.published {
    background: #f0fdf4;
    color: #16a34a;
}

.form-icon.draft {
    background: #fff7ed;
    color: #ea580c;
}

.form-icon :deep(.icon) {
    font-size: 18px;
}

.form-info {
    flex: 1;
    min-width: 0;
}

.form-name {
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
}

.form-meta {
    font-size: 12px;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.form-status {
    text-align: right;
}

.status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    text-transform: capitalize;
}

.status-badge.published {
    background: #dcfce7;
    color: #16a34a;
}

.status-badge.draft {
    background: #fef3c7;
    color: #d97706;
}

.form-time {
    display: block;
    font-size: 11px;
    color: #94a3b8;
    margin-top: 2px;
}

/* Actions Grid */
.actions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.action-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 10px;
    text-decoration: none;
    transition: all 0.15s;
}

.action-card:hover {
    background: #f1f5f9;
    transform: translateY(-1px);
}

.action-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.action-icon.blue {
    background: #dbeafe;
    color: #2563eb;
}

.action-icon.teal {
    background: #ccfbf1;
    color: #0d9488;
}

.action-icon.orange {
    background: #fed7aa;
    color: #ea580c;
}

.action-icon.purple {
    background: #e9d5ff;
    color: #9333ea;
}

.action-icon :deep(.icon) {
    font-size: 18px;
}

.action-title {
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
}

.action-desc {
    font-size: 12px;
    color: #64748b;
}
</style>
