<template>
    <!-- Header of Section -->
    <div class="section-header">
        <h2 class="section-title">My Apps</h2>
    </div>

    <!-- Active Apps Gallery -->
    <div class="app-grid padding-horizontal padding-bottom">
        <div v-for="app in activeApps" :key="app.id" class="app-card" :class="{ 'app-card--scheduled': app.isScheduled }" @click="handleApp(app)">
            <!-- Urgency/Scheduled Badges -->
            <div v-if="app.isScheduled" class="app-badge app-badge--scheduled" aria-label="Belum dimulai">
                <f7-icon f7="lock_fill" size="10"></f7-icon>
            </div>
            <div v-else-if="app.stats.pending > 0" class="app-badge app-badge--pending" aria-label="Pending assignments">
                {{ app.stats.pending }}
            </div>
            <div v-else-if="app.stats.in_progress > 0" class="app-badge app-badge--progress" aria-label="In progress assignments">
                {{ app.stats.in_progress }}
            </div>

            <!-- Icon Wrapper -->
            <div class="app-icon-wrapper" :class="{ 
                'app-icon-wrapper--active': app.stats.in_progress > 0 && !app.isScheduled,
                'app-icon-wrapper--scheduled': app.isScheduled 
            }">
                <f7-icon :f7="getAppIcon(app)" size="26" class="app-icon"></f7-icon>
            </div>

            <!-- Text Info -->
            <div class="app-name">{{ app.name }}</div>
            <div v-if="app.isScheduled" class="app-desc app-desc--scheduled">
                Mulai {{ formatDate(app.start_date) }}
            </div>
            <div v-else class="app-desc">{{ app.description || 'Data Collection' }}</div>

            <!-- Progress Meter -->
            <div v-if="app.stats.total > 0 && !app.isScheduled" class="app-card-progress">
                <div class="progress-details">
                    <span class="progress-details-text">{{ app.stats.completed }} / {{ app.stats.total }} Selesai</span>
                    <span class="progress-details-pct">{{ Math.round((app.stats.completed / app.stats.total) * 100) }}%</span>
                </div>
                <div class="mini-progress-track">
                    <div class="mini-progress-fill" :style="{ width: (app.stats.completed / app.stats.total * 100) + '%' }"></div>
                </div>
            </div>
        </div>

        <!-- Empty State (Only if absolutely no apps are loaded) -->
        <div v-if="apps.length === 0" class="app-empty">
            <div class="app-empty-icon-wrapper">
                <f7-icon f7="square_stack_3d_up" size="32" class="app-empty-icon"></f7-icon>
            </div>
            <p class="app-empty-title">No Apps Installed</p>
            <p class="app-empty-sub">Sync to download your apps</p>
        </div>

        <!-- Special Active Apps Empty State (If there are apps but all are completed) -->
        <div v-else-if="activeApps.length === 0 && completedApps.length > 0" class="app-empty-active">
            <f7-icon f7="checkmark_seal" size="28" class="all-done-icon"></f7-icon>
            <p class="all-done-title">Semua Tugas Selesai!</p>
            <p class="all-done-sub">Semua assignment di semua aplikasi Anda telah diselesaikan.</p>
        </div>
    </div>

    <!-- Collapsible Completed Apps Section -->
    <div v-if="completedApps.length > 0" class="completed-section">
        <button class="completed-header" @click="showCompleted = !showCompleted" :aria-expanded="showCompleted">
            <div class="completed-header-left">
                <f7-icon f7="checkmark_seal_fill" size="16" class="completed-header-icon"></f7-icon>
                <span class="completed-title">Aplikasi Selesai ({{ completedApps.length }})</span>
            </div>
            <f7-icon :f7="showCompleted ? 'chevron_up' : 'chevron_down'" size="16" class="completed-chevron"></f7-icon>
        </button>

        <div v-if="showCompleted" class="completed-grid padding-horizontal padding-bottom animated-fade-in">
            <div v-for="app in completedApps" :key="app.id" class="app-card app-card--completed" @click="handleApp(app)">
                <!-- Checkmark on completed app icon wrapper -->
                <div class="app-icon-wrapper app-icon-wrapper--completed">
                    <f7-icon f7="checkmark_circle_fill" size="24" class="app-icon app-icon--completed"></f7-icon>
                </div>
                
                <div class="app-name">{{ app.name }}</div>
                <div class="app-desc">Selesai • {{ app.stats.total }} Tugas</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { f7 } from 'framework7-vue';
import type { AppWithStats } from '../types';

const props = defineProps<{
    apps: AppWithStats[];
}>();

const emit = defineEmits<{
    (e: 'open-app', id: string): void;
}>();

const showCompleted = ref(false);

const activeApps = computed(() => {
    return props.apps.filter(app => !app.isCompleted);
});

const completedApps = computed(() => {
    return props.apps.filter(app => app.isCompleted);
});

const handleApp = (app: AppWithStats) => {
    if (app.isScheduled) {
        const formattedDate = formatDate(app.start_date);
        f7.toast.show({
            text: `Aplikasi belum dimulai. Dibuka pada ${formattedDate}`,
            position: 'bottom',
            closeTimeout: 3000,
            cssClass: 'color-orange'
        });
        return;
    }
    emit('open-app', app.id);
};

