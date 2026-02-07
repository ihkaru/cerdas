import { ApiClient } from '@/common/api/ApiClient';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Notification {
    id: string;
    type: string;
    data: {
        title: string;
        message: string;
        org_name?: string;
        inviter_name?: string;
        [key: string]: any;
    };
    read_at: string | null;
    created_at: string;
}

export const useNotificationStore = defineStore('notification', () => {
    const notifications = ref<Notification[]>([]);
    const unreadCount = ref(0);
    const loading = ref(false);

    async function fetchNotifications() {
        loading.value = true;
        try {
            const res = await ApiClient.get('/notifications');
            if (res.data.success) {
                notifications.value = res.data.data;
                unreadCount.value = res.data.unread_count;
            }
        } catch (e) {
            console.error('Failed to fetch notifications', e);
        } finally {
            loading.value = false;
        }
    }

    async function markAsRead(id: string) {
        try {
            await ApiClient.post(`/notifications/${id}/read`);
            const notif = notifications.value.find(n => n.id === id);
            if (notif && !notif.read_at) {
                notif.read_at = new Date().toISOString();
                unreadCount.value = Math.max(0, unreadCount.value - 1);
            }
        } catch (e) {
            console.error('Failed to mark as read', e);
        }
    }

    async function markAllRead() {
        try {
            await ApiClient.post('/notifications/read-all');
            notifications.value.forEach(n => n.read_at = new Date().toISOString());
            unreadCount.value = 0;
        } catch (e) {
            console.error('Failed to mark all read', e);
        }
    }

    function handleRealtimeNotification(notification: any) {
        // notification structure from broadcast might differ slightly
        // We need to shape it like the API response
        const newNotif: Notification = {
            id: notification.id,
            type: notification.type,
            data: {
                title: notification.title,
                message: notification.message,
                org_name: notification.org_name,
                inviter_name: notification.inviter_name,
            },
            read_at: null,
            created_at: new Date().toISOString()
        };
        
        notifications.value.unshift(newNotif);
        unreadCount.value++;
    }

    return {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllRead,
        handleRealtimeNotification
    };
});
