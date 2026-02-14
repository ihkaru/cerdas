import type { Router } from 'framework7/types';

import Login from './app/auth/views/Login.vue';
import DashboardPage from './app/dashboard/views/DashboardPage.vue';
import { useAuthStore } from './common/stores/authStore';
import NotFoundPage from './pages/404.vue';
import AppShell from './pages/AppShell.vue';
import DynamicViewPage from './pages/DynamicViewPage.vue';
import SyncPage from './pages/SyncPage.vue';

const routes: Router.RouteParameters[] = [
  {
    path: '/',
    async({ resolve }) {
      const authStore = useAuthStore();
      console.log('[RouteResolver] Resolving "/" - isAuthenticated:', authStore.isAuthenticated);
      
      if (authStore.isAuthenticated) {
        resolve({ component: DashboardPage });
      } else {
        resolve({ component: Login });
      }
    }
  },
  {
    path: '/assignments/:assignmentId',
    async({ resolve }) {
      // Use async import to catch loading errors
      import('./pages/assignment-detail/AssignmentDetail.vue')
        .then((module) => {
          console.log('AssignmentDetail loaded successfully');
          resolve({ component: module.default });
        })
        .catch((err) => {
          console.error('FAILED to load AssignmentDetail component:', err);
        });
    }
  },
  {
    path: '/app/:contextId',
    component: AppShell,
  },
  {
    path: '/app/:contextId/view/:viewName/:recordId',
    component: DynamicViewPage,
  },
  {
    path: '/sync',
    component: SyncPage,
  },
  {
    path: '/login',
    component: Login,
  },
  {
    path: '(.*)',
    component: NotFoundPage, 
  },
];

export default routes;
