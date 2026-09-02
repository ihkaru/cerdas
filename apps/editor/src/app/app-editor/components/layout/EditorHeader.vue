<template>
    <header class="desktop-header">
        <div class="header-left">
            <a href="#" class="back-btn" @click.prevent="emit('back')">
                <f7-icon f7="chevron_left" />
            </a>
            <div class="form-title">
                <span class="title-text">
                    <span v-if="appName" class="app-name-wrap" @click.stop="emit('rename-app')" title="Ubah Nama Aplikasi">
                        <span class="app-name">{{ appName }}</span>
                        <f7-icon f7="pencil" class="app-edit-icon" size="11" />
                    </span>

                    <span class="breadcrumb-separator">/</span>

                    <!-- When in Schema tab and a table is active: show Table Name with rename -->
                    <span v-if="isSchemaTab && hasTableSelected" class="table-name-wrap" @click.stop="emit('rename-table')" title="Ubah Nama Tabel">
                        <span class="table-name">{{ title }}</span>
                        <span v-if="isDirty" class="dirty-dot" title="Perubahan belum disimpan"></span>
                        <f7-icon f7="pencil" class="edit-icon" size="11" />
                    </span>

                    <!-- When in other tabs or no table selected in schema: show Section Name -->
                    <span v-else class="section-name-wrap">
                        <span class="section-name">{{ currentSectionLabel }}</span>
                    </span>
                </span>
            </div>
        </div>

        <div class="header-center">
            <div class="status-indicator" :class="{ published: isPublished }">
                <span class="status-dot"></span>
                <span v-if="version">v{{ version }} - </span>
                <span>{{ isPublished ? 'Published' : 'Draft' }}</span>
            </div>
        </div>

        <div class="header-right">
            <button class="hdr-btn hdr-btn--save" @click="emit('save')" :disabled="!isDirty"
                :class="{ 'is-dirty': isDirty }">
                <f7-icon f7="arrow_down_doc" />
                Save Draft
            </button>
            <button class="hdr-btn hdr-btn--publish" @click="emit('publish')" :disabled="!canPublish">
                <f7-icon f7="paperplane_fill" />
                Publish
            </button>
            <div class="header-menu">
                <f7-link icon-f7="ellipsis" popover-open=".editor-menu-popover" />
            </div>
        </div>

        <!-- Editor Menu Popover -->
        <f7-popover class="editor-menu-popover">
            <f7-list>
                <f7-list-item link="#" popover-close title="Import JSON">
                    <f7-icon slot="media" f7="arrow_down_doc" />
                </f7-list-item>
                <f7-list-item link="#" popover-close title="Export JSON" @click="emit('export')">
                    <f7-icon slot="media" f7="arrow_up_doc" />
                </f7-list-item>
                <f7-list-item link="#" popover-close title="Preview in App">
                    <f7-icon slot="media" f7="device_phone_portrait" />
                </f7-list-item>
                <f7-list-item link="#" popover-close title="Version History">
                    <f7-icon slot="media" f7="clock" />
                </f7-list-item>
            </f7-list>
        </f7-popover>
    </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    title: string;
    appName?: string;
    activeTab?: string;
    hasTableSelected?: boolean;
    isDirty: boolean;
    isPublished: boolean;
    version?: number;
    canPublish?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    appName: '',
    activeTab: 'schema',
    hasTableSelected: false,
    version: undefined,
    canPublish: true,
});

const sectionLabels: Record<string, string> = {
    schema: 'Data & Schema',
    settings: 'Settings',
    views: 'Views',
    data_monitoring: 'Monitoring',
    actions: 'Actions',
    code: 'Code',
};

const currentSectionLabel = computed(() => sectionLabels[props.activeTab] || 'Editor');
const isSchemaTab = computed(() => props.activeTab === 'schema');

const emit = defineEmits<{
    rename: [];
    'rename-app': [];
    'rename-table': [];
    save: [];
    publish: [];
    back: [];
    export: [];
}>();
</script>

<style scoped>
.desktop-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: var(--header-height, 56px);
    background: white;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    z-index: 100;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    color: #64748b;
    text-decoration: none;
}

.back-btn:hover {
    background: #f1f5f9;
}

.form-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.title-text {
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.app-name-wrap {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
}

.app-name-wrap:hover {
    background: #f1f5f9;
}

.app-name-wrap:hover .app-name {
    color: #0f172a;
}

.app-name {
    color: #64748b;
    font-weight: 500;
    font-size: 14px;
}

.table-name-wrap {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s ease;
}

.table-name-wrap:hover {
    background: #f1f5f9;
}

.breadcrumb-separator {
    color: #cbd5e1;
    font-size: 14px;
    user-select: none;
}

.dirty-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #f97316;
}

.app-edit-icon,
.edit-icon {
    font-size: 12px;
    color: #3b82f6;
    opacity: 0;
    transition: opacity 0.15s ease, color 0.15s ease;
}

.app-name-wrap:hover .app-edit-icon,
.table-name-wrap:hover .edit-icon {
    opacity: 1;
}

.section-name-wrap {
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    color: #1e293b;
    font-size: 14px;
    font-weight: 600;
}

.header-center {
    display: flex;
    align-items: center;
}

.status-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 16px;
    background: #fef3c7;
    color: #d97706;
    font-size: 13px;
    font-weight: 500;
}

.status-indicator.published {
    background: #dcfce7;
    color: #16a34a;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

/*
 * Header action button tokens.
 * Two variants: save (ghost → filled blue when dirty) and publish (always green).
 * Both: height 32px, font-size 13px, border-radius 7px, gap 6px.
 */
.hdr-btn {
    all: unset;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 14px;
    height: 32px;
    border-radius: 7px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.01em;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s, box-shadow 0.15s, transform 0.1s;
}

.hdr-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
}

.hdr-btn:active:not(:disabled) {
    transform: scale(0.97);
}

/* Save Draft: ghost when clean, solid blue + pulse when dirty */
.hdr-btn--save {
    border: 1.5px solid #e2e8f0;
    color: #64748b;
    background: transparent;
}

.hdr-btn--save:hover:not(:disabled) {
    background: #f1f5f9;
    color: #1e293b;
}

.hdr-btn--save.is-dirty {
    background: #2563eb;
    border-color: #2563eb;
    color: white;
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4);
    animation: pulse-save 2s infinite;
}

.hdr-btn--save.is-dirty:hover {
    background: #1d4ed8;
}

@keyframes pulse-save {
    0%   { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
    70%  { box-shadow: 0 0 0 8px rgba(37, 99, 235, 0); }
    100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
}

/* Publish: always solid green */
.hdr-btn--publish {
    background: #16a34a;
    color: white;
    border: 1.5px solid transparent;
}

.hdr-btn--publish:hover:not(:disabled) {
    background: #15803d;
}
</style>
