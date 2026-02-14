import { useDatabase } from '@/common/composables/useDatabase';
import type { Ref } from 'vue';
import { ref } from 'vue';
import { DashboardRepository } from '../../repositories/DashboardRepository';
import { AssignmentQueryService } from '../../services/AssignmentQueryService';
import type { FilterConfig, SortConfig } from '../../types';

interface QueryClause { where: string; params: (string | number)[]; }

/** Append advanced filter conditions to an existing query clause */
function appendFilters(clause: QueryClause, filters: FilterConfig[] | undefined): QueryClause {
    if (!filters || filters.length === 0) return clause;

    const filterSql = AssignmentQueryService.buildFilterWhere(filters);
    if (!filterSql.where) return clause;

    let { where } = clause;
    const { params } = clause;
    if (where) {
        where += ` AND ${filterSql.where.replace(/^WHERE\s+/i, '')}`;
    } else {
        where = filterSql.where;
    }
    return { where, params: [...params, ...filterSql.params] };
}

/** Build the search-specific query clause with table_id, search, filters, and optional status */
function buildSearchClause(
    contextId: string, searchQuery: string, filters: FilterConfig[] | undefined, statusFilter?: string
): QueryClause {
    const q = `%${searchQuery}%`;
    const searchCond = `(COALESCE(assignments.prelist_data, '') LIKE ? OR COALESCE(latest_response.data, '') LIKE ?)`;

    let where = `WHERE table_id = ? AND ${searchCond}`;
    let params: (string | number)[] = [contextId, q, q];

    // Append filters
    const withFilters = appendFilters({ where, params }, filters);
    where = withFilters.where;
    params = withFilters.params;

    // Append status if not 'all'
    if (statusFilter && statusFilter !== 'all') {
        where += ` AND assignments.status = ?`;
        params.push(statusFilter);
    }

    return { where, params };
}

export function useAssignmentQueries(
    contextId: Ref<string> | string,
    state: {
        pendingUploadCount: Ref<number>;
        searchQuery: Ref<string>;
        statusFilter: Ref<string>;
        assignments: Ref<Record<string, unknown>[]>;
        groups: Ref<Record<string, unknown>[]>;
        totalAssignments: Ref<number>;
    },
    grouping: {
        buildGroupWhere: (statusFilterValue: string) => { where: string; params: (string | number)[] };
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
                console.warn('Could not fetch pending uploads', e);
            }

            const filters = filterSort?.filters.value;
            let dataClause = appendFilters(grouping.buildGroupWhere(state.statusFilter.value), filters);
            let countsClause = appendFilters(grouping.buildGroupWhere('all'), filters);

            // Global Search overrides both data and counts clauses
            if (state.searchQuery.value) {
                dataClause = buildSearchClause(getContextId(), state.searchQuery.value, filters, state.statusFilter.value);
                countsClause = buildSearchClause(getContextId(), state.searchQuery.value, filters);
            }

            // Fetch Status Counts
            statusCounts.value = await AssignmentQueryService.getStatusCounts(conn, countsClause.where, countsClause.params);

            // Fetch Data
            if (grouping.isGroupingActive.value) {
                state.assignments.value = [];
                const field = grouping.currentGroupField.value;
                if (field) {
                    state.groups.value = await AssignmentQueryService.getGroupedAssignments(conn, field, dataClause.where, dataClause.params);
                }
            } else {
                state.groups.value = [];
                state.assignments.value = await AssignmentQueryService.getAssignments(
                    conn, 
                    dataClause.where, 
                    dataClause.params, 
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
