<template>
  <f7-popup
    v-model:opened="isOpened"
    class="debug-popup"
  >
    <f7-page>
      <f7-navbar title="🔧 Debug Console">
        <template #right>
          <f7-link popup-close>Close</f7-link>
        </template>
      </f7-navbar>

      <f7-block strong inset>

        <!-- App Info -->
        <div class="dbg-section">
          <div class="dbg-label">App</div>
          <div class="dbg-value">Cerdas Client v{{ appVersion }}</div>
          <div class="dbg-sub">Build: {{ buildTime }} | Platform: {{ platform }}</div>
        </div>

        <!-- Auth State -->
        <div class="dbg-section">
          <div class="dbg-label">Auth State</div>
          <div class="dbg-row">
            <span>Logged In:</span>
            <strong :style="{ color: authState.hasToken ? '#4caf50' : '#f44336' }">
              {{ authState.hasToken ? '✅ Yes' : '❌ No' }}
            </strong>
          </div>
          <div v-if="authState.userEmail" class="dbg-row">
            <span>User:</span>
            <strong>{{ authState.userEmail }}</strong>
          </div>
          <div class="dbg-row">
            <span>Token:</span>
            <span class="dbg-mono">{{ authState.tokenInfo }}</span>
          </div>
        </div>

        <!-- Connection -->
        <div class="dbg-section">
          <div class="dbg-label">Connection</div>
          <div class="dbg-row">
            <span>API Server:</span>
            <strong v-if="checking" style="color: #999;">checking...</strong>
            <strong v-else :style="{ color: apiStatus ? '#4caf50' : '#f44336' }">
              {{ apiStatus ? '✅ Connected' : '❌ Failed' }}
            </strong>
          </div>
          <div class="dbg-row">
            <span>Reverb:</span>
            <strong v-if="reverbStatus === null" style="color: #999;">N/A</strong>
            <strong v-else :style="{ color: reverbStatus ? '#4caf50' : '#f44336' }">
              {{ reverbStatus ? '✅ Connected' : '❌ Failed' }}
            </strong>
          </div>
          <div class="dbg-row">
            <span>Network:</span>
            <strong :style="{ color: isOnline ? '#4caf50' : '#f44336' }">
              {{ isOnline ? '✅ Online' : '❌ Offline' }}
            </strong>
          </div>
          <div v-if="apiLatency !== null" class="dbg-row">
            <span>Latency:</span>
            <strong :style="{ color: apiLatency < 500 ? '#4caf50' : apiLatency < 2000 ? '#ff9800' : '#f44336' }">
              {{ apiLatency }}ms
            </strong>
          </div>
          <div v-if="apiError" class="dbg-row">
            <span>Error:</span>
            <span style="color: #f44336; font-size: 12px;">{{ apiError }}</span>
          </div>
        </div>

        <!-- Environment -->
        <div class="dbg-section">
          <div class="dbg-label">Environment</div>
          <div class="dbg-row"><span>API URL:</span></div>
          <div class="dbg-mono" style="font-size: 11px; word-break: break-all;">{{ envVars.apiUrl || 'NOT SET' }}</div>
          <div class="dbg-row"><span>Reverb Host:</span> <span class="dbg-mono">{{ envVars.reverbHost || 'NOT SET' }}</span></div>
          <div class="dbg-row"><span>Reverb Key:</span> <span class="dbg-mono">{{ envVars.reverbKey }}</span></div>
          <div class="dbg-row"><span>Google Client:</span> <span class="dbg-mono">{{ envVars.googleClientId }}</span></div>
        </div>

        <!-- Recent Logs -->
        <div class="dbg-section">
          <div class="dbg-label" style="display: flex; justify-content: space-between;">
            <span>Recent Logs ({{ logEntries.length }})</span>
            <a href="#" @click.prevent="refreshLogs" style="font-size: 12px;">↻ Refresh</a>
          </div>
          <div class="dbg-log-box">
            <div v-if="logEntries.length === 0" style="color: #888; text-align: center; padding: 12px;">
              No log entries
            </div>
            <div v-for="(entry, i) in logEntries" :key="i"
                 class="dbg-log-entry"
                 :class="`dbg-log-${entry.level.toLowerCase()}`">
              <span class="dbg-log-time">{{ entry.time }}</span>
              <span class="dbg-log-level">{{ entry.level }}</span>
              <span class="dbg-log-ctx">{{ entry.context }}</span>
              <div class="dbg-log-msg">{{ entry.message }}</div>
              <div v-if="entry.data" class="dbg-log-data">{{ entry.data }}</div>
            </div>
          </div>
        </div>

        <!-- Device -->
        <div class="dbg-section">
          <div class="dbg-label">Device</div>
          <div class="dbg-row"><span>Screen:</span> <span>{{ screenInfo.width }}x{{ screenInfo.height }} @{{ screenInfo.dpr }}x</span></div>
          <div class="dbg-row"><span>Language:</span> <span>{{ browserLang }}</span></div>
          <div class="dbg-sub" style="word-break: break-all;">{{ userAgent }}</div>
        </div>

        <!-- Actions -->
        <div style="display: flex; gap: 8px; margin-top: 16px; padding-bottom: 24px;">
          <f7-button fill color="gray" @click="copyInfo" style="flex: 1;">📋 Copy All</f7-button>
          <f7-button outline color="blue" @click="runChecks" style="flex: 1;">🔄 Re-check</f7-button>
        </div>
      </f7-block>
    </f7-page>
  </f7-popup>
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
const apiError = ref('');

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
        ? `${token.length} chars ...${token.slice(-6)}`
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
    apiError.value = '';
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
        apiError.value = e instanceof Error ? e.message : String(e);
    }
    checking.value = false;
    refreshLogs();
};

