
import { f7 } from 'framework7-vue';
import { computed, ref } from 'vue';
import { createDefaultView, generateViewId } from '../components/views/utils/viewHelpers';
import type { LayoutConfig, ViewDefinition } from '../types/editor.types';

export function useViewManagement(
    layout: LayoutConfig,
    commitChanges: () => void
) {
    const selectedViewKey = ref<string>('');

    const selectedView = computed(() => {
        if (!selectedViewKey.value || !layout.views) return null;
        return layout.views[selectedViewKey.value];
    });

    function selectView(key: string) {
        selectedViewKey.value = key;
    }

    function createView() {
        f7.dialog.prompt('Enter view name (ID will be generated)', (title) => {
            if (!title) return;
            const id = generateViewId(title);
            const newView = createDefaultView(title);
            
            layout.views[id] = newView;
            selectView(id);
            commitChanges();
        });
    }

    function deleteView(key: string) {
        const view = layout.views[key];
        if (!view) return;

        f7.dialog.confirm(`Delete view "${view.title}"?`, () => {
            delete layout.views[key];
            
            // Select next available
            const remaining = Object.keys(layout.views);
            if (remaining.length > 0) {
                selectedViewKey.value = remaining[0] as string;
            } else {
                selectedViewKey.value = '';
            }
            
            commitChanges();
        });
    }

    function updateViewProp(key: string, prop: keyof ViewDefinition, value: any) {
        if (!layout.views[key]) return;
        (layout.views[key] as any)[prop] = value;
        commitChanges();
    }

   function updateDeckConfigProp(viewKey: string, key: string, value: any) {
        console.log('[DEBUG] useViewManagement.updateDeckConfigProp called', { viewKey, key, value });
        const view = layout.views[viewKey];
        if (!view) {
            console.warn('[DEBUG] View not found for key:', viewKey);
            return;
        }
        if (!view.deck) view.deck = { primaryHeaderField: '', secondaryHeaderField: '', imageField: null, imageShape: 'square' };
        (view.deck as any)[key] = value;
        console.log('[DEBUG] Updated view.deck:', JSON.stringify(view.deck));
        console.log('[DEBUG] Calling commitChanges...');
        commitChanges();
    }

    function updateMapConfigProp(viewKey: string, key: string, value: any) {
        const view = layout.views[viewKey];
        if (!view) return;
        if (!view.map) view.map = { mapbox_style: 'satellite', lat: '', long: '', label: '' };
        (view.map as any)[key] = value;
        commitChanges();
    }
    
    function toggleAction(viewKey: string, actionId: string) {
        const view = layout.views[viewKey];
        if (!view) return;
        const actions = new Set(view.actions || []);
        if (actions.has(actionId)) actions.delete(actionId);
        else actions.add(actionId);
        view.actions = Array.from(actions);
        commitChanges();
    }

    function updateGroupBy(viewKey: string, groupBy: string[]) {
        const view = layout.views[viewKey];
        if (!view) return;
        view.groupBy = groupBy;
        commitChanges();
    }

    return {
        selectedViewKey,
        selectedView,
        selectView,
        createView,
        deleteView,
        updateViewProp,
        updateDeckConfigProp,
        updateMapConfigProp,
        toggleAction,
        updateGroupBy
    };
}
