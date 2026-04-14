<template>
    <div class="app-settings-panel">
        <!-- Basic Info -->
        <f7-list inset>
            <f7-list-item group-title>App Info</f7-list-item>
            <f7-list-input label="App Name" type="text" :value="tableName" placeholder="My App"
                @input="updateTableName(($event.target as HTMLInputElement).value)" />
            <f7-list-input label="Description" type="textarea" placeholder="Tell us more about this app..." resizable
                :value="state.description" @input="updateDescription(($event.target as HTMLInputElement).value)" />
            <f7-list-item title="Icon" link="#" @click="showIconPicker = true">
                <f7-icon slot="media" :f7="settings.icon" color="blue" />
                <span slot="after">{{ settings.icon }}</span>
            </f7-list-item>
        </f7-list>

        <!-- Configuration -->
        <f7-list inset>
            <f7-list-item group-title>Configuration</f7-list-item>
            <f7-list-item title="Public Access">
                <template #after>
                    <f7-toggle :checked="!!settings.public_access" color="green"
                        @toggle:change="updateSettings({ public_access: $event })" />
                </template>
            </f7-list-item>
            <f7-list-item title="Allow Comments">
                <template #after>
                    <f7-toggle :checked="!!settings.allow_comments"
                        @toggle:change="updateSettings({ allow_comments: $event })" />
                </template>
            </f7-list-item>
        </f7-list>

        <!-- Public Enrollment (Shareable Link) -->
        <f7-list inset>
            <f7-list-item group-title>Public Enrollment</f7-list-item>
            <f7-list-item title="Shareable Join Link">
                <f7-toggle :checked="!!joinLink?.is_active" color="green"
                    @toggle:change="(val) => toggleJoinLink(val)" />
            </f7-list-item>

            <template v-if="joinLink?.is_active">
                <f7-list-input label="Invitation Link" type="text" readonly :value="fullJoinUrl" class="join-link-input">
                    <template #info>
                        Anyone with this link can join as <strong>{{ joinLink.role }}</strong>.
                    </template>
                </f7-list-input>
                <f7-list-item>
                    <div class="display-flex justify-content-space-between w-full">
                        <f7-button small fill @click="copyLink">Copy Link</f7-button>
                        <f7-button small outline color="red" @click="regenerateJoinLink">Regenerate Token</f7-button>
                    </div>
                </f7-list-item>
                <f7-list-item title="Default Role" smart-select :smart-select-params="{ openIn: 'popover' }">
                    <select :value="joinLink.role" @change="e => toggleJoinLink(true, (e.target as HTMLSelectElement).value)">
                        <option value="enumerator">Enumerator</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="viewer">Viewer</option>
                    </select>
                </f7-list-item>
            </template>
        </f7-list>

        <!-- Version History -->
        <f7-list inset>
            <f7-list-item group-title>Version History</f7-list-item>
        </f7-list>
        <VersionHistory v-if="tableId" :table-id="tableId" :current-version="currentVersion"
            @rollback="handleRollback" />

        <!-- Icon Picker Dialog -->
        <f7-popup :opened="showIconPicker" @popup:closed="showIconPicker = false">
            <f7-page>
                <f7-navbar title="Select Icon">
                    <f7-nav-right>
                        <f7-link popup-close>Close</f7-link>
                    </f7-nav-right>
                </f7-navbar>
                <f7-block-title>Common Icons</f7-block-title>
                <div class="icon-grid">
                    <div v-for="icon in commonIcons" :key="icon" class="icon-item" @click="selectIcon(icon)">
                        <f7-icon :f7="icon" size="32" color="blue" />
                        <span>{{ icon }}</span>
                    </div>
                </div>
            </f7-page>
        </f7-popup>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useTableEditor } from '../../composables/useTableEditor';
import { useAppJoinLink } from '../../composables/useAppJoinLink';
import { useAppStore } from '@/stores';
import VersionHistory from './VersionHistory.vue';
import { f7 } from 'framework7-vue';

const {
    state,
    tableName,
    settings,
    updateSettings,
    updateDescription,
    updateTableName
} = useTableEditor();

const appStore = useAppStore();
const { joinLink, fetchJoinLink, toggleJoinLink, regenerateJoinLink } = useAppJoinLink(() => appStore.currentApp?.id ? String(appStore.currentApp.id) : null);

const showIconPicker = ref(false);

const fullJoinUrl = computed(() => {
    if (!joinLink.value?.token) return '';
    
    // 1. Primary: Use VITE_CLIENT_URL from env
    const envBaseUrl = import.meta.env.VITE_CLIENT_URL;
    if (envBaseUrl && !envBaseUrl.includes('localhost')) {
        return `${envBaseUrl.replace(/\/$/, '')}/join/${joinLink.value.token}`;
    }

    // 2. Dynamic Detection: Swap 'editor' with 'app' for production domains
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;

    if (hostname.includes('editor.')) {
        const clientHostname = hostname.replace('editor.', 'app.');
        const portSuffix = port ? `:${port}` : '';
        return `${protocol}//${clientHostname}${portSuffix}/join/${joinLink.value.token}`;
    }

    // 3. Local Development Fallback: Port swapping
    const origin = window.location.origin;
    if (origin.includes(':3001')) return origin.replace(':3001', ':3000') + `/join/${joinLink.value.token}`;
    if (origin.includes(':8001')) return origin.replace(':8001', ':8000') + `/join/${joinLink.value.token}`;
    
    // 4. Default Fallback
    return `${origin}/join/${joinLink.value.token}`;
});

onMounted(() => {
    fetchJoinLink();
});

function copyLink() {
    if (fullJoinUrl.value) {
        navigator.clipboard.writeText(fullJoinUrl.value);
        f7.toast.show({
            text: 'Link copied to clipboard',
            closeTimeout: 1500,
            color: 'blue'
        });
    }
}

// Version history support
import { useTableStore } from '@/stores';
const tableStore = useTableStore();
const tableId = computed(() => state.tableId || '');
const currentVersion = computed(() => tableStore.currentVersion?.version || 1);

const emit = defineEmits<{
    rollback: [versionId: string, version: number];
}>();

const commonIcons = [
    'doc_text', 'doc_text_search', 'house', 'person_2', 'cart',
    'map', 'calendar', 'gear', 'wrench', 'briefcase',
    'bubble_left', 'camera', 'chart_bar', 'checkmark_circle',
    'bolt', 'star', 'tag', 'flag', 'bell'
];

function selectIcon(icon: string) {
    updateSettings({ icon });
    showIconPicker.value = false;
}

function handleRollback(versionId: string, version: number) {
    emit('rollback', versionId, version);
}
</script>

<style scoped>
.app-settings-panel {
    max-width: 800px;
    margin: 0 auto;
    padding-bottom: 40px;
}

.icon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 16px;
    padding: 16px;
}

.icon-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px;
    border: 1px solid var(--f7-list-border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
}

.icon-item:hover {
    background: rgba(0, 0, 0, 0.05);
}

.icon-item span {
    font-size: 12px;
    text-align: center;
    word-break: break-all;
}

.badge {
    background: var(--f7-color-gray);
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    text-transform: uppercase;
}
</style>
