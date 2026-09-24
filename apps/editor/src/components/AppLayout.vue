<template>
  <div class="app-layout" :class="{ 'full-screen': isFullscreenPage }">
    <!-- Desktop Header (Static) - Hidden on full-screen pages -->
    <header v-if="!isFullscreenPage" class="desktop-header">
      <div class="header-left">
        <a href="javascript:void(0)" @click.prevent="navigate('/')" class="logo">
          <f7-icon f7="cube_fill" color="blue" />
          <span class="logo-text">Cerdas Editor</span>
        </a>
      </div>
      <div class="header-center">
        <div class="search-box" @click="openSearch" title="Cari aplikasi, form, atau navigasi (⌘K)">
          <f7-icon f7="search" />
          <span class="search-placeholder">Cari aplikasi, aksi...</span>
          <kbd>⌘K</kbd>
        </div>
      </div>
      <div class="header-right">
        <f7-link icon-f7="bell" class="header-icon" popover-open=".notification-popover">
          <span v-if="unreadCount > 0" class="badge color-red">{{ unreadCount }}</span>
        </f7-link>
        <f7-link
          icon-f7="gear"
          class="header-icon"
          @click="navigate('/api-keys')"
          title="Pengaturan &amp; API Keys"
        />

        <f7-link popover-open=".user-menu-popover" class="avatar-link">
          <div class="user-avatar" :title="authStore.user?.name || 'Profil'">
            <span>{{ userInitials }}</span>
          </div>
        </f7-link>
      </div>
    </header>

    <!-- Notification Popover -->
    <f7-popover class="notification-popover">
      <NotificationList />
    </f7-popover>

    <!-- User Menu Popover -->
    <f7-popover class="user-menu-popover">
      <f7-list>
        <f7-list-item link="#" popover-close title="Profil Saya" @click="showProfileModal = true">
          <f7-icon slot="media" f7="person_crop_circle" />
        </f7-list-item>
        <f7-list-item link="#" popover-close title="API Keys &amp; Integrasi" @click="navigate('/api-keys')">
          <f7-icon slot="media" f7="key" />
        </f7-list-item>
        <f7-list-item divider></f7-list-item>
        <f7-list-item link="#" popover-close title="Keluar (Sign Out)" @click="handleLogout" class="text-color-red">
          <f7-icon slot="media" f7="arrow_right_square" color="red" />
        </f7-list-item>
      </f7-list>
    </f7-popover>

    <!-- Sidebar (Static) - Hidden on full-screen pages -->
    <aside v-if="!isFullscreenPage" class="sidebar">
      <nav class="sidebar-nav">
        <a href="javascript:void(0)" @click.prevent="navigate('/')" class="nav-item"
          :class="{ active: currentPath === '/' }">
          <f7-icon f7="house_fill" />
          <span>Dashboard</span>
        </a>
        <a href="javascript:void(0)" @click.prevent="navigate('/applications')" class="nav-item"
          :class="{ active: currentPath.startsWith('/applications') || currentPath.startsWith('/apps') }">
          <f7-icon f7="app_fill" />
          <span>Apps</span>
        </a>
        <a href="javascript:void(0)" @click.prevent="navigate('/organizations')" class="nav-item"
          :class="{ active: currentPath.startsWith('/organizations') }">
          <f7-icon f7="building_2_fill" />
          <span>Organizations</span>
        </a>
        <a href="javascript:void(0)" @click.prevent="navigate('/api-keys')" class="nav-item"
          :class="{ active: currentPath.startsWith('/api-keys') }">
          <f7-icon f7="key_fill" />
          <span>API Keys</span>
        </a>
        <a href="javascript:void(0)" @click.prevent="showTrashModal = true" class="nav-item">
          <f7-icon f7="trash_fill" />
          <span>Trash</span>
          <span v-if="appStore.trashedApps?.length" class="sidebar-badge margin-left-auto">
            {{ appStore.trashedApps.length }}
          </span>
        </a>
      </nav>

      <div class="sidebar-section">
        <div class="section-title">Recent Apps</div>
        <a v-for="app in recentApps" :key="app.id" href="javascript:void(0)"
          @click.prevent="navigate(`/editor/${app.slug || app.id}`)" class="nav-item sub-item">
          <div class="app-dot" :style="{ background: app.color }"></div>
          <span>{{ app.name }}</span>
        </a>
      </div>

      <div class="sidebar-footer">
        <a href="javascript:void(0)" class="nav-item" @click.prevent="showDocsModal = true" title="Buka Dokumentasi REST API">
          <f7-icon f7="question_circle" />
          <span>Help &amp; API Docs</span>
        </a>
      </div>
    </aside>

    <!-- Global Modals -->
    <CommandPaletteModal
      :opened="isSearchOpen"
      v-model="searchQuery"
      :results="searchResults"
      @close="closeSearch"
      @select="executeSearchItem"
    />

    <UserProfileModal
      :opened="showProfileModal"
      @close="showProfileModal = false"
      @logout="handleLogout"
    />

    <ApiDocsModal
      v-model:opened="showDocsModal"
    />

    <AppTrashModal
      v-model:opened="showTrashModal"
      @restored="onAppRestored"
    />
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores';
import { useAuthStore } from '@/stores/auth.store';
import { useNotificationStore } from '@/stores/notification.store';
import { f7, f7ready } from 'framework7-vue';
import { storeToRefs } from 'pinia';
import { computed, onMounted, provide, ref } from 'vue';

