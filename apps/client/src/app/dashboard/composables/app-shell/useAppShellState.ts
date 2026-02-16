import { ref, shallowRef } from 'vue';

export function useAppShellState() {
    const loading = ref(true);
    const schemaData = ref<any>(null);
    const layout = ref<any>(null);
    // Use shallowRef for performance with large datasets (30k+ items)
    // We only need reactivity on the array itself, not deep properties
    const assignments = shallowRef<any[]>([]);
    const groups = shallowRef<any[]>([]);
    const totalAssignments = ref(0);
    const pendingUploadCount = ref(0);
    const searchQuery = ref('');
    const statusFilter = ref('all');
    const currentUserRole = ref<string>('Guest');

    return {
        loading,
        schemaData,
        layout,
        assignments,
        groups,
        totalAssignments,
        pendingUploadCount,
        searchQuery,
        statusFilter,
        currentUserRole
    };
}