const copyInfo = () => {
    refreshAuth();
    refreshLogs();
    const info = {
        app: { version: appVersion, build: buildTime, platform },
        auth: {
            loggedIn: authState.hasToken,
            user: authState.userEmail || null,
            token: authState.tokenInfo,
        },
        connection: {
            api: apiStatus.value ? 'OK' : 'FAIL',
            apiLatency: apiLatency.value ? `${apiLatency.value}ms` : 'N/A',
            apiError: apiError.value || null,
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
    f7.toast.show({ text: '✅ Debug info copied!', closeTimeout: 2000 });
};
</script>

<style scoped>
.dbg-section {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
}
.dbg-section:last-of-type {
    border-bottom: none;
}
.dbg-label {
    font-size: 12px;
    font-weight: 600;
    color: #2196f3;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
}
.dbg-value {
    font-size: 16px;
    font-weight: 600;
}
.dbg-sub {
    font-size: 11px;
    color: #999;
    margin-top: 2px;
}
.dbg-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    font-size: 14px;
}
.dbg-mono {
    font-family: monospace;
    font-size: 12px;
    color: #666;
}

/* Log viewer */
.dbg-log-box {
    max-height: 200px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    background: #1a1a2e;
    border-radius: 8px;
    padding: 8px;
    font-family: 'Courier New', monospace;
    font-size: 11px;
}
.dbg-log-entry {
    padding: 4px 4px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}
.dbg-log-time { color: #888; font-size: 10px; margin-right: 4px; }
.dbg-log-level { font-weight: bold; font-size: 10px; margin-right: 4px; padding: 1px 3px; border-radius: 3px; }
.dbg-log-ctx { color: #8be9fd; font-size: 10px; }
.dbg-log-msg { color: #f8f8f2; margin-top: 2px; word-break: break-word; }
.dbg-log-data { color: #6272a4; font-size: 10px; word-break: break-all; margin-top: 1px; }

.dbg-log-debug .dbg-log-level { color: #6272a4; background: rgba(98,114,164,0.2); }
.dbg-log-info .dbg-log-level { color: #50fa7b; background: rgba(80,250,123,0.2); }
.dbg-log-warn .dbg-log-level { color: #f1fa8c; background: rgba(241,250,140,0.2); }
.dbg-log-error .dbg-log-level { color: #ff5555; background: rgba(255,85,85,0.2); }
.dbg-log-error .dbg-log-msg { color: #ff5555; }
</style>
