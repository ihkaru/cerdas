<template>
    <div class="app-layout" :class="{ 'full-screen': isFullscreenPage }">
        <!-- Desktop Header (Static) - Hidden on full-screen pages -->
        <header v-if="!isFullscreenPage" class="desktop-header">
            <div class="header-left">
                <a href="#" @click.prevent="navigate('/')" class="logo">
                    <f7-icon f7="cube_fill" color="blue" />
                    <span class="logo-text">Cerdas Editor</span>
                </a>
            </div>
            <div class="header-center">
                <div class="search-box">
                    <f7-icon f7="search" />
                    <input type="text" placeholder="Search apps, forms..." v-model="searchQuery" />
                    <kbd>⌘K</kbd>
                </div>
            </div>
            <div class="header-right">
                <f7-link icon-f7="bell" class="header-icon" />
                <f7-link icon-f7="gear" class="header-icon" />

                <f7-link popover-open=".user-menu-popover" class="avatar-link">
                    <div class="user-avatar">
                        <span>{{ userInitials }}</span>
                    </div>
                </f7-link>
            </div>
        </header>

        <!-- User Menu Popover -->
        <f7-popover class="user-menu-popover">
            <f7-list>
                <f7-list-item link="#" popover-close title="My Profile"></f7-list-item>
                <f7-list-item link="#" popover-close title="Settings"></f7-list-item>
                <f7-list-item divider></f7-list-item>
                <f7-list-item link="#" popover-close title="Sign Out" @click="handleLogout"
                    class="text-color-red"></f7-list-item>
            </f7-list>
        </f7-popover>

        <!-- Sidebar (Static) - Hidden on full-screen pages -->
        <aside v-if="!isFullscreenPage" class="sidebar">
            <nav class="sidebar-nav">
                <a href="#" @click.prevent="navigate('/')" class="nav-item" :class="{ active: currentPath === '/' }">
                    <f7-icon f7="house_fill" />
                    <span>Dashboard</span>
                </a>
                <a href="#" @click.prevent="navigate('/apps')" class="nav-item"
                    :class="{ active: currentPath.startsWith('/apps') }">
                    <f7-icon f7="app_fill" />
                    <span>Apps</span>
                </a>
            </nav>

            <div class="sidebar-section">
                <div class="section-title">Recent Apps</div>
                <a v-for="app in recentApps" :key="app.id" href="#"
                    @click.prevent="navigate(`/apps/${app.slug || app.id}`)" class="nav-item sub-item">
                    <div class="app-dot" :style="{ background: app.color }"></div>
                    <span>{{ app.name }}</span>
                </a>
            </div>

            <div class="sidebar-footer">
                <a href="#" class="nav-item">
                    <f7-icon f7="question_circle" />
                    <span>Help & Docs</span>
                </a>
            </div>
        </aside>
    </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores';
import { useAuthStore } from '@/stores/auth.store';
import { f7, f7ready } from 'framework7-vue';
import { computed, onMounted, ref } from 'vue';

const authStore = useAuthStore();
const appStore = useAppStore();

// ============================================================================
// State
// ============================================================================

const searchQuery = ref('');
const currentPath = ref('/');

const recentApps = computed(() => {
    // Take top 5 apps from store
    const colors = ['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#ec4899'];
    return appStore.apps.slice(0, 5).map((app, index) => ({
        id: app.id,
        slug: app.slug,
        name: app.name,
        color: colors[index % colors.length]
    }));
});

// ============================================================================
// Computed
// ============================================================================

// Hide header/sidebar on editor pages or login page
const isFullscreenPage = computed(() => {
    return currentPath.value.startsWith('/forms/') || currentPath.value === '/login';
});

// User Initials from Auth Store
const userInitials = computed(() => {
    if (!authStore.user || !authStore.user.name) return '??';
    const names = authStore.user.name.trim().split(/\s+/);
    if (names.length >= 2 && names[0] && names[1]) {
        return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0] ? names[0].substring(0, 2).toUpperCase() : '??';
});

// Logout Handler
const handleLogout = () => {
    authStore.logout();
    window.location.href = '/login';
};

// ============================================================================
// Watch route changes
// ============================================================================

onMounted(() => {
    // Get initial path
    currentPath.value = window.location.pathname;

    // Listen to route changes
    // Use f7ready to ensure F7 is fully initialized
    f7ready((f7) => {
        f7.on('routeChange', (newRoute: { path: string }) => {
            console.log('[LAYOUT] Route changed to:', newRoute.path);
            currentPath.value = newRoute.path;
        });
    });
});

// Helper for navigation since this component is outside f7-view
const navigate = (path: string) => {
    const f7Instance = f7 || (window as any).f7;
    if (f7Instance && f7Instance.view && f7Instance.view.main) {
        f7Instance.view.main.router.navigate(path);
    } else {
        // Fallback
        window.location.href = path;
    }
};
</script>

<style scoped>
/* ============================================================================
   Shared Desktop Layout Styles
   ============================================================================ */

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
}

.search-box input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 14px;
    color: #1e293b;
}

.search-box input::placeholder {
    color: #94a3b8;
}

.search-box kbd {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 11px;
    color: #64748b;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 16px;
}

.header-icon {
    color: #64748b;
}

.user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
    font-weight: 600;
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
