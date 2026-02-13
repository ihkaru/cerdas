
import { reactive, toRaw, watch } from 'vue';
import { createDefaultView } from '../components/views/utils/viewHelpers';
import type { LayoutConfig } from '../types/editor.types';

/**
 * View Config Sync
 * 
 * Maintains a local mutable copy of the layout for the Views panel.
 * Initializes from the source layout, and re-syncs when the source
 * layout reference changes (e.g. when switching tables).
 * Pushes local changes back upstream via commitLocalChanges().
 */
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

    /**
     * Sync from source to local. Called on init and when source layout
     * is replaced entirely (e.g. loadTable). We track the source identity
     * to avoid re-syncing on our own commits.
     */
    let lastSyncedIdentity: string | null = null;

    function syncFromSource() {
        const source = sourceLayout();
        if (!source) return;
        const raw = JSON.parse(JSON.stringify(toRaw(source)));

        localLayout.type = raw.type || 'standard';
        localLayout.app_name = raw.app_name || 'Untitled App';
        localLayout.groupBy = raw.groupBy ? [...raw.groupBy] : [];

        // Replace views entirely
        // Clear old keys
        Object.keys(localLayout.views).forEach(key => {
            delete localLayout.views[key];
        });
        // Add new keys
        if (raw.views) {
            Object.keys(raw.views).forEach(key => {
                localLayout.views[key] = raw.views[key];
            });
        }

        // Ensure default view exists
        if (Object.keys(localLayout.views).length === 0) {
            const defaultView = createDefaultView('Assignments');
            localLayout.views['default'] = defaultView;
            onUpdate({ views: { ...localLayout.views } });
        }

        // Track identity to skip self-triggered watchers
        lastSyncedIdentity = JSON.stringify(raw);
    }

    // Initial sync
    syncFromSource();

    // Watch for source layout being REPLACED (e.g. loadTable switches table).
    // We use a shallow comparison of the serialized layout to detect external changes
    // vs our own commits. Our commits use Object.assign (in-place), so the reference
    // doesn't change — but loadTable does a full replacement.
    watch(sourceLayout, (newLayout) => {
        if (!newLayout) return;
        const raw = JSON.parse(JSON.stringify(toRaw(newLayout)));
        const identity = JSON.stringify(raw);
        // Only re-sync if the source changed from something other than our own commit
        if (identity !== lastSyncedIdentity) {
            syncFromSource();
        }
    }, { deep: false });

    // Method to push local changes to upstream editor state
    function commitLocalChanges() {
        const raw = JSON.parse(JSON.stringify(toRaw(localLayout)));
        // Update identity tracking BEFORE calling onUpdate to avoid re-sync
        lastSyncedIdentity = JSON.stringify(raw);
        onUpdate(raw);
    }

    return {
        localLayout,
        commitLocalChanges
    };
}