const getAppIcon = (app: AppWithStats) => {
    if (app.isScheduled) return 'lock_fill';
    return 'square_stack_3d_up_fill';
};

const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    } catch {
        return dateStr;
    }
};
</script>

<style scoped>
/* Section header: neutral, not theme-colored */
.section-header {
    padding: 16px 16px 8px;
}

.section-title {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
    color: #111827;
    letter-spacing: -0.2px;
}

/* ── Grid ── */
.app-grid, .completed-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

/* ── Card ── */
.app-card {
    background: var(--f7-block-bg-color, #fff);
    border-radius: 16px;
    padding: 16px 12px 14px;
    text-align: center;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    position: relative; /* Essential for absolute badge positioning */
    transition: transform 0.18s ease, box-shadow 0.18s ease;
    -webkit-tap-highlight-color: transparent;
}

.app-card:active {
    transform: scale(0.96);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

/* ── Badges ── */
.app-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    height: 18px;
    min-width: 18px;
    border-radius: 9px;
    padding: 0 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    color: #fff;
    box-sizing: border-box;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    z-index: 2;
}

.app-badge--pending {
    background: #ef4444; /* red for pending actions */
}

.app-badge--progress {
    background: #f97316; /* orange for actively in-progress actions */
}

.app-badge--scheduled {
    background: #64748b; /* slate gray lock badge */
}

/* Scheduled / Locked state */
.app-card--scheduled {
    opacity: 0.78;
    background: #fafafa !important;
    border-color: rgba(0, 0, 0, 0.04) !important;
    box-shadow: none !important;
}

.app-icon-wrapper--scheduled {
    background: rgba(100, 116, 139, 0.07) !important;
    border-color: rgba(100, 116, 139, 0.12) !important;
}

.app-icon-wrapper--scheduled .app-icon {
    color: #64748b !important;
}

.app-desc--scheduled {
    color: #f97316 !important;
    font-weight: 600;
}

/* ── Icon Wrapper ── */
.app-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: rgba(0, 122, 255, 0.07);
    border: 1px solid rgba(0, 122, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2px;
    transition: background-color 0.2s, border-color 0.2s;
}

.app-icon-wrapper--active {
    background: rgba(249, 115, 22, 0.07);
    border-color: rgba(249, 115, 22, 0.15);
}

.app-icon {
    color: var(--f7-theme-color, #2196f3);
}

.app-icon-wrapper--active .app-icon {
    color: #f97316;
}

/* ── Text ── */
.app-name {
    font-size: 13px;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.app-desc {
    font-size: 11px;
    color: #6b7280;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 4px;
}

/* ── Card Progress Meter ── */
.app-card-progress {
    width: 100%;
    margin-top: auto;
    padding-top: 6px;
    border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.progress-details {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    font-weight: 600;
    margin-bottom: 4px;
}

.progress-details-text {
    color: #6b7280;
}

.progress-details-pct {
    color: #10b981;
}

.mini-progress-track {
    width: 100%;
    height: 4px;
    background: #f1f5f9;
    border-radius: 2px;
    overflow: hidden;
}

.mini-progress-fill {
    height: 100%;
    background: #10b981;
    border-radius: 2px;
    transition: width 0.3s ease;
}

/* ── Completed Apps Section ── */
.completed-section {
    margin-top: 8px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.completed-header {
    all: unset;
    display: flex;
    width: 100%;
    box-sizing: border-box;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
}

.completed-header:active {
    background: rgba(0, 0, 0, 0.02);
}

.completed-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.completed-header-icon {
    color: #10b981;
}

.completed-title {
    font-size: 14px;
    font-weight: 600;
    color: #4b5563;
}

.completed-chevron {
    color: #9ca3af;
}

/* Dimmed Completed Cards */
.app-card--completed {
    opacity: 0.72;
    background: #fafafa;
    border-color: rgba(0, 0, 0, 0.04);
    box-shadow: none;
    padding: 14px 12px;
}

.app-icon-wrapper--completed {
    background: rgba(16, 185, 129, 0.07);
    border-color: rgba(16, 185, 129, 0.12);
}

.app-icon--completed {
    color: #10b981;
}

.app-card--completed .app-name {
    color: #4b5563;
    font-weight: 500;
}

/* ── Empty State ── */
.app-empty, .app-empty-active {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 40px 16px;
    text-align: center;
}

.app-empty-icon-wrapper {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
}

.app-empty-icon {
    color: #9ca3af;
    opacity: 0.6;
}

.app-empty-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
}

.app-empty-sub {
    margin: 0;
    font-size: 12px;
    color: #6b7280;
}

/* Active Completed Empty State (All done banner) */
.app-empty-active {
    background: rgba(16, 185, 129, 0.04);
    border: 1px dotted rgba(16, 185, 129, 0.2);
    border-radius: 16px;
    padding: 24px 16px;
    margin: 8px 0;
}

.all-done-icon {
    color: #10b981;
    margin-bottom: 4px;
}

.all-done-title {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: #10b981;
}

.all-done-sub {
    margin: 2px 0 0;
    font-size: 11px;
    color: #065f46;
    line-height: 1.4;
    max-width: 85%;
}

/* Fade in animation */
.animated-fade-in {
    animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>