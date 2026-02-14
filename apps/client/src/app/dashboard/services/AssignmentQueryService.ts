import { SQLiteDBConnection } from '@capacitor-community/sqlite';

export interface SortConfig {
    field: string;
    order: 'asc' | 'desc';
}

export interface FilterConfig {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'starts_with' | 'ends_with';
    value: any;
}

export const AssignmentQueryService = {
    async getGroupedAssignments(
        db: SQLiteDBConnection,
        field: string, // The field to group by
        whereClause: string,
        params: any[]
    ) {
        // Prioritize keys from Response (User Input) -> Prelist (Static Data)
        // Use latest_response alias to match the subquery pattern
        const responseExpr = `json_extract(latest_response.data, '$.${field}')`;
        const prelistExpr = `json_extract(assignments.prelist_data, '$.${field}')`;
        const groupKeyExpr = `COALESCE(${responseExpr}, ${prelistExpr})`;

        // Use subquery to get only latest response per assignment (prevents duplicates)
        const sql = `
            SELECT 
                ${groupKeyExpr} as group_key, 
                COUNT(*) as count,
                SUM(CASE WHEN assignments.status = 'assigned' THEN 1 ELSE 0 END) as assigned,
                SUM(CASE WHEN assignments.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN assignments.status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM assignments
            LEFT JOIN (
                SELECT assignment_id, data, updated_at
                FROM responses r1
                WHERE r1.updated_at = (
                    SELECT MAX(r2.updated_at) 
                    FROM responses r2 
                    WHERE r2.assignment_id = r1.assignment_id
                )
            ) AS latest_response ON assignments.id = latest_response.assignment_id
            ${whereClause} 
            GROUP BY ${groupKeyExpr} 
            ORDER BY count DESC
        `;
        
        const groupRes = await db.query(sql, params);
        
        return (groupRes.values || []).map(r => ({
            value: r.group_key,
            count: r.count,
            assigned: r.assigned || 0,
            in_progress: r.in_progress || 0,
            completed: r.completed || 0,
            field: field
        }));
    },

    buildFilterWhere(filters: FilterConfig[]) {
        let where = '';
        const params: any[] = [];

        if (filters && filters.length > 0) {
            const filterConditions: string[] = [];
            filters.forEach(f => {
                // Determine field expression
                let fieldExpr: string;
                // Standard fields
                if (['status', 'created_at', 'updated_at', 'synced_at'].includes(f.field)) {
                    fieldExpr = `assignments.${f.field}`;
                } else {
                    // JSON Fields (Check Response first, then Prelist)
                    const resp = `json_extract(latest_response.data, '$.${f.field}')`;
                    const pre = `json_extract(assignments.prelist_data, '$.${f.field}')`;
                    fieldExpr = `COALESCE(${resp}, ${pre})`;
                }

                switch (f.operator) {
                    case 'equals':
                        filterConditions.push(`${fieldExpr} = ?`);
                        params.push(f.value);
                        break;
                    case 'contains':
                        filterConditions.push(`${fieldExpr} LIKE ?`);
                        params.push(`%${f.value}%`);
                        break;
                    case 'starts_with':
                        filterConditions.push(`${fieldExpr} LIKE ?`);
                        params.push(`${f.value}%`);
                        break;
                    case 'ends_with':
                        filterConditions.push(`${fieldExpr} LIKE ?`);
                        params.push(`%${f.value}`);
                        break;
                    case 'greater_than':
                        filterConditions.push(`${fieldExpr} > ?`);
                        params.push(f.value);
                        break;
                    case 'less_than':
                        filterConditions.push(`${fieldExpr} < ?`);
                        params.push(f.value);
                        break;
                }
            });
            
            if (filterConditions.length > 0) {
                 where = `WHERE ${filterConditions.join(' AND ')}`;
            }
        }
        return { where, params };
    },

    // Helper to build order by clause
    buildOrderBy(sortConfig?: SortConfig) {
        if (!sortConfig) {
            return `assignments.updated_at DESC, assignments.id DESC`;
        }
        
        let fieldExpr: string;
        if (['status', 'created_at', 'updated_at', 'synced_at', 'id'].includes(sortConfig.field)) {
             fieldExpr = `assignments.${sortConfig.field}`;
        } else {
             const resp = `json_extract(latest_response.data, '$.${sortConfig.field}')`;
             const pre = `json_extract(assignments.prelist_data, '$.${sortConfig.field}')`;
             fieldExpr = `COALESCE(${resp}, ${pre})`;
        }
        return `${fieldExpr} ${sortConfig.order.toUpperCase()}`;
    },

    async getAssignments(
        db: SQLiteDBConnection,
        whereClause: string,
        params: any[],
        limit = 1000,
        sortConfig?: SortConfig,
        filters?: FilterConfig[]
    ) {
        // --- Dynamic Filter Logic ---
        let dynamicWhere = whereClause;
        let dynamicParams = [...params];

        if (filters && filters.length > 0) {
            const { where: filterWhere, params: filterParams } = this.buildFilterWhere(filters);
            
            if (filterWhere) {
                 // const prefix = dynamicWhere.trim() === '' ? '' : ' AND '; // Unused
                 // If dynamicWhere has WHERE, strip it from filterWhere. If empty, use filterWhere as is.
                 // Actually simpler: construct full clause.
                 
                 if (dynamicWhere.toUpperCase().includes('WHERE')) {
                     dynamicWhere += ` AND ${filterWhere.replace(/^WHERE\s+/i, '')}`;
                 } else {
                     dynamicWhere = filterWhere;
                 }
                 dynamicParams = [...dynamicParams, ...filterParams];
            }
        }

        // --- Dynamic Sort Logic ---
        const orderBy = this.buildOrderBy(sortConfig);

        // Use subquery to get ONLY the latest response per assignment
        // This prevents duplicate rows when an assignment has multiple responses
        const sqlJoin = `
            SELECT assignments.*, 
                   latest_response.data as response_data, 
                   latest_response.created_at as response_created_at, 
                   latest_response.updated_at as response_updated_at
            FROM assignments
            LEFT JOIN (
                SELECT assignment_id, data, created_at, updated_at
                FROM responses r1
                WHERE r1.updated_at = (
                    SELECT MAX(r2.updated_at) 
                    FROM responses r2 
                    WHERE r2.assignment_id = r1.assignment_id
                )
            ) AS latest_response ON assignments.id = latest_response.assignment_id
            ${dynamicWhere}
            ORDER BY ${orderBy} LIMIT ${limit}
        `;
        
        console.log('[AssignmentQueryService] getAssignments SQL:', { sqlJoin, dynamicParams, limit });
        
        const assignRes = await db.query(sqlJoin, dynamicParams);
        
        console.log('[AssignmentQueryService] getAssignments result:', { 
            count: assignRes.values?.length || 0,
            firstRow: assignRes.values?.[0] || null
        });
        
        if (assignRes.values) {
            return assignRes.values.map(a => ({
                ...a,
                prelist_data: typeof a.prelist_data === 'string' ? JSON.parse(a.prelist_data || '{}') : a.prelist_data,
                response_data: typeof a.response_data === 'string' ? JSON.parse(a.response_data || '{}') : a.response_data,
                // fix null timestamps by using the joined response timestamps
                created_at: a.response_created_at || a.created_at,
                updated_at: a.response_updated_at || a.updated_at
            }));

        }
        return [];
    },

    async getTotalAssignments(db: SQLiteDBConnection, tableId: string) {
        const countRes = await db.query(`SELECT COUNT(*) as total FROM assignments WHERE table_id = ?`, [tableId]);
        return countRes.values?.[0]?.total || 0;
    },

    async getStatusCounts(
        db: SQLiteDBConnection,
        whereClause: string,
        params: any[]
    ) {
        // Use subquery to get only latest response per assignment (to match whereClause using latest_response.data)
        const sql = `
            SELECT 
                COUNT(*) as all_count,
                SUM(CASE WHEN assignments.status = 'assigned' THEN 1 ELSE 0 END) as assigned,
                SUM(CASE WHEN assignments.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN assignments.status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM assignments
            LEFT JOIN (
                SELECT assignment_id, data, updated_at
                FROM responses r1
                WHERE r1.updated_at = (
                    SELECT MAX(r2.updated_at) 
                    FROM responses r2 
                    WHERE r2.assignment_id = r1.assignment_id
                )
            ) AS latest_response ON assignments.id = latest_response.assignment_id
            ${whereClause}
        `;
        const res = await db.query(sql, params);
        const row = res.values?.[0] || {};
        return {
            all: row.all_count || 0,
            assigned: row.assigned || 0,
            in_progress: row.in_progress || 0,
            completed: row.completed || 0
        };
    }
};
