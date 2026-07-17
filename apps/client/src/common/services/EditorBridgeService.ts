/* eslint-disable */
import { f7 } from 'framework7-vue';
import { useDashboardStore } from '../../app/dashboard/stores/dashboardStore';
import { databaseService } from '../database/DatabaseService';
import { useAuthStore } from '../stores/authStore';
import { useLogger } from '../utils/logger';

/**
 * EditorBridgeService handles communication between the Editor (Parent) 
 * and the Client App (Iframe/Preview).
 * 
 * It manages:
 * - Handshake (EDITOR_CLIENT_READY)
 * - Authentication Sync (SET_TOKEN)
 * - Schema Overrides (SET_SCHEMA_OVERRIDE)
 * - Data Refreshes (REFRESH_DATA)
 */
export class EditorBridgeService {
    private static instance: EditorBridgeService;
    private log = useLogger('EditorBridge');
    private isInitialized = false;

    private constructor() {
        // Private constructor for singleton
    }

    public static getInstance(): EditorBridgeService {
        if (!EditorBridgeService.instance) {
            EditorBridgeService.instance = new EditorBridgeService();
        }
        return EditorBridgeService.instance;
    }

    /**
     * Start listening for messages from the Editor.
     */
    public init() {
        if (this.isInitialized) return;

        // Check if we are running inside an iframe
        if (window.self === window.top) {
            this.log.debug('Running in standalone mode - Editor Bridge inactive.');
            return;
        }

        this.log.info('Initializing Editor Bridge (running in iframe)...');
        
        window.addEventListener('message', async (event) => {
            // SECURITY: Log the origin to help with production debugging
            this.log.debug(`Received message from origin: ${event.origin}`, { type: event.data?.type });

            // Currently allowing dynamic origin for Capacitor/PWA flexibility, 
            // but we could whitelist production domains here.
            if (import.meta.env.PROD && !event.origin.includes('localhost') && !event.origin.includes('dvlpid.my.id')) {
                this.log.warn(`Message origin ${event.origin} is not in typical whitelist. Processing anyway due to Capacitor constraints.`);
            }

            const { type, payload } = event.data;

            try {
                switch (type) {
                    case 'SET_TOKEN':
                        await this.handleSetToken(payload);
                        break;
                    case 'SET_SCHEMA_OVERRIDE':
                        await this.handleSchemaOverride(payload);
                        break;
                    case 'REFRESH_DATA':
                        await this.handleRefreshData();
                        break;
                    case 'NAVIGATE_TO':
                        await this.handleNavigateTo(payload);
                        break;
                    default:
                        // Ignore unknown messages
                        break;
                }
            } catch (err) {
                this.log.error(`Error processing bridge message [${type}]:`, err);
            }
        });

        // Notify parent that we are ready
        this.log.info('Handshake: Sending EDITOR_CLIENT_READY to parent');
        window.parent.postMessage({ type: 'EDITOR_CLIENT_READY' }, '*');
        
        // Add styling indicator for CSS hover highlights inside Editor
        document.body.classList.add('in-iframe-editor');

        // Listen for field element clicks and notify Editor
        window.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            
            // Prioritize form fields
            const fieldWrapper = target.closest('[data-field-name]');
            if (fieldWrapper) {
                const fieldName = fieldWrapper.getAttribute('data-field-name');
                if (fieldName) {
                    const rect = fieldWrapper.getBoundingClientRect();
                    const clickX = event.clientX - rect.left;
                    const clickY = event.clientY - rect.top;
                    
                    // Check if click was in the top-right corner (on the pencil icon)
                    const isPencilClick = (clickX > rect.width - 40 && clickY < 40);
                    
                    if (isPencilClick) {
                        event.stopPropagation();
                        event.preventDefault();
                        this.log.debug(`Pencil clicked on field: "${fieldName}". Notifying Editor.`);
                        window.parent.postMessage({
                            type: 'SELECT_FIELD_IN_EDITOR',
                            payload: { fieldName }
                        }, '*');
                        return; // Exit early to prevent parent handler click triggers
                    }
                }
            }

            // General inspector targets
            const inspectTarget = target.closest('[data-inspect-target]');
            if (inspectTarget) {
                const targetPanel = inspectTarget.getAttribute('data-inspect-target');
                const viewId = inspectTarget.getAttribute('data-view-id');
                const optionKey = inspectTarget.getAttribute('data-inspect-option');
                const inspectId = inspectTarget.getAttribute('data-inspect-id');
                if (targetPanel) {
                    const rect = inspectTarget.getBoundingClientRect();
                    const clickX = event.clientX - rect.left;
                    const clickY = event.clientY - rect.top;
                    
                    // Check if click was in the top-right corner (on the pencil icon)
                    const isPencilClick = (clickX > rect.width - 40 && clickY < 40);
                    
                    if (isPencilClick) {
                        event.stopPropagation();
                        event.preventDefault();
                        this.log.debug(`Pencil clicked on target: "${targetPanel}", viewId: "${viewId}", navId: "${inspectId}", option: "${optionKey}". Notifying Editor.`);
                        window.parent.postMessage({
                            type: 'SELECT_TAB_IN_EDITOR',
                            payload: { 
                                tab: targetPanel, 
                                viewId, 
                                navId: targetPanel === 'navigation' ? inspectId : undefined,
                                optionKey 
                            }
                        }, '*');
                        return; // Exit early to prevent parent handler click triggers
                    }
                }
            }
        }, true);

        this.isInitialized = true;
    }

    private async handleSetToken(payload: any) {
        this.log.info('Syncing authentication token from Editor');
        
        const token = typeof payload === 'string' ? payload : payload.token;
        const roleLabel = (typeof payload === 'object' && payload.roleLabel) ? payload.roleLabel : 'User';

        if (!token) {
            this.log.warn('Received empty token in SET_TOKEN payload');
            return;
        }

        localStorage.setItem('auth_token', token);
        
        try {
            const authStore = useAuthStore();
            authStore.token = token;
            this.log.debug('AuthStore updated with new token');
        } catch (e) {
            this.log.warn('AuthStore not available for token sync (might be too early)', e);
        }

        // Show visual feedback
        if (f7) {
            f7.toast.create({
                text: `Switched to ${roleLabel}`,
                icon: '<i class="f7-icons">person_crop_circle_fill_badge_checkmark</i>',
                position: 'center',
                closeTimeout: 2000,
                cssClass: 'preview-toast-feedback'
            }).open();
        }
    }

    private async handleSchemaOverride(payload: any) {
        const targetId = payload.tableId || payload.formId;
        if (!targetId) {
            this.log.error('Invalid SET_SCHEMA_OVERRIDE: Missing tableId/formId', payload);
            return;
        }

        this.log.info(`Syncing schema override for: ${targetId}`);
        
        const name = payload.name || payload.schema?.name;
        const description = payload.description || payload.schema?.description;
        const targetFields = payload.fields || payload.schema?.fields || (Array.isArray(payload.schema) ? payload.schema : []);
        const settings = payload.settings || payload.schema?.settings || {};
        const layout = payload.layout;

        // 1. Memory Override
        (window as any).__SCHEMA_OVERRIDE = (window as any).__SCHEMA_OVERRIDE || {};
        (window as any).__SCHEMA_OVERRIDE[targetId] = { 
            schema: { name, description, settings, fields: targetFields }, 
            layout 
        };
        
        // 2. Database Persistence
        try {
            const db = await databaseService.getDB();
            
            // Check existing app_id
            const existingRes = await db.query('SELECT app_id FROM tables WHERE id = ?', [targetId]);
            const existingAppId = existingRes.values?.[0]?.app_id;
            
            this.log.debug(`Persisting schema to local DB for table: ${targetId}`, { appId: payload.appId || existingAppId });

            const sql = `
                INSERT OR REPLACE INTO tables (id, app_id, name, description, fields, layout, settings, version, synced_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [
                targetId,
                payload.appId || existingAppId || targetId,
                name || 'Preview Table',
                description || '',
                JSON.stringify(targetFields),
                JSON.stringify(layout),
                JSON.stringify(settings),
                payload.version || 1,
                new Date().toISOString()
            ];
            
            await db.run(sql, values);
            this.log.info('Schema successfully saved to SQLite');

            // 3. Handle App View Configs and Navigation
            if (payload.appId) {
                this.log.debug('Persisting app view configs and navigation', { appId: payload.appId });
                const updates: string[] = [];
                const params: any[] = [];
                
                if (payload.viewConfigs) {
                    updates.push('view_configs = ?');
                    params.push(JSON.stringify(payload.viewConfigs));
                }
                
                if (payload.navigation) {
                    updates.push('navigation = ?');
                    params.push(JSON.stringify(payload.navigation));
                }
                
                if (updates.length > 0) {
                    params.push(payload.appId);
                    await db.run(`UPDATE apps SET ${updates.join(', ')} WHERE id = ?`, params);
                }
                
                (window as any).__SCHEMA_OVERRIDE[`APP_${payload.appId}`] = {
                    viewConfigs: payload.viewConfigs,
                    navigation: payload.navigation,
                    isDirty: payload.isDirty
                };
            }

            // 4. Update Store
            this.notifyStores();

            // 5. Handle Navigation if activeViewId is present
            if (payload.activeViewId) {
                this.log.info(`Syncing active view from Editor: ${payload.activeViewId}`);
                this.handleNavigateTo({ viewId: payload.activeViewId });
            }

            // 6. Custom Event
            window.dispatchEvent(new CustomEvent('schema-override-updated', {
                detail: { tableId: targetId, fields: targetFields, layout, viewConfigs: payload.viewConfigs }
            }));

        } catch (e) {
            this.log.error('Failed to persist preview schema to DB:', e);
            // Fallback: Notify store anyway from memory override
            this.notifyStores();
        }
    }

    private async handleRefreshData() {
        this.log.info('Forcing data refresh from DB');
        await this.notifyStores();
        
        if (f7?.view?.main) {
            f7.view.main.router.refreshPage();
        }
    }

    private async handleNavigateTo(payload: any) {
        const viewId = payload.viewId;
        if (!viewId) return;

        this.log.info(`Remote navigation request to view: ${viewId}`);

        if (f7?.view?.main) {
            const currentRoute = f7.view.main.router.currentRoute;
            const newUrl = `${currentRoute.path}?view=${viewId}`;
            
            // Only navigate if we are not already on that view query
            if (currentRoute.query.view !== viewId) {
                f7.view.main.router.navigate(newUrl, {
                    reloadCurrent: false,
                    animate: false,
                    ignoreCache: true
                });
            }
        }
    }

    private async notifyStores() {
        try {
            const dashboardStore = useDashboardStore();
            await dashboardStore.loadData(true);
            this.log.info('Dashboard store reloaded with new data');
        } catch (e) {
            this.log.warn('Dashboard store not ready for reload', e);
        }
    }
}

export const editorBridge = EditorBridgeService.getInstance();
