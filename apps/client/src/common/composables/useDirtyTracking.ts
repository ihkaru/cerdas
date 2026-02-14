import { computed, ref, type Ref } from 'vue';

/**
 * Reusable composable for tracking form dirty state.
 * Compares current data against a deep-cloned snapshot taken at initialization.
 * 
 * Usage:
 *   const { isDirty, takeSnapshot, revert, clearDirty } = useDirtyTracking(formData);
 *   takeSnapshot(formData.value); // After loading initial data
 *   // ... user edits formData ...
 *   if (isDirty.value) { // prompt save }
 */
export function useDirtyTracking(currentData: Ref<Record<string, any>>) {
    const snapshot = ref<string>('{}');

    /**
     * Take a deep snapshot of the current data state.
     * Call this after initial data load or after a successful save.
     */
    const takeSnapshot = (data: Record<string, any>) => {
        snapshot.value = JSON.stringify(data);
    };

    /**
     * Whether the current data differs from the snapshot.
     */
    const isDirty = computed(() => {
        return JSON.stringify(currentData.value) !== snapshot.value;
    });

    /**
     * Revert current data to the snapshot state.
     * Returns the reverted data object.
     */
    const revert = (): Record<string, any> => {
        return JSON.parse(snapshot.value);
    };

    /**
     * Clear dirty state by re-snapshotting the current data.
     * Call after a successful save.
     */
    const clearDirty = () => {
        snapshot.value = JSON.stringify(currentData.value);
    };

    return {
        isDirty,
        takeSnapshot,
        revert,
        clearDirty
    };
}
