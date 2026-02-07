import { useAuthStore } from '@/stores/auth.store';
import type { Router } from 'framework7/types';

import AppEditorPage from './app/app-editor/AppEditorPage.vue';
import AppDetailPage from './pages/AppDetailPage.vue';
import AppsPage from './pages/AppsPage.vue';
import HomePage from './pages/HomePage.vue';
import LoginPage from './pages/LoginPage.vue';
import OrganizationsPage from './pages/OrganizationsPage.vue';

// Guard: Check if authenticated
const checkAuth = async ({ resolve }: any) => {
  const authStore = useAuthStore();
  const start = performance.now();
  console.log('[DEBUG-PERF] [AuthGuard] Starting check. Auth:', authStore.isAuthenticated, 'User:', !!authStore.user);
  
  if (!authStore.isAuthenticated) {
     console.log('[DEBUG-PERF] [AuthGuard] Not authenticated. Redirecting to /login');
     resolve({ url: '/login' }); 
  } else {
    if (!authStore.user) {
        console.log('[DEBUG-PERF] [AuthGuard] User missing. Fetching...');
        try {
            await authStore.fetchUser();
            console.log('[DEBUG-PERF] [AuthGuard] User fetched. Duration:', performance.now() - start);
        } catch (e) {
            console.error('[DEBUG-PERF] [AuthGuard] Fetch failed:', e);
        }
    } else {
        console.log('[DEBUG-PERF] [AuthGuard] User exists. Proceeding immediately.');
    }
    console.log('[DEBUG-PERF] [AuthGuard] Resolving. Total duration:', performance.now() - start);
    resolve();
  }
};

// Wrapper for F7 v9+ beforeEnter
// V9 signature is: (ctx: { to, from, resolve, reject, router, ... }) => void
const beforeEnterGuard = (ctx: any) => {
  console.log('[Router] beforeEnterGuard triggered', ctx);
  // Destructure safely just in case ctx is weird, though in v9 it should be object
  const { resolve, reject } = ctx || {};
  if (!resolve) {
      console.error('[Router] Resolve is undefined! Context:', ctx);
      return; 
  }
  checkAuth({ resolve, reject });
};

const routes: Router.RouteParameters[] = [
  {
    path: '/login',
    component: LoginPage,
  },
  {
    path: '/',
    component: HomePage,
    beforeEnter: beforeEnterGuard,
  },
  {
    path: '/applications',
    component: AppsPage,
    beforeEnter: beforeEnterGuard,
  },
  {
    path: '/organizations',
    component: OrganizationsPage,
    beforeEnter: beforeEnterGuard,
  },
  {
    path: '/apps/:slug',
    component: AppDetailPage,
    beforeEnter: beforeEnterGuard,
  },
  {
    path: '/editor/:slug',
    component: AppEditorPage,
    beforeEnter: beforeEnterGuard,
  },
  {
    path: '/tables/new',
    component: AppEditorPage,
    beforeEnter: beforeEnterGuard,
  },
  {
    path: '/tables/:id',
    component: AppEditorPage,
    beforeEnter: beforeEnterGuard,
  },
];

export default routes;
