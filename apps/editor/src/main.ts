import { createApp } from 'vue';

console.log('[4-MAIN] main.ts module started loading');

// ============================================================================
// CRITICAL: Auth check BEFORE Vue mounts (prevents flash of protected content)
// ============================================================================
const token = localStorage.getItem('auth_token');
const currentPath = window.location.pathname;

console.log('[4.1-MAIN] Pre-mount auth check', { hasToken: !!token, currentPath });

if (!token && currentPath !== '/login') {
  console.log('[4.2-MAIN] No token and not on login page - redirecting NOW');
  window.location.href = '/login';
  // Stop execution - page will reload
  throw new Error('Redirecting to login');
}

console.log('[4.3-MAIN] Auth check passed, proceeding with Vue mount');
// ============================================================================

// Import Framework7 Bundle
import Framework7 from 'framework7/lite-bundle';

// Import Framework7-Vue Plugin Bundle
import Framework7Vue, { registerComponents } from 'framework7-vue/bundle';

// Import Framework7 Styles
import 'framework7/css/bundle';

// Import Icon Libraries
import 'framework7-icons/css/framework7-icons.css';
import 'material-icons/iconfont/material-icons.css';

// Import App Component
import App from './App.vue';

// Import App Styles
import './style.css';

// Import Shared Theme (for consistent styling with Client)
import '@cerdas/ui/theme.css';

// Import Pinia
import { createPinia } from 'pinia';

console.log('[5-MAIN] All imports completed');

// Initialize Framework7-Vue Plugin
Framework7.use(Framework7Vue);

// Create Vue App
const app = createApp(App);
console.log('[6-MAIN] Vue app created');

// Initialize Pinia
const pinia = createPinia();
app.use(pinia);
console.log('[7-MAIN] Pinia initialized');

// Register all Framework7 Vue components
registerComponents(app);
console.log('[8-MAIN] F7 components registered');

// Mount Vue App
console.log('[9-MAIN] About to mount Vue app...');
app.mount('#app');
console.log('[10-MAIN] Vue app mounted!');

// Remove initial loader after Vue is ready
const initialLoader = document.getElementById('initial-loader');
if (initialLoader) {
  console.log('[11-MAIN] Removing initial loader');
  initialLoader.remove();
} else {
  console.log('[11-MAIN] Initial loader already removed or not found');
}
