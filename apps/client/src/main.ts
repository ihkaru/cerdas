import { createPinia } from 'pinia';
import { createApp } from 'vue';

// Import Framework7 Bundle
import Framework7 from 'framework7/lite-bundle';

// Import Framework7-Vue Plugin Bundle
import Framework7Vue, { registerComponents } from 'framework7-vue/bundle';

// Import Framework7 Styles
import 'framework7-icons/css/framework7-icons.css';
import 'framework7/css/bundle';
import 'material-icons/iconfont/material-icons.css';

// Import App Component
import App from './App.vue';
// Note: DebugMenuSheet is imported directly in App.vue

// Import App Styles
import './style.css';

// Import Shared Theme (for consistent styling with Editor)
import '@cerdas/ui/theme.css';

// Database Init
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { f7 } from 'framework7-vue';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';
import GoogleSignInPlugin from 'vue3-google-signin';
import { useDashboardStore } from './app/dashboard/stores/dashboardStore';
import { databaseService } from './common/database/DatabaseService';
import { useAuthStore } from './common/stores/authStore';
import { logger } from './common/utils/logger';


// =============================================================================
// ANDROID BACK BUTTON HANDLER (Global Registration - before Vue mounts)
// =============================================================================
const closePanels = () => {
    if (f7.panel.get('left')?.opened) {
        logger.debug('Closing Left Panel');
        f7.panel.close('left');
        return true;
    }
    if (f7.panel.get('right')?.opened) {
        logger.debug('Closing Right Panel');
        f7.panel.close('right');
        return true;
    }
    return false;
};

const closeModals = () => {
    const selector = [
        '.dialog.modal-in',
        '.popup.modal-in',
        '.sheet-modal.modal-in',
        '.popover.modal-in',
        '.actions-modal.modal-in',
        '.login-screen.modal-in'
    ].find(s => document.querySelector(s));

    if (selector) {
        logger.debug('Closing Modal', { selector });
        if (selector.includes('dialog')) f7.dialog.close();
        else if (selector.includes('popup')) f7.popup.close();
        else if (selector.includes('sheet')) f7.sheet.close();
        else if (selector.includes('popover')) f7.popover.close();
        else if (selector.includes('actions')) f7.actions.close();
        else if (selector.includes('login')) f7.loginScreen.close();
        return true;
    }
    return false;
};

const setupBackButtonHandler = () => {
    logger.info('Registering Android Back Button Handler');
    
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        logger.debug('Native Back Button Pressed', { canGoBack });
        
        try {
            if (!f7?.view?.main?.router?.currentRoute) {
                logger.warn('Framework7/Router not ready');
                return;
            }

            const router = f7.view.main.router;
            const currentUrl = router.currentRoute.url;
            const historyLength = router.history.length;
            
            logger.debug('Navigation State', { currentUrl, historyLength });

            // 1. Close Open Panels
            if (closePanels()) return;

            // 2. Close Modals
            if (closeModals()) return;

            // 3. Navigate Back
            if (historyLength > 1) {
                logger.debug('Navigating Back (History > 1)');
                router.back();
                return;
            }

            // 4. At root - confirm exit
            if (currentUrl === '/' || currentUrl === '') {
                logger.info('At root - exiting app');
                CapacitorApp.exitApp();
                return;
            }

            // Not at root but history is 1 - navigate to root first
            logger.debug('Navigating to root first', { currentUrl });
            router.navigate('/', { clearPreviousHistory: true });

        } catch (err: any) {
            logger.error('Error handling back button', err);
        }
    });
};

// Register immediately for Android
if (Capacitor.getPlatform() === 'android') {
    setupBackButtonHandler();
}

// Suppress Framework7 CSS selector error on older Android WebView
const isFramework7SelectorError = (message: string) => {
    return message && (
        (message.includes('closest') && message.includes('not a valid selector')) ||
        (message.includes('DOMException') && message.includes('selector')) ||
        (message.includes('jeep-sqlite') && message.includes('unknown to this Stencil runtime'))
    );
};

// CRITICAL FIX: Monkey-patch Element.prototype.closest
const originalClosest = Element.prototype.closest;
Element.prototype.closest = function(selector: string) {
    try {
        return originalClosest.call(this, selector);
    } catch {
        // Ignore selector errors in older WebViews
        return null;
    }
};

