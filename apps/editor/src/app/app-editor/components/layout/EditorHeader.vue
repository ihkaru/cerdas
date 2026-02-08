<template>
    <header class="desktop-header">
        <div class="header-left">
            <a href="#" class="back-btn" @click.prevent="emit('back')">
                <f7-icon f7="chevron_left" />
            </a>
            <div class="form-title" @click="emit('rename')">
                <span class="title-text">{{ title }}</span>
                <span v-if="isDirty" class="dirty-dot"></span>
                <f7-icon f7="pencil" class="edit-icon" />
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
            <f7-button outline @click="emit('save')" :disabled="!isDirty" class="save-btn">
                <f7-icon f7="arrow_down_doc" />
                Save Draft
            </f7-button>
            <f7-button fill class="publish-btn" @click="emit('publish')" :disabled="!canPublish">
                <f7-icon f7="paperplane_fill" />
                Publish
            </f7-button>
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
interface Props {
    title: string;
    isDirty: boolean;
    isPublished: boolean;
    version?: number;
    canPublish?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
    rename: [];
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
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
}

.form-title:hover {
    background: #f1f5f9;
}

.title-text {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
}

.dirty-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #f97316;
}

.edit-icon {
    font-size: 14px;
    color: #94a3b8;
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

.save-btn {
    --f7-button-outline-border-color: #e2e8f0;
    color: #64748b;
}

.publish-btn {
    --f7-button-bg-color: #16a34a;
}

.header-menu a {
    color: #64748b;
}
</style>
