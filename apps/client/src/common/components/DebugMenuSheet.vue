<template>
  <f7-sheet
    v-model:opened="isOpened"
    class="debug-menu-sheet"
    style="height: auto; --f7-sheet-bg-color: #fff; max-height: 90vh;"
    swipe-to-close
    backdrop
  >
    <f7-toolbar>
      <div class="left"><small class="text-color-gray">Debug Console</small></div>
      <div class="right">
        <f7-link sheet-close>Close</f7-link>
      </div>
    </f7-toolbar>
    <f7-page-content>
      <f7-block-title medium>🔧 Debug Info</f7-block-title>
      <f7-block>

        <!-- App Info -->
        <f7-list media-list no-hairlines>
          <f7-list-item header="App" :title="`Cerdas Client v${appVersion}`" :subtitle="`Build: ${buildTime}`">
            <template #after>
              <span class="badge" :class="platform === 'android' ? 'color-green' : 'color-blue'">{{ platform }}</span>
            </template>
          </f7-list-item>
        </f7-list>

        <!-- Auth State -->
        <f7-block-title>Auth State</f7-block-title>
        <f7-list simple-list>
          <f7-list-item title="Logged In">
            <template #after>
              <span :class="authState.hasToken ? 'text-color-green' : 'text-color-red'">
                {{ authState.hasToken ? '✅ Yes' : '❌ No' }}
              </span>
            </template>
          </f7-list-item>
          <f7-list-item v-if="authState.userEmail" title="User" :after="authState.userEmail"></f7-list-item>
          <f7-list-item title="Token" :after="authState.tokenInfo"></f7-list-item>
        </f7-list>

        <!-- Connection Status -->
        <f7-block-title>Connection Status</f7-block-title>
        <f7-list simple-list>
          <f7-list-item title="API Server">
            <template #after>
              <span v-if="checking" class="text-color-gray">checking...</span>
              <span v-else :class="apiStatus ? 'text-color-green' : 'text-color-red'">
                {{ apiStatus ? '✅ Connected' : '❌ Failed' }}
              </span>
            </template>
          </f7-list-item>
          <f7-list-item title="Reverb (Realtime)">
            <template #after>
              <span v-if="reverbStatus === null" class="badge color-gray">N/A</span>
              <span v-else :class="reverbStatus ? 'text-color-green' : 'text-color-red'">
                {{ reverbStatus ? '✅ Connected' : '❌ Failed' }}
              </span>
            </template>
          </f7-list-item>
          <f7-list-item title="Network">
            <template #after>
              <span :class="isOnline ? 'text-color-green' : 'text-color-red'">
                {{ isOnline ? '✅ Online' : '❌ Offline' }}
              </span>
            </template>
          </f7-list-item>
          <f7-list-item v-if="apiLatency !== null" title="API Latency">
            <template #after>
              <span :class="apiLatency < 500 ? 'text-color-green' : apiLatency < 2000 ? 'text-color-orange' : 'text-color-red'">
                {{ apiLatency }}ms
              </span>
            </template>
          </f7-list-item>
        </f7-list>

        <!-- Environment -->
        <f7-block-title>Environment</f7-block-title>
        <f7-list>
          <f7-list-item title="API URL" :footer="envVars.apiUrl || 'NOT SET'"></f7-list-item>
          <f7-list-item title="Reverb Host" :footer="envVars.reverbHost || 'NOT SET'"></f7-list-item>
          <f7-list-item title="Reverb Key" :footer="envVars.reverbKey"></f7-list-item>
          <f7-list-item title="Google Client ID" :footer="envVars.googleClientId"></f7-list-item>
        </f7-list>

        <!-- Recent Logs -->
        <f7-block-title>
          Recent Logs ({{ logEntries.length }})
          <f7-link @click="refreshLogs" style="float: right; font-size: 14px;">Refresh</f7-link>
        </f7-block-title>
        <div class="debug-log-container">
          <div v-if="logEntries.length === 0" class="text-align-center padding text-color-gray">
            No log entries yet
          </div>
          <div v-for="(entry, i) in logEntries" :key="i" class="debug-log-entry" :class="`log-${entry.level.toLowerCase()}`">
            <div class="log-header">
              <span class="log-time">{{ entry.time }}</span>
              <span class="log-level">{{ entry.level }}</span>
              <span class="log-context">{{ entry.context }}</span>
            </div>
            <div class="log-message">{{ entry.message }}</div>
            <div v-if="entry.data" class="log-data">{{ entry.data }}</div>
          </div>
        </div>

        <!-- Device Info -->
        <f7-block-title>Device</f7-block-title>
        <f7-list>
          <f7-list-item title="Screen" :after="`${screenInfo.width}x${screenInfo.height} @${screenInfo.dpr}x`"></f7-list-item>
          <f7-list-item title="Language" :after="browserLang"></f7-list-item>
          <f7-list-item title="User Agent" :subtitle="userAgent" class="debug-ua"></f7-list-item>
        </f7-list>

        <!-- Actions -->
        <div class="display-flex" style="gap: 8px;">
          <f7-button fill color="gray" @click="copyInfo" style="flex: 1;">📋 Copy All</f7-button>
          <f7-button outline color="blue" @click="runChecks" style="flex: 1;">🔄 Re-check</f7-button>
        </div>
        <br/>
      </f7-block>
    </f7-page-content>
  </f7-sheet>
</template>

<script setup lang="ts">
import { Capacitor } from '@capacitor/core';
import { f7 } from 'framework7-vue';
import { onMounted, reactive, ref } from 'vue';
import { healthCheck } from '../services/HealthCheckService';
import { getLogBuffer, type LogEntry } from '../utils/logger';

