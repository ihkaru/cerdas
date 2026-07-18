<template>
    <div class="apk-download-container">
        <!-- Scenario A: Update Available (Prominent, High-visibility Premium Design) -->
        <div v-if="updateAvailable" class="apk-card apk-card--update">
            <div class="apk-card-glass"></div>
            <div class="apk-card-content">
                <div class="apk-header">
                    <div class="pulse-indicator">
                        <span class="pulse-dot"></span>
                        <span class="pulse-ring"></span>
                    </div>
                    <span class="apk-badge">Update Tersedia</span>
                </div>
                
                <h3 class="apk-title">Cerdas Mobile v{{ latestVersion }}</h3>
                <p class="apk-subtitle">
                    Perbarui aplikasi Anda ke versi terbaru untuk mendapatkan performa terbaik dan perbaikan stabilitas di lapangan.
                </p>

                <!-- Changelog Collapsible -->
                <div v-if="changelog.length" class="changelog-section">
                    <div class="changelog-toggle" @click="showChangelog = !showChangelog">
                        <span>Lihat yang baru</span>
                        <f7-icon :f7="showChangelog ? 'chevron_up' : 'chevron_down'" size="14"></f7-icon>
                    </div>
                    <ul v-if="showChangelog" class="changelog-list">
                        <li v-for="(item, index) in changelog" :key="index" class="changelog-item">
                            <span class="changelog-bullet">•</span>
                            <span class="changelog-text">{{ item }}</span>
                        </li>
                    </ul>
                </div>

                <div class="apk-actions">
                    <a :href="downloadUrl" external target="_blank" class="external download-button download-button--primary" @click="handleDownloadClick">
                        <f7-icon f7="arrow_down_to_line_alt" size="18" class="margin-right-half"></f7-icon>
                        Download APK Terbaru
                    </a>
                </div>
            </div>
        </div>

        <!-- Scenario B: Up-to-Date (Clean, Compact, Minimalist Premium Design) -->
        <div v-else class="apk-card apk-card--uptodate">
            <div class="apk-card-content flex-row justify-between align-items-center">
                <div class="flex-row align-items-center gap-half">
                    <div class="success-icon-wrapper">
                        <f7-icon f7="checkmark_seal_fill" size="16" class="color-green"></f7-icon>
                    </div>
                    <div class="info-text">
                        <span class="status-title">Aplikasi Terupdate</span>
                        <span class="version-label">v{{ currentVersion }}</span>
                    </div>
                </div>
                <a :href="downloadUrl" external target="_blank" class="external re-download-link" @click="handleDownloadClick">
                    <f7-icon f7="arrow_down_to_line" size="13"></f7-icon>
                    <span>Download Ulang APK</span>
                </a>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { f7Icon } from 'framework7-vue';

const props = defineProps<{
    latestApk: {
        version: string;
        url: string;
        changelog?: string[];
        force_update?: boolean;
    } | null;
}>();

const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
const showChangelog = ref(false);

const isOlder = (current: string, proposed: string): boolean => {
    const c = current.split('.').map(Number);
    const p = proposed.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        if ((p[i] || 0) > (c[i] || 0)) return true;
        if ((p[i] || 0) < (c[i] || 0)) return false;
    }
    return false;
};

const latestVersion = computed(() => {
    if (!props.latestApk?.version) return currentVersion;
    return isOlder(props.latestApk.version, currentVersion) ? currentVersion : props.latestApk.version;
});
const downloadUrl = computed(() => {
    if (props.latestApk?.url && props.latestApk.url.includes(`/v${latestVersion.value}/`)) {
        return props.latestApk.url;
    }
    return `https://github.com/ihkaru/cerdas/releases/download/v${latestVersion.value}/cerdas-v${latestVersion.value}.apk`;
});
const changelog = computed(() => props.latestApk?.changelog || []);

const updateAvailable = computed(() => {
    if (!props.latestApk?.version) return false;
    return isOlder(currentVersion, props.latestApk.version);
});

