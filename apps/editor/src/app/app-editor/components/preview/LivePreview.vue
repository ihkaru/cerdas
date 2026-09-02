<template>
    <div class="live-preview-app">
        <iframe ref="iframeRef" :src="iframeUrl" class="preview-iframe"
            allow="camera; geolocation; microphone; fullscreen; clipboard-read; clipboard-write"
            @load="handleIframeLoad" />

        <!-- Overlay for Loading or Syncing (optional) -->
        <div v-if="isSyncing" class="sync-overlay">
            <f7-preloader />
            <span>Syncing with Editor...</span>
        </div>

        <!-- Connection Timeout Overlay -->
        <div v-if="hasTimeout" class="timeout-overlay">
            <div class="timeout-card">
                <f7-icon f7="wifi_exclamationmark" size="48" class="timeout-icon"></f7-icon>
                <h3 class="timeout-title">Preview Offline or Out of Sync</h3>
                <p class="timeout-desc">The preview app failed to respond. This can happen if the dev server is starting up or has outdated Vite dependencies cache.</p>
                <f7-button fill round color="blue" @click="reloadPreview" class="reload-btn">
                    <f7-icon f7="arrow_counterclockwise" size="14"></f7-icon>
                    <span>Reload Preview</span>
                </f7-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, inject } from 'vue';
import { useTableEditor } from '../../composables/useTableEditor';
import { getApiBaseUrl } from '../../../../common/api/ApiClient';

const props = defineProps<{
    role?: string;
    appViews?: Record<string, any>;
    viewsVersion?: number;
    navigation?: any[];
    selectedViewId?: string;
    isDirty?: boolean;
}>();

const {
    tableId: schemaId,
    tableForPreview: schemaForPreview,
    state: editorState,
    selectField
} = useTableEditor();

const activeTab = inject<any>('activeTab', null);
const selectedViewKey = inject<any>('selectedViewKey', null);
const selectedNavKey = inject<any>('selectedNavKey', null);
const highlightedViewOption = inject<any>('highlightedViewOption', null);

const iframeRef = ref<HTMLIFrameElement | null>(null);
const isSyncing = ref(false);
const impersonatedToken = ref<string | null>(null);

const isReady = ref(false);
const hasTimeout = ref(false);
let handshakeTimeoutId: ReturnType<typeof setTimeout> | null = null;

function startHandshakeTimeout() {
    if (handshakeTimeoutId) clearTimeout(handshakeTimeoutId);
    hasTimeout.value = false;
    isReady.value = false;
    
    handshakeTimeoutId = setTimeout(() => {
        if (!isReady.value) {
            console.warn('[LivePreview] Connection handshake timeout.');
            hasTimeout.value = true;
        }
    }, 7000); // 7 seconds
}

function reloadPreview() {
    hasTimeout.value = false;
    isReady.value = false;
    if (iframeRef.value) {
        const currentSrc = iframeRef.value.src;
        iframeRef.value.src = '';
        setTimeout(() => {
            if (iframeRef.value) {
                iframeRef.value.src = currentSrc;
            }
        }, 50);
    }
}

// The client app URL - auto navigate to specific app if ID exists
const iframeUrl = computed(() => {
    const baseUrl = import.meta.env.VITE_CLIENT_URL || window.location.origin.replace('editor', 'app');
    const cb = `_cb=${Date.now()}`;
    if (schemaId.value) {
        return `${baseUrl}/app/${schemaId.value}?${cb}`;
    }
    return `${baseUrl}/?${cb}`;
});

function handleIframeLoad() {
    console.log('[LivePreview] Iframe loaded, synchronizing context and starting handshake...');
    startHandshakeTimeout();
    syncAuth();
    syncSchema();
}

