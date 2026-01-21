
import { reactive, toRaw, watch } from 'vue';
import { createDefaultView } from '../components/views/utils/viewHelpers';
import type { LayoutConfig } from '../types/editor.types';

export function useViewConfigSync(
    sourceLayout: () => any, // Getter for state.layout (can be readonly)
    onUpdate: (layout: Partial<LayoutConfig>) => void
) {
    // Local mutable state
    const localLayout = reactive<LayoutConfig>({
        type: 'standard',
        app_name: 'Untitled App',
        groupBy: [],
        views: {},
    });

    // Sync from source to local
    watch(sourceLayout, (newLayout) => {
        if (newLayout) {
            // We use Object.assign to keep the same reactive object reference
            const raw = toRaw(newLayout);
            
            // Basic properties
            localLayout.type = raw.type;
            localLayout.app_name = raw.app_name;
            localLayout.groupBy = [...(raw.groupBy || [])];
            
            // Views - we need to be careful not to break existing view references if possible,
            // but for simplicity in this sync (which usually happens on load or remote update),
            // we can replace properties.
            if (!localLayout.views) localLayout.views = {};
            
            // Update or add views
            if (raw.views) {
                // Remove views that no longer exist
                Object.keys(localLayout.views).forEach(key => {
                    if (!raw.views[key]) delete localLayout.views[key];
                });
                
                // Add/Update views
                Object.keys(raw.views).forEach(key => {
                    localLayout.views[key] = raw.views[key];
                });
            } else {
                 localLayout.views = {};
            }

            // Ensure default view exists
            if (Object.keys(localLayout.views).length === 0) {
                const defaultView = createDefaultView('Assignments');
                localLayout.views['default'] = defaultView;
                // We should probably sync this back immediately if it was missing
                onUpdate({ views: { ...localLayout.views } });
            }
        }
    }, { immediate: true, deep: true });

    // Method to force push local changes to upstreams
    function commitLocalChanges() {
        onUpdate(toRaw(localLayout));
    }

    return {
        localLayout,
        commitLocalChanges
    };
}
