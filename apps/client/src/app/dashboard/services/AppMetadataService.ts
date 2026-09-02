import { apiClient } from '@/common/api/ApiClient';
import { useAuthStore } from '@/common/stores/authStore';
import { SQLiteDBConnection } from '@capacitor-community/sqlite';

export const AppMetadataService = {
    async resolveAppId(db: SQLiteDBConnection, id: string, schemaAppId?: string): Promise<string | null> {
         if (schemaAppId && schemaAppId !== 'undefined' && schemaAppId !== 'null') {
             return schemaAppId;
         }
         
         if (!id || id === 'undefined' || id === 'null') {
             return null;
         }

         // 1. Try Local SQLite Resolution
         const localId = await this._resolveLocally(db, id);
         if (localId) return localId;

         // 2. Try Remote API Fallback
         if (navigator.onLine) {
             return await this._resolveRemotely(id);
         }
         
         return null;
    },

    async _resolveLocally(db: SQLiteDBConnection, id: string): Promise<string | null> {
        try {
            // Try as Table ID
            const tRes = await db.query('SELECT app_id FROM tables WHERE id = ?', [id]);
            if (tRes.values && tRes.values.length > 0) return tRes.values[0].app_id;

            // Try as App ID
            const aRes = await db.query('SELECT id FROM apps WHERE id = ?', [id]);
            if (aRes.values && aRes.values.length > 0) return aRes.values[0].id;

            // Try as App Slug
            const sRes = await db.query('SELECT id FROM apps WHERE slug = ?', [id]);
            if (sRes.values && sRes.values.length > 0) return sRes.values[0].id;
        } catch (e) {
            console.warn('[AppMetadata] Local resolution failed', e);
        }
        return null;
    },

    async _resolveRemotely(id: string): Promise<string | null> {
        // 1. Try as Table ID
        try {
            const apiRes = await apiClient.get(`/tables/${id}`);
            if (apiRes.success && apiRes.data?.app_id) {
                return apiRes.data.app_id;
            }
        } catch (e) {
            console.debug('[AppMetadata] Remote table resolution fallback failed (might be an App ID)', e);
        }

        // 2. Try as App ID directly
        try {
            const apiRes = await apiClient.get(`/apps/${id}`);
            if (apiRes.success && apiRes.data?.id) {
                return String(apiRes.data.id);
            }
        } catch (e) {
            console.warn('[AppMetadata] Remote app resolution fallback failed', e);
        }

        return null;
    },

    async getLocalAppMetadata(db: SQLiteDBConnection, appId: string) {
        const localApp = await db.query('SELECT * FROM apps WHERE id = ?', [appId]);
        let navigation = [];
        let viewConfigs: Record<string, unknown> = {};
        
        if (localApp.values && localApp.values.length > 0) {
            const row = localApp.values[0];
            navigation = row.navigation ? JSON.parse(row.navigation) : [];
            viewConfigs = row.view_configs ? JSON.parse(row.view_configs) : {};
        }
        return { navigation, viewConfigs, version: localApp.values?.[0]?.version || 'Draft' };
    },
    
    async getSiblingTables(db: SQLiteDBConnection, appId: string) {
         // Renamed from getSiblingForms
         const tablesRes = await db.query(`SELECT * FROM tables WHERE app_id = ? ORDER BY name ASC`, [appId]);
         return (tablesRes.values || []).map(t => ({
             ...t,
             icon: t.icon || (typeof t.settings === 'string' ? JSON.parse(t.settings).icon : t.settings?.icon) || 'doc_text_search'
         }));
    },

    async syncAppMetadata(db: SQLiteDBConnection, appId: string) {
        if (!navigator.onLine) return null;
        
        try {
            // 1. Get App Details
            const appApiRes = await apiClient.get(`/apps/${appId}`);
            let appData = null;
            if (appApiRes.success && appApiRes.data) {
                const d = appApiRes.data;
                appData = {
                    navigation: d.navigation || [],
                    viewConfigs: d.view_configs || {},
                    version: d.version || 'Draft'
                };
                
                extractUserRole(d.memberships, appId);
                
                // Update Local DB
                await db.run(
                    `INSERT OR REPLACE INTO apps (id, slug, name, description, navigation, view_configs, version, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [d.id, d.slug, d.name, d.description, JSON.stringify(d.navigation || []), JSON.stringify(d.view_configs || {}), d.version, new Date().toISOString()]
                );
            }

            // 2. Get Tables List (Renamed from Forms)
            const tablesApiRes = await apiClient.get(`/tables?app_id=${appId}`);
            let tables: any[] = [];
            if (tablesApiRes.success && tablesApiRes.data) {
                await cacheSiblingTables(db, tablesApiRes.data, appId);

                tables = tablesApiRes.data.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    description: t.description,
                    icon: t.settings?.icon || 'doc_text_search'
                }));
            }
            
            return { appData, tables };
        } catch (e) {
            console.warn('Failed to fetch remote app metadata', e);
            throw e;
        }
    }
};

function extractUserRole(memberships: any[] | undefined, appId: string) {
    try {
        const authStore = useAuthStore();
        if (authStore.user && memberships) {
            const membership = memberships.find((m: any) => m.user_id === authStore.user?.id);
            if (membership) {
                localStorage.setItem(`app_role_${appId}`, membership.role);
            }
        }
    } catch (e) {
        console.warn('Role extract error', e);
    }
}

async function cacheSiblingTables(db: SQLiteDBConnection, tables: any[], appId: string) {
    for (const t of tables) {
        const ver = t.latest_published_version || t.latestPublishedVersion || {};
        try {
            await db.run(
                `INSERT OR REPLACE INTO tables (id, app_id, name, description, fields, layout, settings, version, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    t.id,
                    t.app_id || appId,
                    t.name,
                    t.description || '',
                    JSON.stringify(ver.fields || []),
                    JSON.stringify(ver.layout || {}),
                    JSON.stringify(t.settings || {}),
                    ver.version || 1,
                    new Date().toISOString()
                ]
            );
        } catch (err) {
            console.warn('[AppMetadata] Failed to cache sibling table in SQLite:', t.id, err);
        }
    }
}
