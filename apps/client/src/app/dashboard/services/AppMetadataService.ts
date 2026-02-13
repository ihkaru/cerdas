import { apiClient } from '@/common/api/ApiClient';
import { useAuthStore } from '@/common/stores/authStore';
import { SQLiteDBConnection } from '@capacitor-community/sqlite';

export const AppMetadataService = {
    async resolveAppId(db: SQLiteDBConnection, id: string, schemaAppId?: string): Promise<string | null> {
         // id could be AppID or TableID
         console.log('[AppMetadata] resolveAppId called:', { id, schemaAppId });
         
         if (schemaAppId && schemaAppId !== 'undefined' && schemaAppId !== 'null') {
             console.log('[AppMetadata] Using schemaAppId directly:', schemaAppId);
             return schemaAppId;
         }
         
         if (!id || id === 'undefined' || id === 'null') {
             console.log('[AppMetadata] Invalid id, returning null');
             return null;
         }

         try {
             // Try assuming it's a Table ID
             const tRes = await db.query('SELECT id, app_id FROM tables WHERE id = ?', [id]);
             console.log('[AppMetadata] Tables query result:', { 
                 searchId: id, 
                 found: tRes.values?.length ?? 0,
                 rows: tRes.values?.slice(0, 3) 
             });
             
             if (tRes.values && tRes.values.length > 0) {
                 const foundAppId = tRes.values[0].app_id;
                 console.log('[AppMetadata] Found app_id in tables:', { tableId: id, app_id: foundAppId, type: typeof foundAppId });
                 return foundAppId;
             }
             
             // Try assuming it's an App ID
             const aRes = await db.query('SELECT id FROM apps WHERE id = ?', [id]);
             console.log('[AppMetadata] Apps query result:', { 
                 searchId: id, 
                 found: aRes.values?.length ?? 0 
             });
             
             if (aRes.values && aRes.values.length > 0) {
                 return aRes.values[0].id;
             }

             // Try assuming it's an App Slug
             const sRes = await db.query('SELECT id FROM apps WHERE slug = ?', [id]);
             console.log('[AppMetadata] Apps slug query result:', {
                 searchSlug: id,
                 found: sRes.values?.length ?? 0
             });

             if (sRes.values && sRes.values.length > 0) {
                 return sRes.values[0].id;
             }
         } catch (e) {
             console.warn('[AppMetadata] Failed to resolve app_id', e);
         }
         
         console.log('[AppMetadata] Could not resolve, returning null');
         return null;
    },

    async getLocalAppMetadata(db: SQLiteDBConnection, appId: string) {
        const localApp = await db.query('SELECT * FROM apps WHERE id = ?', [appId]);
        let navigation = [];
        let views = [];
        
        if (localApp.values && localApp.values.length > 0) {
            const row = localApp.values[0];
            navigation = row.navigation ? JSON.parse(row.navigation) : [];
            views = row.views ? JSON.parse(row.views) : [];
        }
        return { navigation, views, version: localApp.values?.[0]?.version || 'Draft' };
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
                      views: d.views || [],
                      version: d.version || 'Draft'
                  };
                  
                  // Extract Role
                  try {
                      const authStore = useAuthStore();
                      if (authStore.user && d.memberships) {
                          const membership = d.memberships.find((m: any) => m.user_id === authStore.user?.id);
                          if (membership) {
                               localStorage.setItem(`app_role_${appId}`, membership.role);
                          }
                      }
                  } catch (e) { console.warn('Role extract error', e); }
                  
                  // Update Local DB
                  await db.run(
                      `INSERT OR REPLACE INTO apps (id, slug, name, description, navigation, views, version, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                      [d.id, d.slug, d.name, d.description, JSON.stringify(d.navigation), JSON.stringify(d.views), d.version, new Date().toISOString()]
                  );
              }

              // 2. Get Tables List (Renamed from Forms)
              const tablesApiRes = await apiClient.get(`/tables?app_id=${appId}`);
              let tables = [];
              if (tablesApiRes.success && tablesApiRes.data) {
                  tables = tablesApiRes.data.map((t: any) => ({
                      id: t.id,
                      name: t.name,
                      description: t.description,
                      icon: t.settings?.icon || 'doc_text_search'
                  }));
                  
                  // Need to sync tables content too? Or handled by other syncs?
                  // Currently SyncAppShellSync might handle full sync. 
                  // But here we likely just want basic list for menu?
                  // Actually, we should probably insert into tables table minimally?
                  // The useAppShellSync likely handles detailed sync. 
                  // But wait, if useTableLoader tries to load local table, it needs data.
                  // Only minimal data here for listing.
              }
              
              return { appData, tables };
        } catch (e) {
            console.warn('Failed to fetch remote app metadata', e);
            throw e;
        }
    }
};