import NotificationList from './NotificationList.vue';
import AppTrashModal from '@/pages/components/AppTrashModal.vue';
import CommandPaletteModal from './search/CommandPaletteModal.vue';
import UserProfileModal from './profile/UserProfileModal.vue';
import ApiDocsModal from '@/app/api-keys/components/ApiDocsModal.vue';

import { useGlobalSearch, GLOBAL_SEARCH_KEY } from './search/useGlobalSearch';

const authStore = useAuthStore();
const appStore = useAppStore();
const notificationStore = useNotificationStore();
const { unreadCount } = storeToRefs(notificationStore);

const showTrashModal = ref(false);
const showProfileModal = ref(false);
const showDocsModal = ref(false);
const currentPath = ref('/');

// Helper for navigation
const navigate = (path: string) => {
  const f7Instance = f7 || (window as any).f7;
  if (f7Instance?.view?.main) {
    f7Instance.view.main.router.navigate(path);
  } else {
    window.location.href = path;
  }
};

// Global Command Palette & Search
const globalSearch = useGlobalSearch(
  navigate,
  () => { showTrashModal.value = true; },
  () => { showDocsModal.value = true; }
);
provide(GLOBAL_SEARCH_KEY, globalSearch);

const {
  searchQuery,
  isOpen: isSearchOpen,
  results: searchResults,
  open: openSearch,
  close: closeSearch,
  execute: executeSearchItem,
} = globalSearch;

const recentApps = computed(() => {
  const colors = ['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#ec4899'];
  return appStore.apps.slice(0, 5).map((app, index) => ({
    id: app.id,
    slug: app.slug,
    name: app.name,
    color: colors[index % colors.length],
  }));
});

// Hide header/sidebar on editor pages or login page
const isFullscreenPage = computed(() => {
  return currentPath.value.startsWith('/tables/') ||
    currentPath.value === '/login' ||
    currentPath.value.startsWith('/editor/');
});

// User Initials from Auth Store
const userInitials = computed(() => {
  if (!authStore.user || !authStore.user.name) return 'AD';
  const names = authStore.user.name.trim().split(/\s+/);
  const first = names[0];
  const second = names[1];

  if (first && second) {
    return (first.charAt(0) + second.charAt(0)).toUpperCase();
  }
  return first ? first.substring(0, 2).toUpperCase() : 'AD';
});

const handleLogout = () => {
  authStore.logout();
  window.location.href = '/login';
};

onMounted(() => {
  currentPath.value = window.location.pathname;

  if (authStore.isAuthenticated) {
    notificationStore.fetchNotifications();
    appStore.fetchTrashedApps();
    appStore.fetchApps();
  }

  if (authStore.user?.id) {
    import('@/common/echo').then(({ default: echo }) => {
      echo.private(`App.Models.User.${authStore.user!.id}`)
        .notification((notification: any) => {
          notificationStore.handleRealtimeNotification(notification);
        });
    });
  }

  f7ready((f7ReadyInstance) => {
    f7ReadyInstance.on('routeChange', (newRoute: { path: string }) => {
      currentPath.value = newRoute.path;
      if (authStore.isAuthenticated) {
        appStore.fetchTrashedApps();
      }
    });
  });
});

function onAppRestored() {
  appStore.fetchApps();
  appStore.fetchTrashedApps();
}
</script>

<style scoped>
.sidebar-badge {
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 10px;
}

.margin-left-auto {
  margin-left: auto;
}

.app-layout {
  --header-height: 56px;
  --sidebar-width: 240px;
  min-height: 100vh;
  background: #f8fafc;
}

/* Desktop Header */
.desktop-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 200;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  text-decoration: none;
}

.logo :deep(.icon) {
  font-size: 24px;
}

.header-center {
  flex: 1;
  max-width: 480px;
  margin: 0 40px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 8px 12px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.search-box:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.search-placeholder {
  flex: 1;
  font-size: 13.5px;
  color: #64748b;
}

.search-box kbd {
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  color: #64748b;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.04);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  color: #64748b;
  cursor: pointer;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

/* Sidebar */
.sidebar {
  width: var(--sidebar-width);
  background: white;
  border-right: 1px solid #e2e8f0;
  position: fixed;
  top: var(--header-height);
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  z-index: 150;
}

.sidebar-nav {
  padding: 16px 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #64748b;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s;
  min-width: 0;
  cursor: pointer;
}

.nav-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-item:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.nav-item.active {
  background: #eff6ff;
  color: #2563eb;
}

.nav-item :deep(.icon) {
  font-size: 18px;
}

.sidebar-section {
  padding: 16px 12px;
  border-top: 1px solid #e2e8f0;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #94a3b8;
  padding: 0 12px;
  margin-bottom: 8px;
}

.sub-item {
  padding-left: 16px;
}

.app-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.sidebar-footer {
  margin-top: auto;
  padding: 16px 12px;
  border-top: 1px solid #e2e8f0;
}
</style>
