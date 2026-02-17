/**
 * App-Level View Management
 * 
 * Manages views at the App level (stored in apps.view_configs),
 * NOT inside individual table LayoutConfig.
 * Each view has a table_id to reference its data source.
 */

import { ApiClient } from '@/common/api/ApiClient';
import { f7 } from 'framework7-vue';
import { ref } from 'vue';
import { createDefaultView, generateViewId } from '../components/views/utils/viewHelpers';
import type { ViewDefinition } from '../types/editor.types';

export function useAppViewManagement(appId: () => string | null) {
    const appViews = ref<Record<string, ViewDefinition>>({});
    const isViewsDirty = ref(false);
    const selectedViewKey = ref<string>('');

    // ========================================================================
    // API
    // ========================================================================

    async function fetchAppViews() {
        const id = appId();
        if (!id) return;

        // Prevent overwriting unsaved changes
        if (isViewsDirty.value) {
            console.warn('[useAppViewManagement] Skipping fetch: Views are dirty');
            return;
        }

        try {
            const res = await ApiClient.get(`/apps/${id}`);
            const data = res.data.data;
            appViews.value = data.view_configs || {};
            isViewsDirty.value = false;
        } catch (e) {
            console.error('[useAppViewManagement] Failed to fetch views', e);
        }
    }

    async function saveAppViews() {
        const id = appId();
        if (!id) return;

        try {
            await ApiClient.put(`/apps/${id}`, {
                view_configs: appViews.value
            });
            isViewsDirty.value = false;
        } catch (e) {
            console.error('[useAppViewManagement] Failed to save views', e);
            f7.dialog.alert('Failed to save view configurations');
        }
    }

    // ========================================================================
    // CRUD
    // ========================================================================

    function createView(tableId?: string) {
        f7.dialog.prompt('Enter view name', (title) => {
            if (!title) return;
            const id = generateViewId(title);
            const newView = createDefaultView(title);

            if (tableId) {
                newView.table_id = tableId;
            }

            appViews.value[id] = newView;
            selectedViewKey.value = id;
            notifyUpdate();
        });
    }

    function deleteView(key: string) {
        const view = appViews.value[key];
        if (!view) return;

        f7.dialog.confirm(`Delete view "${view.title}"?`, () => {
            delete appViews.value[key];

            const remaining = Object.keys(appViews.value);
            selectedViewKey.value = remaining.length > 0 ? remaining[0] ?? '' : '';
            notifyUpdate();
        });
    }

    function selectView(key: string) {
        selectedViewKey.value = key;
    }

    function updateViewProp(key: string, prop: keyof ViewDefinition, value: unknown) {
        if (!appViews.value[key]) return;
        const view = appViews.value[key];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (view as any)[prop] = value;

        // Initialize config objects when type changes
        if (prop === 'type') {
            if (value === 'deck' && !view.deck) {
                view.deck = { primaryHeaderField: '', secondaryHeaderField: '', imageField: null, imageShape: 'square' };
            }
            if (value === 'map' && !view.map) {
                view.map = { mapbox_style: 'satellite', gps_column: '', label: '' };
                if (view.groupBy === undefined) {
                    view.groupBy = [];
                }
            }
        }

        notifyUpdate();
    }

    function updateDeckConfigProp(viewKey: string, key: string, value: unknown) {
        const view = appViews.value[viewKey];
        if (!view) return;
        if (!view.deck) view.deck = { primaryHeaderField: '', secondaryHeaderField: '', imageField: null, imageShape: 'square' };
        (view.deck as Record<string, unknown>)[key] = value;
        notifyUpdate();
    }

    function updateMapConfigProp(viewKey: string, key: string, value: unknown) {
        const view = appViews.value[viewKey];
        if (!view) return;
        if (!view.map) view.map = { mapbox_style: 'satellite', gps_column: '', label: '' };
        (view.map as Record<string, unknown>)[key] = value;
        notifyUpdate();
    }

    function toggleAction(viewKey: string, actionId: string) {
        const view = appViews.value[viewKey];
        if (!view) return;
        const actions = new Set(view.actions || []);
        if (actions.has(actionId)) actions.delete(actionId);
        else actions.add(actionId);
        view.actions = Array.from(actions);
        notifyUpdate();
    }

    function updateGroupBy(viewKey: string, groupBy: string[]) {
        const view = appViews.value[viewKey];
        if (!view) return;
        view.groupBy = groupBy;
        notifyUpdate();
    }

    const viewsVersion = ref(0);

    function notifyUpdate() {
        appViews.value = { ...appViews.value }; // Keep object identity shift for good measure
        viewsVersion.value++;
        isViewsDirty.value = true;
    }

    return {
        appViews,
        viewsVersion,
        isViewsDirty,
        selectedViewKey,
        fetchAppViews,
        saveAppViews,
        createView,
        deleteView,
        selectView,
        updateViewProp,
        updateDeckConfigProp,
        updateMapConfigProp,
        toggleAction,
        updateGroupBy,
    };
}
