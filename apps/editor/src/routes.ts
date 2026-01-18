import { useAuthStore } from '@/stores/auth.store';
import type { Router } from 'framework7/types';

import FormEditorPage from './app/form-editor/FormEditorPage.vue';
import AppDetailPage from './pages/AppDetailPage.vue';
import AppsPage from './pages/AppsPage.vue';
import HomePage from './pages/HomePage.vue';
import LoginPage from './pages/LoginPage.vue';

// Guard: Check if authenticated
const checkAuth = async ({ resolve }: any) => {
  const authStore = useAuthStore();
  console.log('[AuthGuard] Checking auth state...', { 
      token: authStore.token, 
      isAuthenticated: authStore.isAuthenticated,
      user: authStore.user 
  });
  
  if (!authStore.isAuthenticated) {
     console.log('[AuthGuard] Not authenticated. Redirecting to /login');
     // Redirect to login handled by resolve
     resolve({ url: '/login' }); 
  } else {
    // Check if user data is loaded?
    console.log('[AuthGuard] Authenticated.');
    if (!authStore.user) {
        console.log('[AuthGuard] Fetching user profile...');
        try {
            await authStore.fetchUser();
            console.log('[AuthGuard] Profile fetched:', authStore.user);
        } catch (e) {
            console.error('[AuthGuard] Failed to fetch profile:', e);
            // If fetch fails (e.g. 401), store might logout, so strictly we should recheck but let's proceed or logout
        }
    }
    console.log('[AuthGuard] Proceeding.');
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
    path: '/apps',
    component: AppsPage,
    beforeEnter: beforeEnterGuard,
  },
  {
    path: '/apps/:slug',
    component: AppDetailPage,
    beforeEnter: beforeEnterGuard,
  },
  {
    path: '/forms/new',
    component: FormEditorPage,
    beforeEnter: beforeEnterGuard,
  },
  {
    path: '/forms/:id',
    component: FormEditorPage,
    beforeEnter: beforeEnterGuard,
  },
];

export default routes;
