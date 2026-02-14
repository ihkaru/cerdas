import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ApiClient } from '../common/api/ApiClient';

export interface TableModel {
    id: string;
    app_id: string;
    name: string;
    description?: string;
    slug: string;
    current_version?: number;
    created_at: string;
    updated_at: string;
    app?: { id: string; name: string };
    versions?: any[];
}

export interface TableVersion {
    id: string;
    table_id: string;
    version: number;
    fields: any; // Renamed from schema
    layout: any;
    published_at?: string;
    created_at: string;
}

export const useTableStore = defineStore('table', () => {
    const tables = ref<TableModel[]>([]);
    const currentTable = ref<TableModel | null>(null);
    const currentVersion = ref<TableVersion | null>(null);
    
    const loading = ref(false);
    const saving = ref(false);
    const error = ref<string | null>(null);

    // Fetch tables for an app
    async function fetchTables(appId: number) {
        loading.value = true;
        try {
            const res = await ApiClient.get('/tables', { app_id: appId });
            tables.value = res.data.data;
        } catch (e: any) {
            error.value = e.message || 'Failed to fetch tables';
        } finally {
            loading.value = false;
        }
    }

    async function fetchTable(id: number | string) {
        loading.value = true;
        currentTable.value = null;
        try {
            const res = await ApiClient.get(`/tables/${id}`);
            currentTable.value = res.data.data;
        } catch (e: any) {
            error.value = e.message || 'Failed to fetch table';
        } finally {
            loading.value = false;
        }
    }

    async function createTable(appId: number, data: { name: string; description?: string }) {
        loading.value = true;
        try {
            const res = await ApiClient.post('/tables', { ...data, app_id: appId });
            tables.value.push(res.data.data);
            return res.data.data;
        } catch (e: any) {
            error.value = e.message || 'Failed to create table';
            throw e;
        } finally {
            loading.value = false;
        }
    }

    // Fetch specific version (or latest)
    async function fetchVersion(tableId: string | number, version: number) {
        loading.value = true;
        try {
            const res = await ApiClient.get(`/tables/${tableId}/versions/${version}`);
            currentVersion.value = res.data.data;
            return res.data.data;
        } catch (e: any) {
             error.value = e.message || 'Failed to fetch version';
        } finally {
            loading.value = false;
        }
    }

    // Create Draft
    async function createDraft(tableId: string | number) {
         loading.value = true;
         try {
             const res = await ApiClient.post(`/tables/${tableId}/versions/draft`);
             currentVersion.value = res.data.data;
             return res.data.data;
         } catch(e: any) {
             error.value = e.message || 'Failed to create draft';
             throw e;
         } finally {
             loading.value = false;
         }
    }
    
    // Save Fields (Schema)
    async function updateVersion(tableId: string | number, version: number, fields: any, layout: any) {
        saving.value = true;
        try {
            const res = await ApiClient.put(`/tables/${tableId}/versions/${version}`, {
                fields, // Send fields instead of schema
                layout
            });
            // Update local state if needed
            if (currentVersion.value && currentVersion.value.version === version) {
                currentVersion.value.fields = fields;
                currentVersion.value.layout = layout;
            }
            return res.data;
        } catch(e: any) {
            error.value = e.message || 'Failed to update version';
            throw e;
        } finally {
            saving.value = false;
        }
    }

    async function publishVersion(tableId: string | number, version: number, changelog?: string, versionPolicy?: string) {
        saving.value = true;
        try {
             const payload: Record<string, any> = { changelog };
             if (versionPolicy) payload.version_policy = versionPolicy;
             
             const response = await ApiClient.post(`/tables/${tableId}/versions/${version}/publish`, payload);
             // Refresh table to get update status
             await fetchTable(tableId);
             
             // Update currentVersion with the new draft from backend
             const newDraft = response.data?.new_draft;
             if (newDraft) {
                 currentVersion.value = newDraft;
             }
             
             // Return response so caller can also use it
             return response.data;
        } catch(e: any) {
             error.value = e.message || 'Failed to publish';
             throw e;
        } finally {
             saving.value = false;
        }
    }

    async function deleteTable(tableId: string | number) {
        loading.value = true;
        try {
            await ApiClient.delete(`/tables/${tableId}`);
            tables.value = tables.value.filter(t => t.id !== tableId);
            if (currentTable.value?.id === tableId) {
                currentTable.value = null;
                currentVersion.value = null;
            }
        } catch (e: any) {
            error.value = e.message || 'Failed to delete table';
            throw e;
        } finally {
            loading.value = false;
        }
    }

    return {
        tables,
        currentTable,
        currentVersion,
        loading,
        saving,
        error,
        fetchTables,
        fetchTable,
        createTable,
        deleteTable,
        fetchVersion,
        createDraft,
        updateVersion,
        publishVersion
    };
});
