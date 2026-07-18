import { useAuthStore } from '@/stores/auth.store';
import { useLogger } from '@/utils/logger';
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
  const log = useLogger('AuthGuard');
  const start = performance.now();
  log.debug('Starting check. Auth:', authStore.isAuthenticated, 'User:', !!authStore.user);
  
  if (!authStore.isAuthenticated) {
     log.debug('Not authenticated. Redirecting to /login');
     resolve({ url: '/login' }); 
  } else {
    if (!authStore.user) {
        log.debug('User missing. Fetching...');
        try {
            await authStore.fetchUser();
            log.debug('User fetched. Duration:', performance.now() - start);
        } catch (e) {
            log.error('Fetch failed:', e);
        }
    } else {
        log.debug('User exists. Proceeding immediately.');
    }
    log.debug('Resolving. Total duration:', performance.now() - start);
    resolve();
  }
};

// Wrapper for F7 v9+ beforeEnter
// V9 signature is: (ctx: { to, from, resolve, reject, router, ... }) => void
const beforeEnterGuard = (ctx: any) => {
  const log = useLogger('Router');
  log.debug('beforeEnterGuard triggered');
  const { resolve, reject } = ctx || {};
  if (!resolve) {
      log.error('Resolve is undefined! Context:', ctx);
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
