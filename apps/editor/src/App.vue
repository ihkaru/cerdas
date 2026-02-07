<template>
  <!-- Loading Screen while checking auth -->
  <div v-if="isCheckingAuth" class="auth-loading">
    <div class="loading-spinner"></div>
    <p>Loading...</p>
  </div>

  <!-- Main Framework7 App component where we pass Framework7 params -->
  <f7-app v-else v-bind="f7params">
    <!-- Static Header & Sidebar (outside f7-view) -->
    <AppLayout />

    <!-- Main View - positioned to account for sidebar only when sidebar is visible -->
    <f7-view main :url="initialUrl" :browser-history="true" browser-history-separator="" :animate="false"
      :ios-swipe-back="false" :class="{ 'main-view-with-sidebar': !isFullscreenPage }">
    </f7-view>
  </f7-app>
</template>

<script setup lang="ts">
import { f7ready } from 'framework7-vue';
import type { Framework7Parameters } from 'framework7/types';
import { computed, onMounted, ref } from 'vue';
import AppLayout from './components/AppLayout.vue';
import routes from './routes';
import { useAuthStore } from './stores/auth.store';
import { initRefreshRateDetection } from './utils/refreshRate';

console.log('[12-APP] App.vue script setup executing');

// Auth state
const isCheckingAuth = ref(true);
const initialUrl = ref('/');
const currentPath = ref(window.location.pathname);

// Determine if current page should be fullscreen (no sidebar/header)
const isFullscreenPage = computed(() => {
  return currentPath.value === '/login' ||
    currentPath.value.startsWith('/forms/') ||
    currentPath.value.startsWith('/tables/') ||
    currentPath.value.startsWith('/editor/');
});

console.log('[13-APP] Initial state: isCheckingAuth=true, initialUrl=/');

// Check auth on mount BEFORE rendering the app
onMounted(async () => {
  console.log('[14-APP] onMounted started');

  const authStore = useAuthStore();
  const pathOnLoad = window.location.pathname;

  console.log('[15-APP] Checking auth...', {
    token: !!authStore.token,
    isAuthenticated: authStore.isAuthenticated,
    currentPath: pathOnLoad
  });

  // If on login page, no need to check
  if (pathOnLoad === '/login') {
    console.log('[16-APP] Already on login page, showing login');
    initialUrl.value = '/login';
    isCheckingAuth.value = false;
    return;
  }

  // If no token, redirect to login
  if (!authStore.isAuthenticated) {
    console.log('[16-APP] No auth token, setting initialUrl to /login');
    initialUrl.value = '/login';
    isCheckingAuth.value = false;
    console.log('[17-APP] isCheckingAuth set to false');
    return;
  }

  // Has token, verify it's valid by fetching user
  console.log('[16-APP] Has token, verifying with API...');
  try {
    await authStore.fetchUser();
    console.log('[17-APP] Auth verified, user:', authStore.user?.email);
    initialUrl.value = pathOnLoad || '/';
  } catch (e) {
    console.error('[17-APP] Auth verification failed:', e);
    authStore.logout();
    initialUrl.value = '/login';
  }

  console.log('[18-APP] Auth check complete. initialUrl set to:', initialUrl.value);
  isCheckingAuth.value = false;
  console.log('[DEBUG-PERF] f7-app should render now with url:', initialUrl.value);

  // Listen to route changes to update currentPath reactively
  f7ready((f7) => {
    console.log('[19-APP] F7 Ready, attaching route listener');

    // Start FPS monitoring when a route change begins
    // Using 'routeChange' as the start event
    f7.on('routeChange', (newRoute: { path: string }) => {
      const fromPath = currentPath.value;
      // Dynamically import to avoid bundling when not needed
      import('./utils/refreshRate').then(({ startTransitionMonitor }) => {
        startTransitionMonitor(`${fromPath} → ${newRoute.path}`);
      });
    });

    // Stop monitoring when route change completes (after animation)
    f7.on('routeChanged', (route: { path: string }) => {
      console.log('[APP-ROUTE] Route changed to:', route.path);
      currentPath.value = route.path;

      // Stop FPS monitor after a small delay to capture the full transition
      setTimeout(() => {
        import('./utils/refreshRate').then(({ stopTransitionMonitor }) => {
          stopTransitionMonitor();
        });
      }, 50); // 50ms after routeChanged to capture tail of animation
    });
  });

  // Initialize refresh rate detection for adaptive animations
  try {
    const refreshInfo = await initRefreshRateDetection();
    console.log('[20-APP] Refresh rate detected:', refreshInfo);
  } catch (e) {
    console.warn('[20-APP] Could not detect refresh rate:', e);
  }
});

// Framework7 parameters - Using MD theme with desktop optimizations
const f7params = ref<Framework7Parameters>({
  name: 'Cerdas Editor',
  theme: 'md',
  routes,
  touch: {
    disableContextMenu: false,
  },
  view: {
    // Disable F7 animations - using custom CSS slide-up animation
    animate: false,
    iosSwipeBack: false,
  },
});
</script>

