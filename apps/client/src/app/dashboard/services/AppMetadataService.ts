import { apiClient } from '@/common/api/ApiClient';
import { SQLiteDBConnection } from '@capacitor-community/sqlite';

export const AppMetadataService = {
    async resolveAppId(db: SQLiteDBConnection, formId: string, schemaAppId?: string): Promise<string | null> {
         if (schemaAppId) return schemaAppId;
         try {
             const fRes = await db.query('SELECT app_id FROM forms WHERE id = ?', [formId]);
             if (fRes.values && fRes.values.length > 0) {
                 return fRes.values[0].app_id;
             }
         } catch (e) {
             console.warn('Failed to resolve app_id', e);
         }
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
        return { navigation, views };
    },
    
    async getSiblingForms(db: SQLiteDBConnection, appId: string) {
         // Use SELECT * to be resilient to schema versions, and manually extract icon if needed
         const formsRes = await db.query(`SELECT * FROM forms WHERE app_id = ? ORDER BY name ASC`, [appId]);
         return (formsRes.values || []).map(f => ({
             ...f,
             icon: f.icon || (typeof f.settings === 'string' ? JSON.parse(f.settings).icon : f.settings?.icon) || 'doc_text_search'
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
                      views: d.views || []
                  };
                  
                  // Update Local DB
                  await db.run(
                      `INSERT OR REPLACE INTO apps (id, slug, name, description, navigation, views, version, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                      [d.id, d.slug, d.name, d.description, JSON.stringify(d.navigation), JSON.stringify(d.views), d.version, new Date().toISOString()]
                  );
              }

              // 2. Get Forms List
              const formsApiRes = await apiClient.get(`/forms?app_id=${appId}`);
              let forms = [];
              if (formsApiRes.success && formsApiRes.data) {
                  forms = formsApiRes.data.map((f: any) => ({
                      id: f.id,
                      name: f.name,
                      description: f.description,
                      icon: f.settings?.icon || 'doc_text_search'
                  }));
              }
              
              return { appData, forms };
        } catch (e) {
            console.warn('Failed to fetch remote app metadata', e);
            throw e;
        }
    }
};
