import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ApiClient } from '../common/api/ApiClient';

export interface FormModel {
    id: number;
    app_id: number;
    name: string;
    description?: string;
    slug: string;
    current_version?: number;
    created_at: string;
    updated_at: string;
    app?: { id: number; name: string };
    versions?: any[];
}

export interface FormVersion {
    id: number;
    form_id: number;
    version: number;
    schema: any;
    layout: any;
    published_at?: string;
    created_at: string;
}

export const useFormStore = defineStore('form', () => {
    const forms = ref<FormModel[]>([]);
    const currentForm = ref<FormModel | null>(null);
    const currentVersion = ref<FormVersion | null>(null);
    
    const loading = ref(false);
    const saving = ref(false);
    const error = ref<string | null>(null);

    // Fetch forms for an app
    async function fetchForms(appId: number) {
        loading.value = true;
        try {
            const res = await ApiClient.get('/forms', { app_id: appId });
            forms.value = res.data.data;
        } catch (e: any) {
            error.value = e.message || 'Failed to fetch forms';
        } finally {
            loading.value = false;
        }
    }

    async function fetchForm(id: number | string) {
        loading.value = true;
        currentForm.value = null;
        try {
            const res = await ApiClient.get(`/forms/${id}`);
            currentForm.value = res.data.data;
        } catch (e: any) {
            error.value = e.message || 'Failed to fetch form';
        } finally {
            loading.value = false;
        }
    }

    async function createForm(appId: number, data: { name: string; description?: string }) {
        loading.value = true;
        try {
            const res = await ApiClient.post('/forms', { ...data, app_id: appId });
            forms.value.push(res.data.data);
            return res.data.data;
        } catch (e: any) {
            error.value = e.message || 'Failed to create form';
            throw e;
        } finally {
            loading.value = false;
        }
    }

    // Fetch specific version (or latest)
    async function fetchVersion(formId: number, version: number) {
        loading.value = true;
        try {
            const res = await ApiClient.get(`/forms/${formId}/versions/${version}`);
            currentVersion.value = res.data.data;
            return res.data.data;
        } catch (e: any) {
             error.value = e.message || 'Failed to fetch version';
        } finally {
            loading.value = false;
        }
    }

    // Create Draft
    async function createDraft(formId: number) {
         loading.value = true;
         try {
             const res = await ApiClient.post(`/forms/${formId}/versions/draft`);
             currentVersion.value = res.data.data;
             return res.data.data;
         } catch(e: any) {
             error.value = e.message || 'Failed to create draft';
             throw e;
         } finally {
             loading.value = false;
         }
    }
    
    // Save Schema
    async function updateVersion(formId: number, version: number, schema: any, layout: any) {
        saving.value = true;
        try {
            const res = await ApiClient.put(`/forms/${formId}/versions/${version}`, {
                schema,
                layout
            });
            // Update local state if needed
            if (currentVersion.value && currentVersion.value.version === version) {
                currentVersion.value.schema = schema;
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

    async function publishVersion(formId: number, version: number) {
        saving.value = true;
        try {
             await ApiClient.post(`/forms/${formId}/versions/${version}/publish`);
             // Refresh form to get update status?
             await fetchForm(formId);
        } catch(e: any) {
             error.value = e.message || 'Failed to publish';
             throw e;
        } finally {
             saving.value = false;
        }
    }

    return {
        forms,
        currentForm,
        currentVersion,
        loading,
        saving,
        error,
        fetchForms,
        fetchForm,
        createForm,
        fetchVersion,
        createDraft,
        updateVersion,
        publishVersion
    };
});
