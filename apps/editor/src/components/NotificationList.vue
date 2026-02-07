<template>
    <div class="notification-list">
        <div class="list-header">
            <h3>Notifications</h3>
            <f7-link v-if="unreadCount > 0" @click="markAllRead">Mark all as read</f7-link>
        </div>
        
        <f7-list media-list>
            <f7-list-item v-for="notif in notifications" :key="notif.id" 
                :class="{ 'unread': !notif.read_at }"
                :title="notif.data.title"
                :text="notif.data.message"
                :after="formatTime(notif.created_at)"
                @click="handleClick(notif)"
                link="#"
                popover-close
            >
                <template #media>
                    <f7-icon f7="bell_fill" :color="notif.read_at ? 'gray' : 'blue'" />
                </template>
            </f7-list-item>
            
            <f7-list-item v-if="notifications.length === 0">
                <div class="empty-state">No notifications</div>
            </f7-list-item>
        </f7-list>
    </div>
</template>

<script setup lang="ts">
import { useNotificationStore } from '@/stores/notification.store';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { f7Icon, f7Link, f7List, f7ListItem } from 'framework7-vue';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';

dayjs.extend(relativeTime);

const store = useNotificationStore();
const { notifications, unreadCount } = storeToRefs(store);

onMounted(() => {
    store.fetchNotifications();
});

function formatTime(time: string) {
    return dayjs(time).fromNow();
}

function handleClick(notif: any) {
    if (!notif.read_at) {
        store.markAsRead(notif.id);
    }
    // Navigate if needed?
    // For now, it just marks as read.
}

function markAllRead() {
    store.markAllRead();
}
</script>

<style scoped>
.notification-list {
    min-width: 300px;
    max-height: 400px;
    overflow-y: auto;
}
.list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #e2e8f0;
}
.list-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}
.unread {
    background-color: #f0f9ff;
}
.empty-state {
    padding: 20px;
    text-align: center;
    color: #94a3b8;
}
</style>
