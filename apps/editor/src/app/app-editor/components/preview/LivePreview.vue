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
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useTableEditor } from '../../composables/useTableEditor';

const props = defineProps<{
    role?: string;
    appViews?: Record<string, any>;
    viewsVersion?: number;
}>();

const {
    tableId: schemaId,
    tableForPreview: schemaForPreview,
    state: editorState,
} = useTableEditor();

const iframeRef = ref<HTMLIFrameElement | null>(null);
const isSyncing = ref(false);
const impersonatedToken = ref<string | null>(null);

// The client app URL - auto navigate to specific app if ID exists
const iframeUrl = computed(() => {
    const baseUrl = import.meta.env.VITE_CLIENT_URL || window.location.origin.replace('editor', 'app');
    if (schemaId.value) {
        return `${baseUrl}/app/${schemaId.value}`;
    }
    return `${baseUrl}/`;
});

function handleIframeLoad() {
    console.log('[LivePreview] Iframe loaded, synchronizing context...');
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
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
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
            viewConfigs: props.appViews
        }
    })), '*');
}

// Watch role change to clear cache and re-sync
watch(() => props.role, () => {
    impersonatedToken.value = null; // Clear cache
    syncAuth();
});

// Watch for changes in schema or layout and push to iframe
watch([schemaForPreview, () => editorState.layout, () => props.appViews, () => props.viewsVersion], () => {
    syncSchema();
}, { deep: true });

function handleMessage(event: MessageEvent) {
    if (event.data?.type === 'EDITOR_CLIENT_READY') {
        console.log('[LivePreview] Client Handshake Received (EDITOR_CLIENT_READY). Re-syncing context...');
        syncAuth();
        syncSchema();
    }
}

onMounted(() => {
    window.addEventListener('message', handleMessage);
});

onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
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
</style>
