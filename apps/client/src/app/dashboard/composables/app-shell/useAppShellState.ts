import { ref } from 'vue';

export function useAppShellState() {
    const loading = ref(true);
    const schemaData = ref<any>(null);
    const layout = ref<any>(null);
    const assignments = ref<any[]>([]);
    const groups = ref<any[]>([]);
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