function handleDownloadClick(e: MouseEvent) {
    e.stopPropagation();
    if (downloadUrl.value) {
        window.open(downloadUrl.value, '_blank');
    }
}
</script>

<style scoped>
.apk-download-container {
    padding: 0 16px;
    margin-bottom: 16px;
}

/* ── Base Card ── */
.apk-card {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.05);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.apk-card:active {
    transform: scale(0.99);
}

.apk-card-content {
    position: relative;
    z-index: 2;
    padding: 16px;
}

/* ── Scenario A: Update Card (Glassmorphism & Gradient Accent) ── */
.apk-card--update {
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(249, 115, 22, 0.05) 100%);
    border-color: rgba(37, 99, 235, 0.15);
    box-shadow: 0 4px 20px rgba(37, 99, 235, 0.05);
}

.apk-card-glass {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    z-index: 1;
}

.apk-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.apk-badge {
    font-size: 11px;
    font-weight: 700;
    color: #f97316; /* Vibrant Amber */
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.apk-title {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 6px;
    letter-spacing: -0.3px;
}

.apk-subtitle {
    font-size: 13px;
    color: #475569;
    line-height: 1.5;
    margin: 0 0 16px;
}

/* ── Changelog Section ── */
.changelog-section {
    background: rgba(255, 255, 255, 0.6);
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.04);
    margin-bottom: 16px;
    padding: 10px 12px;
}

.changelog-toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    font-weight: 600;
    color: #2563eb;
    cursor: pointer;
    user-select: none;
}

.changelog-list {
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
}

.changelog-item {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 12px;
    color: #475569;
    line-height: 1.4;
    margin-top: 4px;
}

.changelog-bullet {
    color: #94a3b8;
    font-weight: bold;
}

.changelog-text {
    flex: 1;
}

/* ── Pulsing Update Dot ── */
.pulse-indicator {
    position: relative;
    width: 8px;
    height: 8px;
    display: inline-block;
}

.pulse-dot {
    position: absolute;
    width: 8px;
    height: 8px;
    background-color: #f97316;
    border-radius: 50%;
    z-index: 2;
}

.pulse-ring {
    position: absolute;
    width: 24px;
    height: 24px;
    background-color: rgba(249, 115, 22, 0.4);
    border-radius: 50%;
    top: -8px;
    left: -8px;
    animation: pulse 1.8s infinite ease-out;
    z-index: 1;
}

@keyframes pulse {
    0% {
        transform: scale(0.3);
        opacity: 1;
    }
    100% {
        transform: scale(1.2);
        opacity: 0;
    }
}

/* ── Actions ── */
.apk-actions {
    display: flex;
}

.download-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 12px 16px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 14px;
    text-decoration: none;
    transition: background-color 0.2s ease, transform 0.1s active;
    text-align: center;
}

.download-button--primary {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: #ffffff !important;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.download-button--primary:active {
    background: #1d4ed8;
}

/* ── Scenario B: Up-to-Date Card ── */
.apk-card--uptodate {
    background: rgba(248, 250, 252, 0.7);
    border-color: rgba(0, 0, 0, 0.05);
}

.flex-row {
    display: flex;
    flex-direction: row;
}

.justify-between {
    justify-content: space-between;
}

.align-items-center {
    align-items: center;
}

.gap-half {
    gap: 8px;
}

.success-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: rgba(34, 197, 94, 0.08);
    border-radius: 50%;
}

.color-green {
    color: #22c55e !important;
}

.info-text {
    display: flex;
    flex-direction: column;
}

.status-title {
    font-size: 13px;
    font-weight: 600;
    color: #334155;
    line-height: 1.2;
}

.version-label {
    font-size: 11px;
    color: #64748b;
    margin-top: 1px;
}

.re-download-link {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    color: #475569 !important;
    text-decoration: none;
    padding: 6px 10px;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 8px;
    transition: background-color 0.15s ease;
}

.re-download-link:active {
    background: rgba(0, 0, 0, 0.06);
}
</style>
