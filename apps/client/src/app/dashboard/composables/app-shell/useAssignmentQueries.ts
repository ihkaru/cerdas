import { useDatabase } from '@/common/composables/useDatabase';
import type { Ref } from 'vue';
import { ref } from 'vue';
import { DashboardRepository } from '../../repositories/DashboardRepository';
import { AssignmentQueryService } from '../../services/AssignmentQueryService';
import type { FilterConfig, SortConfig } from '../../types';

export function useAssignmentQueries(
    contextId: Ref<string> | string,
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
    },
    filterSort?: {
        sort: Ref<SortConfig>;
        filters: Ref<FilterConfig[]>;
    }
) {

    const db = useDatabase();
    
    // Resolve contextId helper
    const getContextId = () => typeof contextId === 'string' ? contextId : contextId.value;
    
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

            // 1. Base Grouping Logic (where + params)
            const groupResult = grouping.buildGroupWhere(state.statusFilter.value);
            // groupResult.where usually starts with "WHERE table_id = ? ..."
            let where = groupResult.where;
            let params = groupResult.params;

            // 2. If Advanced Filters exist, append them
            if (filterSort?.filters.value && filterSort.filters.value.length > 0) {
                 const filterSql = AssignmentQueryService.buildFilterWhere(filterSort.filters.value);
                 if (filterSql.where) {
                     if (where) {
                         // strip WHERE from filterSql and append
                         where += ` AND ${filterSql.where.replace(/^WHERE\s+/i, '')}`;
                     } else {
                         where = filterSql.where;
                     }
                     params = [...params, ...filterSql.params];
                 }
            }

            // 3. Status Counts Logic
            // We need a separate WHERE clause for counts that:
            // - Respects Group Path (if drilling down)
            // - Respects Advanced Filters
            // - Respects Search
            // - BUT IGNORES status (because we want counts per status)
            
            // Re-build base group where WITHOUT status filter
            const baseGroup = grouping.buildGroupWhere('all');
            let countsWhere = baseGroup.where;
            let countsParams = baseGroup.params;

            if (filterSort?.filters.value && filterSort.filters.value.length > 0) {
                 const filterSql = AssignmentQueryService.buildFilterWhere(filterSort.filters.value);
                 if (filterSql.where) {
                     if (countsWhere) {
                         countsWhere += ` AND ${filterSql.where.replace(/^WHERE\s+/i, '')}`;
                     } else {
                         countsWhere = filterSql.where;
                     }
                     countsParams = [...countsParams, ...filterSql.params];
                 }
            }

            // 4. Global Search Logic (Overrides everything if active)
            if (state.searchQuery.value) {
                const q = `%${state.searchQuery.value}%`;
                // FIX: Use latest_response.data, not assignments.response_data which does not exist
                const searchCond = `(COALESCE(assignments.prelist_data, '') LIKE ? OR COALESCE(latest_response.data, '') LIKE ?)`;
                
                // For Counts: Add search to the existing countsWhere
                if (countsWhere) {
                    countsWhere += ` AND ${searchCond}`;
                } else {
                    // This case implies no table_id? 
                    // buildGroupWhere always adds table_id, so countsWhere should be set.
                    // If somehow empty, add WHERE.
                     countsWhere = `WHERE ${searchCond}`;
                }
                countsParams.push(q, q);

                // For Data: The 'where' variable (used for fetching assignments/groups)
                // If searching, we theoretically ignore grouping structure in previous logic, 
                // but let's try to KEEP filters + search if possible?
                // The previous logic completely replaced 'where' with search.
                // Let's stick to the pattern:
                // Search + TableID + Status (if not all)
                
                // However, user wants filters to apply?
                // If I search "Agus", should it also respect "District = X"?
                // Usually global search transcends structure, but "Filters" are explicit.
                // Let's apply filters to search too.
                
                const baseTableId = [`table_id = ?`];
                const baseTableParams = [getContextId()];
                
                let searchWhere = `WHERE ${baseTableId[0]} AND ${searchCond}`;
                let searchParams = [...baseTableParams, q, q];

                // Append Advanced Filters to Search
                if (filterSort?.filters.value && filterSort.filters.value.length > 0) {
                     const filterSql = AssignmentQueryService.buildFilterWhere(filterSort.filters.value);
                     if (filterSql.where) {
                         searchWhere += ` AND ${filterSql.where.replace(/^WHERE\s+/i, '')}`;
                         searchParams = [...searchParams, ...filterSql.params];
                     }
                }

                // Append Status Filter to Search (for Data only)
                if (state.statusFilter.value && state.statusFilter.value !== 'all') {
                    searchWhere += ` AND assignments.status = ?`;
                    searchParams.push(state.statusFilter.value);
                }

                where = searchWhere;
                params = searchParams;
                
                // countsWhere needs to be updated for global search mode too?
                // valid countsWhere for search mode = TableID + Search + Filters (No Status)
                
                let searchCountsWhere = `WHERE ${baseTableId[0]} AND ${searchCond}`;
                let searchCountsParams = [...baseTableParams, q, q];
                 if (filterSort?.filters.value && filterSort.filters.value.length > 0) {
                     const filterSql = AssignmentQueryService.buildFilterWhere(filterSort.filters.value);
                     if (filterSql.where) {
                         searchCountsWhere += ` AND ${filterSql.where.replace(/^WHERE\s+/i, '')}`;
                         searchCountsParams = [...searchCountsParams, ...filterSql.params];
                     }
                }
                
                countsWhere = searchCountsWhere;
                countsParams = searchCountsParams;
            }

            // Fetch Status Counts
            statusCounts.value = await AssignmentQueryService.getStatusCounts(conn, countsWhere, countsParams);

            // Fetch Data
            if (grouping.isGroupingActive.value) {
                state.assignments.value = [];
                const field = grouping.currentGroupField.value;
                if (field) {
                    // Ensure 'where' includes table_id (it does from buildGroupWhere)
                    state.groups.value = await AssignmentQueryService.getGroupedAssignments(conn, field, where, params);
                }
            } else {
                state.groups.value = [];
                // Data Query: 'where' has Status + Filters + Search
                // we pass [] as filters because we already baked them into 'where'
                state.assignments.value = await AssignmentQueryService.getAssignments(
                    conn, 
                    where, 
                    params, 
                    1000, 
                    filterSort?.sort.value, 
                    []
                );
            }
            state.totalAssignments.value = await AssignmentQueryService.getTotalAssignments(conn, getContextId());
        } catch (e) {
            console.error('Failed to refresh data', e);
        }
    };

    return {
        refreshData,
        statusCounts
    };
}
