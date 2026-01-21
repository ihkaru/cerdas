import type { Ref } from 'vue';
import { computed } from 'vue';

export function useSearchAndFilter(
    searchQuery: Ref<string>,
    statusFilter: Ref<string>,
    assignments: Ref<any[]>,
    groups: Ref<any[]>
) {
    const filteredAssignments = computed(() => {
        let res = assignments.value || [];
        
        // Search is now handled SERVER-SIDE (DB) in refreshData
        // But we keep client-side Status filter just in case
        if (statusFilter.value && statusFilter.value !== 'all') {
            res = res.filter(a => a.status === statusFilter.value);
        }
        
        return res;
    });

    // Computed Groups Filtering
    const filteredGroups = computed(() => {
        // Search effectively disables groups, so this is moot, but safe to keep
        if (!searchQuery.value) return groups.value;
        const q = searchQuery.value.toLowerCase();
        return groups.value.filter(g => 
            String(g.value).toLowerCase().includes(q)
        );
    });

    return {
        filteredAssignments,
        filteredGroups
    };
}