// Also patch querySelectorAll and matches
const originalQuerySelectorAll = Element.prototype.querySelectorAll;
Element.prototype.querySelectorAll = function(selector: string) {
    try {
        return originalQuerySelectorAll.call(this, selector);
    } catch {
        return document.createDocumentFragment().querySelectorAll('*'); // Empty NodeList
    }
};

const originalMatches = Element.prototype.matches;
Element.prototype.matches = function(selector: string) {
    try {
        return originalMatches.call(this, selector);
    } catch {
        return false;
    }
};

window.addEventListener('error', (event) => {
    if (isFramework7SelectorError(event.message)) {
        event.preventDefault();
        return true;
    }
});

window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || String(event.reason);
    if (isFramework7SelectorError(reason)) {
        event.preventDefault();
    }
});

// Initialize Framework7-Vue Plugin
Framework7.use(Framework7Vue);

import { defineCustomElements } from '@ionic/pwa-elements/loader';

// Initialize everything before mounting
async function startApp() {
    try {
        logger.info('[MAIN 1] Cerdas Client starting...', { platform: Capacitor.getPlatform() });

        if (Capacitor.getPlatform() === 'web') {
            // Register PWA Elements (Camera, Toast, etc) on Web
            defineCustomElements(window);
            logger.info('[MAIN 1b] PWA Elements initialized');

            logger.info('[MAIN 2] starting jeepSqlite loader...');
            await jeepSqlite(window);
            logger.info('[MAIN 3] jeepSqlite loader completed');
            
            // Safe attribute setting
            customElements.whenDefined('jeep-sqlite').then(() => {
                const jeepEl = document.querySelector('jeep-sqlite');
                if (jeepEl) {
                    jeepEl.setAttribute('auto-save', 'true');
                    logger.info('[MAIN 3b] jeep-sqlite attributes set');
                }
            });
        }

        // Initialize DB (including Web Store if on web)
        logger.info('[MAIN 4] starting databaseService.init()...');
        await databaseService.init();
        logger.info('[MAIN 5] databaseService.init() completed');

        // Runtime Health Check (Production)
        if (import.meta.env.PROD) {
            import('./common/services/HealthCheckService').then(({ healthCheck }) => {
                // Delay slightly to allow UI to render first
                setTimeout(() => healthCheck.runStartupChecks(), 2000);
            });
        }

        // Create Vue App
        const app = createApp(App);

        // Init Pinia
        const pinia = createPinia();
        app.use(pinia);

        // Initialize Google Login (Web Fallback)
        app.use(GoogleSignInPlugin, {
          clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID
        });

        // Register all Framework7 Vue components
        registerComponents(app);


        // =============================================================================
        // EDITOR BRIDGE (for Live Preview)
        // =============================================================================
        const handleSetToken = (payload: any) => {
             logger.info('Received token from Editor');
                    
            const token = typeof payload === 'string' ? payload : payload.token;
            const roleLabel = (typeof payload === 'object' && payload.roleLabel) ? payload.roleLabel : 'User';

            localStorage.setItem('auth_token', token);
            
            // Try to update store if it exists
            try {
                const authStore = useAuthStore();
                authStore.token = token;
            } catch {
                // Pinia might not be ready yet
            }

            // Show visual feedback (UX)
            if (f7) {
                f7.toast.create({
                    text: `Switched to ${roleLabel}`,
                    icon: '<i class="f7-icons">person_crop_circle_fill_badge_checkmark</i>',
                    position: 'center',
                    closeTimeout: 2000,
                    cssClass: 'preview-toast-feedback'
                }).open();
            }
        };

        const handleSchemaOverride = async (payload: any) => {
            const { tableId, fields, layout } = payload;
            let { settings } = payload;
            // Fallback: extract from schema if not at top level
            if (!settings && payload.schema?.settings) {
                settings = payload.schema.settings;
            }
            // Legacy support for formId
            const targetId = tableId || payload.formId;
            
            const name = payload.name || payload.schema?.name;
            const description = payload.description || payload.schema?.description;
            
            const targetFields = fields || payload.schema?.fields || (Array.isArray(payload.schema) ? payload.schema : []);

            logger.info('Received schema override for table:', targetId);
            
            // 1. Set Memory Override (for instant component updates)
            (window as any).__SCHEMA_OVERRIDE = (window as any).__SCHEMA_OVERRIDE || {};
            (window as any).__SCHEMA_OVERRIDE[targetId] = { 
                schema: { 
                    name, 
                    description, 
                    settings, 
                    fields: targetFields 
                }, 
                layout 
            };
            
            // 2. Persist to SQLite (for Dashboard visibility on refresh)
            try {
                const db = await databaseService.getDB();
                
                // Check if we already have this table and what its app_id is
                const existingRes = await db.query('SELECT app_id FROM tables WHERE id = ?', [targetId]);
                const existingAppId = existingRes.values?.[0]?.app_id;
                
                const sql = `
                    INSERT OR REPLACE INTO tables (id, app_id, name, description, fields, layout, settings, version, synced_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const values = [
                    targetId,
                    payload.appId || existingAppId || targetId, // Use tableId as fallback if no appId
                    name || 'Preview Table',
                    description || '',
                    JSON.stringify(targetFields),
                    JSON.stringify(layout),
                    JSON.stringify(settings || {}),
                    payload.version || 1,
                    new Date().toISOString()
                ];
                await db.run(sql, values);
                logger.debug('Persisted preview schema to DB', { tableId: targetId });
                logger.debug('[DEBUG] Layout views.default saved to SQLite:', JSON.stringify({
                    groupBy: layout?.views?.default?.groupBy || 'NONE',
                    deck: layout?.views?.default?.deck || 'NO DECK'
                }));

                // 3. Force Dashboard Reload (Critical Fix)
                try {
                    const dashboardStore = useDashboardStore();
                    await dashboardStore.loadData(true);
                    logger.info('Dashboard reloaded with new preview data');
                } catch (storeErr) {
                    logger.warn('Failed to reload dashboard store', storeErr);
                }

            } catch (e) {
                    logger.error('Failed to persist preview schema to DB', e);
            }

            // 4. Handle App View Configs Override
            if (payload.viewConfigs && payload.appId) {
                try {
                     const db = await databaseService.getDB();
                     await db.run(`UPDATE apps SET view_configs = ? WHERE id = ?`, 
                        [JSON.stringify(payload.viewConfigs), payload.appId]);
                     logger.debug('Persisted app view configs to DB', { appId: payload.appId });
                     
                     // Register memory override for instant updates
                     (window as any).__SCHEMA_OVERRIDE = (window as any).__SCHEMA_OVERRIDE || {};
                     (window as any).__SCHEMA_OVERRIDE[`APP_${payload.appId}`] = {
                         viewConfigs: payload.viewConfigs
                     };

                } catch (e) {
                    logger.error('Failed to persist app view configs', e);
                }
            }

            // 5. Notify Components
            logger.debug('[MAIN] Dispatching schema-override-updated event', { tableId: targetId });
            window.dispatchEvent(new CustomEvent('schema-override-updated', {
                    detail: { tableId: targetId, fields: targetFields, layout, viewConfigs: payload.viewConfigs }
            }));
            logger.debug('[MAIN] Event dispatched successfully');
        };

        const handleRefreshData = async () => {
             logger.info('Received REFRESH_DATA command from Editor');
            try {
                const dashboardStore = useDashboardStore();
                // Reload data forces hard refresh from DB
                await dashboardStore.loadData(true);
                logger.info('Dashboard data refreshed successfully');
                
                // Also force F7 to update if needed
                if (f7 && f7.view && f7.view.main) {
                        f7.view.main.router.refreshPage();
                }
            } catch (e) {
                logger.error('Failed to refresh data', e);
            }
        };

        if (window.self !== window.top) {
            logger.info('Running inside iframe, initializing Editor Bridge');

            window.addEventListener('message', async (event) => {
                // Only accept messages from localhost in dev
                if (!event.origin.includes('localhost')) return;

                const { type, payload } = event.data;

                if (type === 'SET_TOKEN') handleSetToken(payload);
                if (type === 'SET_SCHEMA_OVERRIDE') await handleSchemaOverride(payload);
                if (type === 'REFRESH_DATA') await handleRefreshData();
            });

            // Handshake: Notify Editor that we are ready to receive messages
            window.parent.postMessage({ type: 'EDITOR_CLIENT_READY' }, '*');
        }

        // Mount Vue App
        app.mount('#app');
        logger.info('Vue App mounted');
    } catch (err) {
        logger.error('Critical failure during app startup', err);
    }
}

startApp();