const isOpened = ref(false);
const checking = ref(false);
const apiStatus = ref(false);
const reverbStatus = ref<boolean | null>(null);
const apiLatency = ref<number | null>(null);

// Static info
const appVersion = __APP_VERSION__;
const buildTime = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : 'Dev';
const platform = Capacitor.getPlatform();
const isOnline = ref(navigator.onLine);
const userAgent = navigator.userAgent;
const browserLang = navigator.language;

const screenInfo = reactive({
    width: window.screen.width,
    height: window.screen.height,
    dpr: Math.round(window.devicePixelRatio * 100) / 100,
});

const envVars = {
    apiUrl: import.meta.env.VITE_API_BASE_URL || '',
    reverbHost: import.meta.env.VITE_REVERB_HOST || '',
    reverbKey: import.meta.env.VITE_REVERB_APP_KEY
        ? '******' + import.meta.env.VITE_REVERB_APP_KEY.slice(-4)
        : 'NOT SET',
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID
        ? '******' + import.meta.env.VITE_GOOGLE_CLIENT_ID.slice(-8)
        : 'NOT SET',
};

// Auth state (read from localStorage directly)
const authState = reactive({
    hasToken: false,
    tokenInfo: 'none',
    userEmail: '',
});

function refreshAuth() {
    const token = localStorage.getItem('auth_token');
    const userJson = localStorage.getItem('auth_user');
    authState.hasToken = !!token;
    authState.tokenInfo = token
        ? `${token.length} chars, ...${token.slice(-6)}`
        : 'none';
    authState.userEmail = '';
    if (userJson) {
        try {
            const user = JSON.parse(userJson);
            authState.userEmail = user.email || user.name || 'unknown';
        } catch {
            authState.userEmail = '(parse error)';
        }
    }
}

// Log buffer (reversed: newest first)
const logEntries = ref<LogEntry[]>([]);

function refreshLogs() {
    logEntries.value = [...getLogBuffer()].reverse();
}

onMounted(() => {
    window.addEventListener('open-debug-menu', () => {
        isOpened.value = true;
        isOnline.value = navigator.onLine;
        refreshAuth();
        refreshLogs();
        runChecks();
    });

    window.addEventListener('online', () => { isOnline.value = true; });
    window.addEventListener('offline', () => { isOnline.value = false; });
});

const runChecks = async () => {
    checking.value = true;
    apiLatency.value = null;

    const start = performance.now();
    try {
        const result = await healthCheck.runStartupChecks(true);
        apiLatency.value = Math.round(performance.now() - start);
        apiStatus.value = result.api;
        reverbStatus.value = result.reverb;
    } catch (e: unknown) {
        apiLatency.value = Math.round(performance.now() - start);
        apiStatus.value = false;
    }
    checking.value = false;
    refreshLogs(); // Refresh after checks add their own log entries
};

const copyInfo = () => {
    refreshAuth();
    refreshLogs();
    const info = {
        app: {
            version: appVersion,
            build: buildTime,
            platform,
        },
        auth: {
            loggedIn: authState.hasToken,
            user: authState.userEmail || null,
            token: authState.tokenInfo,
        },
        connection: {
            api: apiStatus.value ? 'OK' : 'FAIL',
            apiLatency: apiLatency.value ? `${apiLatency.value}ms` : 'N/A',
            reverb: reverbStatus.value === null ? 'N/A' : reverbStatus.value ? 'OK' : 'FAIL',
            network: isOnline.value ? 'Online' : 'Offline',
        },
        environment: {
            apiUrl: envVars.apiUrl,
            reverbHost: envVars.reverbHost,
            reverbKey: envVars.reverbKey,
            googleClientId: envVars.googleClientId,
        },
        device: {
            screen: `${screenInfo.width}x${screenInfo.height} @${screenInfo.dpr}x`,
            language: browserLang,
            userAgent,
        },
        recentLogs: logEntries.value.slice(0, 50).map(e =>
            `[${e.time}] ${e.level} [${e.context}] ${e.message}${e.data ? ' | ' + e.data : ''}`
        ),
        timestamp: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(info, null, 2));
    f7.toast.show({ text: 'Debug info copied!', closeTimeout: 2000 });
};
</script>

<style scoped>
.debug-log-container {
    max-height: 250px;
    overflow-y: auto;
    background: #1a1a2e;
    border-radius: 8px;
    padding: 8px;
    margin-bottom: 16px;
    font-family: 'Courier New', monospace;
    font-size: 11px;
}

.debug-log-entry {
    padding: 4px 6px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}

.debug-log-entry:last-child {
    border-bottom: none;
}

.log-header {
    display: flex;
    gap: 6px;
    align-items: center;
}

.log-time {
    color: #888;
    font-size: 10px;
}

.log-level {
    font-weight: bold;
    font-size: 10px;
    padding: 1px 4px;
    border-radius: 3px;
}

.log-context {
    color: #8be9fd;
    font-size: 10px;
}

.log-message {
    color: #f8f8f2;
    margin-top: 2px;
    word-break: break-word;
}

.log-data {
    color: #6272a4;
    font-size: 10px;
    word-break: break-all;
    margin-top: 2px;
}

/* Level colors */
.log-debug .log-level { color: #6272a4; background: rgba(98,114,164,0.2); }
.log-info .log-level { color: #50fa7b; background: rgba(80,250,123,0.2); }
.log-warn .log-level { color: #f1fa8c; background: rgba(241,250,140,0.2); }
.log-error .log-level { color: #ff5555; background: rgba(255,85,85,0.2); }
.log-error .log-message { color: #ff5555; }

.debug-ua :deep(.item-subtitle) {
    font-size: 10px;
    word-break: break-all;
    line-height: 1.3;
}
</style>