<style>
/* ============================================================================
   Desktop-Optimized UI Styles for Cerdas Editor
   ============================================================================ */

/* Import Modern Font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  /* Theme Colors */
  --f7-theme-color: #2563eb;
  --f7-theme-color-rgb: 37, 99, 235;

  /* Modern Font */
  --f7-font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  /* Compact Typography */
  --f7-font-size: 14px;
  --f7-line-height: 1.5;

  /* Compact Navbar & Toolbar */
  --f7-navbar-height: 44px;
  --f7-navbar-font-size: 15px;
  --f7-toolbar-height: 40px;
  --f7-subnavbar-height: 40px;

  /* Compact List Items */
  --f7-list-item-title-font-size: 14px;
  --f7-list-item-subtitle-font-size: 12px;
  --f7-list-item-text-font-size: 12px;
  --f7-list-item-padding-vertical: 8px;
  --f7-list-item-padding-horizontal: 12px;
  --f7-list-item-min-height: 40px;

  /* Compact Inputs */
  --f7-input-height: 36px;
  --f7-input-font-size: 14px;

  /* Compact Buttons */
  --f7-button-height: 36px;
  --f7-button-font-size: 14px;
  --f7-button-padding-horizontal: 16px;
  --f7-button-border-radius: 8px;

  /* Compact Block */
  --f7-block-padding-horizontal: 16px;
  --f7-block-padding-vertical: 16px;
  --f7-block-margin-vertical: 16px;
  --f7-block-title-font-size: 13px;

  /* Compact Tabs */
  --f7-tabbar-link-font-size: 13px;
}

/* Modern Scrollbars */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Hide page content default styling for custom layouts */
.framework7-root .page-content {
  padding-top: 0 !important;
}

/* Smooth transitions */
* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Button hover effects */
.button {
  transition: all 0.15s ease;
}

/* Link hover effects */
a {
  transition: color 0.15s ease;
}

/* ============================================================================
   Main View Positioning (account for fixed header & sidebar)
   ============================================================================ */
.main-view-with-sidebar {
  --header-height: 56px;
  --sidebar-width: 240px;

  position: fixed !important;
  top: var(--header-height) !important;
  left: var(--sidebar-width) !important;
  right: 0 !important;
  bottom: 0 !important;
  width: auto !important;
  z-index: 100;
  overflow-y: auto;
}

/* ============================================================================
   Fullscreen View (login page, form editor - no sidebar)
   ============================================================================ */
.framework7-root>.view:not(.main-view-with-sidebar) {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
}

/* Pages inside the view should fill the available space */
.main-view-with-sidebar .page {
  background: #f8fafc;
}

.main-view-with-sidebar .page-content {
  padding: 24px 32px;
}

/* ============================================================================
   Page Transition - GPU Accelerated, Adaptive Refresh Rate
   ============================================================================ */

/*
 * BEST PRACTICES IMPLEMENTED:
 * 1. Only animate transform & opacity (GPU-accelerated, no layout thrashing)
 * 2. Use CSS custom properties for adaptive animation duration
 * 3. Respect prefers-reduced-motion for accessibility
 * 4. Duration adapts to detected refresh rate via --page-transition-duration
 */

:root {
  /* Default values - will be overridden by refreshRate.ts */
  --page-transition-duration: 200ms;
  --page-transition-easing: cubic-bezier(0.4, 0, 0.2, 1);
  /* Material Design standard */
}

/* Respect user preference for reduced motion */
@media (prefers-reduced-motion: reduce) {
  :root {
    --page-transition-duration: 0ms;
  }
}

/* Base page styling - all pages absolutely positioned with GPU hints */
.framework7-root .view .page {
  background: #f8fafc !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
  /* GPU acceleration hint */
  will-change: transform, opacity;
  /* Smooth transitions using only GPU-accelerated properties */
  transition:
    transform var(--page-transition-duration) var(--page-transition-easing),
    opacity var(--page-transition-duration) var(--page-transition-easing);
}

/* Current page - visible, on top, at final position */
.framework7-root .view .page-current {
  z-index: 10 !important;
  visibility: visible !important;
  opacity: 1 !important;
  display: block !important;
  pointer-events: auto !important;
  transform: translateY(0) !important;
}

/* Previous page - slide up and fade out */
.framework7-root .view .page-previous {
  z-index: 1 !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
  transform: translateY(-20px) !important;
}

/* Next page (entering from below) - start below, invisible */
.framework7-root .view .page-next {
  z-index: 5 !important;
  visibility: visible !important;
  opacity: 0 !important;
  pointer-events: none !important;
  transform: translateY(20px) !important;
}

/* Master/detail pages */
.framework7-root .view .page-master,
.framework7-root .view .page-master-detail {
  z-index: 5 !important;
}

/* Remove will-change after animation to free GPU memory */
.framework7-root .view .page-previous,
.framework7-root .view .page-next {
  will-change: auto;
}

/* ============================================================================
   Auth Loading Screen
   ============================================================================ */
.auth-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  z-index: 9999;
}

.auth-loading p {
  margin-top: 16px;
  color: #64748b;
  font-size: 14px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
