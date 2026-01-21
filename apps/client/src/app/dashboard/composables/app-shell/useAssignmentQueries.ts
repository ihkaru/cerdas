import { useDatabase } from '@/common/composables/useDatabase';
import { useLogger } from '@/common/utils/logger';
import type { Ref } from 'vue';
import { ref } from 'vue';
import { DashboardRepository } from '../../repositories/DashboardRepository';
import { AssignmentQueryService } from '../../services/AssignmentQueryService';

export function useAssignmentQueries(
    formId: string,
    state: {
        pendingUploadCount: Ref<number>;
        searchQuery: Ref<string>;
        statusFilter: Ref<string>;
        assignments: Ref<any[]>;
        groups: Ref<any[]>;
        totalAssignments: Ref<number>;
    },
    grouping: {
        buildGroupWhere: (statusFilterValue: string) => { where: string; params: any[] };
        isGroupingActive: Ref<boolean>;
        currentGroupField: Ref<string | null>;
        groupPath: Ref<string[]>;
    }
) {
    const log = useLogger('UseAssignmentQueries');
    const db = useDatabase();
    
    const statusCounts = ref({ assigned: 0, in_progress: 0, completed: 0, all: 0 });

    const refreshData = async () => {
        try {
            const conn = await db.getDB();
            
            // Fetch Pending Uploads
            try {
                // @ts-ignore
                state.pendingUploadCount.value = await DashboardRepository.getPendingUploadCount(conn);
            } catch (e) {
                // Ignore if table not ready or logic error
                console.warn('Could not fetch pending uploads', e);
            }

            let { where, params } = grouping.buildGroupWhere(state.statusFilter.value);

            // 1. Separate WHERE for counts (Must exclude status filter to show other category counts)
            let countsWhere = where;
            let countsParams = params;

            // Override WHERE if searching (Global Search)
            if (state.searchQuery.value) {
                const q = `%${state.searchQuery.value}%`;
                // Global Search Mode within the form
                const baseConditions = [`form_id = ?`];
                const baseParams = [formId];

                // Search targeting merged data
                const searchCond = `json_patch(COALESCE(assignments.prelist_data, '{}'), COALESCE(responses.data, '{}')) LIKE ?`;
                
                // For Counts: form_id + search
                countsWhere = `WHERE ${baseConditions.join(' AND ')} AND ${searchCond}`;
                countsParams = [...baseParams, q];

                // For Data: form_id + search + status
                const dataConditions = [...baseConditions, searchCond];
                const dataParams = [...baseParams, q];

                if (state.statusFilter.value && state.statusFilter.value !== 'all') {
                    dataConditions.push(`assignments.status = ?`);
                    dataParams.push(state.statusFilter.value);
                }

                where = `WHERE ${dataConditions.join(' AND ')}`;
                params = dataParams;
                
                log.debug('[RefreshData] Global Search Active (Prioritized):', { query: state.searchQuery.value });
            } else {
                // Not searching - Drill-down Mode
                // countsWhere should be buildGroupWhere WITHOUT the status filter part.
                const groupWhereNoStatus = grouping.buildGroupWhere('all');
                countsWhere = groupWhereNoStatus.where;
                countsParams = groupWhereNoStatus.params;
            }

            // Fetch Status Counts for current context (drill-down or search)
            statusCounts.value = await AssignmentQueryService.getStatusCounts(conn, countsWhere, countsParams);
            
            // If Searching, isGroupingActive is FALSE (managed by grouping logic)
            if (grouping.isGroupingActive.value) {
                state.assignments.value = [];
                const field = grouping.currentGroupField.value;
                if (field) {
                    log.debug('[RefreshData] Grouping Active', { field, path: grouping.groupPath.value });
                    state.groups.value = await AssignmentQueryService.getGroupedAssignments(conn, field, where, params);
                    log.debug('[RefreshData] Groups loaded:', state.groups.value.length);
                }
            } else {
                state.groups.value = [];
                state.assignments.value = await AssignmentQueryService.getAssignments(conn, where, params);
                log.debug('[RefreshData] Assignments loaded:', state.assignments.value.length);
            }
            state.totalAssignments.value = await AssignmentQueryService.getTotalAssignments(conn, formId);
        } catch (e) {
            console.error('Failed to refresh data', e);
        }
    };

    return {
        refreshData,
        statusCounts
    };
}
