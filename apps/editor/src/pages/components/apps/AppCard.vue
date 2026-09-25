<template>
    <a :href="`/apps/${app.slug || app.id}`" class="app-card" :title="app.name">
        <div class="card-header">
            <div class="app-avatar" :style="{ background: app.color }">
                {{ avatarInitials }}
            </div>
            <div class="card-menu">
                <f7-link icon-f7="ellipsis" @click.prevent.stop="$emit('menu', app)" title="Menu Aplikasi" />
            </div>
        </div>
        <div class="card-body">
            <h3 class="app-title">{{ app.name }}</h3>
            <p class="app-desc">{{ app.description || 'Tidak ada deskripsi' }}</p>
        </div>
        <div class="card-stats">
            <div class="stat" title="Jumlah Formulir / Tabel">
                <f7-icon f7="doc_text" />
                <span>{{ app.formCount }} forms</span>
            </div>
            <div class="stat" title="Jumlah Anggota Tim">
                <f7-icon f7="person_2" />
                <span>{{ app.memberCount }} members</span>
            </div>
        </div>
        <div class="card-footer">
            <span class="view-btn">
                Open App
                <f7-icon f7="arrow_right" size="14" />
            </span>
        </div>
    </a>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AppItem } from './apps.types';

const props = defineProps<{
    app: AppItem;
}>();

defineEmits<{
    (e: 'menu', app: AppItem): void;
}>();

const avatarInitials = computed(() => {
    const trimmed = (props.app.name || '').trim();
    if (!trimmed) return 'AP';
    const words = trimmed.split(/\s+/);
    const first = words[0];
    const second = words[1];
    if (words.length >= 2 && first && second && first[0] && second[0]) {
        return (first[0] + second[0]).toUpperCase();
    }
    return trimmed.substring(0, 2).toUpperCase();
});
</script>

<style scoped>
.app-card {
    background: #ffffff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: all 0.18s ease;
    border: 1px solid #e2e8f0;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 220px;
}

.app-card:hover {
    border-color: #2563eb;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.12);
    transform: translateY(-1px);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 14px;
}

.app-avatar {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
    font-weight: 600;
    flex-shrink: 0;
}

.card-menu {
    opacity: 0.6;
    transition: opacity 0.15s;
}

.app-card:hover .card-menu {
    opacity: 1;
}

.card-body {
    flex: 1;
    min-width: 0;
}

.app-title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 6px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.app-desc {
    font-size: 13px;
    color: #64748b;
    margin: 0;
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
    min-height: 38px;
}

.card-stats {
    display: flex;
    gap: 16px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid #f1f5f9;
}

.stat {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    color: #64748b;
}

.stat :deep(.icon) {
    font-size: 14px;
    color: #94a3b8;
}

.card-footer {
    margin-top: 12px;
}

.view-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #2563eb;
    font-size: 13px;
    font-weight: 500;
    transition: gap 0.15s ease;
}

.app-card:hover .view-btn {
    gap: 8px;
}
</style>