/** Fetch token based on role */
async function resolveToken(): Promise<string | null> {
    const adminToken = localStorage.getItem('auth_token');
    if (!props.role || props.role === 'admin') return adminToken;

    // Use cached token if role hasn't changed (logic handled by watcher resetting cache)
    if (impersonatedToken.value) return impersonatedToken.value;

    try {
        const apiUrl = getApiBaseUrl();
        const res = await fetch(`${apiUrl}/auth/impersonate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ role: props.role })
        });

        if (res.ok) {
            const data = await res.json();
            impersonatedToken.value = data.token;
            return data.token;
        } else {
            console.error('Impersonation failed:', await res.text());
        }
    } catch (e) {
        console.error('Impersonation error:', e);
    }
    return adminToken; // Fallback? Or fail? Fallback to admin allows debugging.
}

/** Sync auth token to iframe so it stays logged in */
async function syncAuth() {
    isSyncing.value = true;
    const token = await resolveToken();
    isSyncing.value = false;

    if (token && iframeRef.value?.contentWindow) {
        const roleLabel = props.role
            ? props.role.charAt(0).toUpperCase() + props.role.slice(1)
            : 'Admin';

        iframeRef.value.contentWindow.postMessage({
            type: 'SET_TOKEN',
            payload: { token, roleLabel }
        }, '*');

        // Force refresh data in client if role changed
        // We can send a REFRESH command
        setTimeout(() => {
            iframeRef.value?.contentWindow?.postMessage({ type: 'REFRESH_DATA' }, '*');
        }, 500);
    }
}

/** Sync current schema and layout to iframe for live updates */
function syncSchema() {
    if (!schemaId.value || !iframeRef.value?.contentWindow) return;

    iframeRef.value.contentWindow.postMessage(JSON.parse(JSON.stringify({
        type: 'SET_SCHEMA_OVERRIDE',
        payload: {
            tableId: schemaId.value,
            formId: schemaId.value, // Legacy support
            appId: editorState.appId, // Include app_id for proper sync
            schema: schemaForPreview.value,
            layout: editorState.layout,
            navigation: props.navigation, // Pass live navigation
            viewConfigs: props.appViews
        }
    })), '*');
}

/** Trigger data sync inside the iframe */
function triggerDataSync() {
    if (iframeRef.value?.contentWindow) {
        console.log('[LivePreview] Triggering data sync in iframe...');
        iframeRef.value.contentWindow.postMessage({ type: 'REFRESH_DATA' }, '*');
    }
}

// Expose for parent
defineExpose({
    triggerDataSync
});

// Watch role change to clear cache and re-sync
watch(() => props.role, () => {
    impersonatedToken.value = null; // Clear cache
    syncAuth();
});

// Watch for explicit selection change in editor menu and tell iframe to navigate
watch(() => props.selectedViewId, (newId, oldId) => {
    if (newId && newId !== oldId && iframeRef.value?.contentWindow) {
        console.log('[LivePreview] User switched view selection to:', newId);
        iframeRef.value.contentWindow.postMessage({
            type: 'NAVIGATE_TO',
            payload: { viewId: newId }
        }, '*');
        
        // Also trigger schema sync to ensure the destination view has the latest config
        syncSchema();
    }
});

// Watch for changes in schema, fields, or layout and push to iframe
watch([
    schemaForPreview,
    () => editorState.fields,
    () => editorState.layout, 
    () => props.appViews, 
    () => props.viewsVersion,
    () => props.navigation,
    () => props.isDirty
], () => {
    syncSchema();
}, { deep: true });

function handleEditorClientReady() {
    console.log('[LivePreview] Client Handshake Received (EDITOR_CLIENT_READY). Re-syncing context...');
    isReady.value = true;
    hasTimeout.value = false;
    if (handshakeTimeoutId) {
        clearTimeout(handshakeTimeoutId);
        handshakeTimeoutId = null;
    }
    syncAuth();
    syncSchema();
}

function handleSelectFieldInEditor(payload: any) {
    const { fieldName } = payload;
    console.log('[LivePreview] Remote select field:', fieldName);
    if (editorState.fields) {
        const fieldIndex = editorState.fields.findIndex((f: any) => f.name === fieldName);
        if (fieldIndex !== -1) {
            if (activeTab) {
                activeTab.value = 'schema';
            }
            selectField(String(fieldIndex));
        }
    }
}

function handleSelectTabInEditor(payload: any) {
    const { tab, viewId, navId, optionKey } = payload;
    console.log('[LivePreview] Remote select tab:', tab, 'viewId:', viewId, 'navId:', navId, 'optionKey:', optionKey);
    
    if (activeTab) {
        activeTab.value = (tab === 'navigation' ? 'views' : tab);
    }
    
    if (tab === 'views' && viewId && selectedViewKey) {
        selectedViewKey.value = viewId;
        if (selectedNavKey) selectedNavKey.value = '';
    } else if (tab === 'navigation' && navId && selectedNavKey) {
        selectedNavKey.value = navId;
        if (selectedViewKey) selectedViewKey.value = '';
    }

    if (optionKey && highlightedViewOption) {
        highlightedViewOption.value = optionKey;
        setTimeout(() => {
            if (highlightedViewOption.value === optionKey) {
                highlightedViewOption.value = '';
            }
        }, 3500);
    }
}

function handleMessage(event: MessageEvent) {
    const type = event.data?.type;
    const payload = event.data?.payload;
    
    if (type === 'EDITOR_CLIENT_READY') {
        handleEditorClientReady();
    } else if (type === 'SELECT_FIELD_IN_EDITOR') {
        handleSelectFieldInEditor(payload);
    } else if (type === 'SELECT_TAB_IN_EDITOR') {
        handleSelectTabInEditor(payload);
    }
}

onMounted(() => {
    window.addEventListener('message', handleMessage);
});

onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
    if (handshakeTimeoutId) clearTimeout(handshakeTimeoutId);
});
</script>

<style scoped>
.live-preview-app {
    width: 100%;
    height: 100%;
    position: relative;
    background: #000;
}

.preview-iframe {
    width: 100%;
    height: 100%;
    border: none;
    background: #fff;
}

.sync-overlay {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    z-index: 1000;
    font-weight: 500;
    color: var(--f7-theme-color);
}

.timeout-overlay {
    position: absolute;
    inset: 0;
    background: rgba(10, 10, 10, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001;
    padding: 20px;
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.timeout-card {
    background: #1c1c1e;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 24px 20px;
    max-width: 280px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
}

.timeout-icon {
    color: #FF9500;
    margin-bottom: 12px;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.03); opacity: 1; }
    100% { transform: scale(1); opacity: 0.9; }
}

.timeout-title {
    margin: 0 0 6px 0;
    font-size: 15px;
    font-weight: 600;
    color: #fff;
}

.timeout-desc {
    margin: 0 0 16px 0;
    font-size: 12px;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.55);
}

.reload-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    text-transform: none;
    height: 36px;
    padding: 0 18px;
    --f7-button-border-radius: 99px;
}
</style>
