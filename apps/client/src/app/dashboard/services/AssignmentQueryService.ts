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

/**
 * Sanitize a field/column name for safe interpolation into SQLite queries and JSON path expressions.
 * Strips any characters that are not alphanumeric or underscore to prevent syntax errors or malformed SQL.
 */
export function sanitizeColumnKey(field: string): string {
    if (!field || typeof field !== 'string') return '';
    return field.replace(/[^a-zA-Z0-9_]/g, '');
}

/**
 * Safely parse JSON values, unwrapping double-stringified JSON if present.
 */
export function safeParseJson(raw: unknown): Record<string, unknown> {
    if (!raw) return {};
    if (typeof raw === 'object' && raw !== null) return raw as Record<string, unknown>;
    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (trimmed === '') return {};
        try {
            let parsed = JSON.parse(trimmed);
            if (typeof parsed === 'string') {
                try {
                    parsed = JSON.parse(parsed);
                } catch {
                    // ignore secondary parse error
                }
            }
            return (typeof parsed === 'object' && parsed !== null) ? parsed : {};
        } catch {
            return {};
        }
    }
    return {};
}

export const AssignmentQueryService = {
    async getGroupedAssignments(
        db: SQLiteDBConnection,
        field: string, // The field to group by
        whereClause: string,
        params: any[]
    ) {
        const safeField = sanitizeColumnKey(field);
        if (!safeField) {
            return [];
        }

        // Prioritize keys from Response (User Input) -> Prelist (Static Data)
        // Use latest_response alias to match the subquery pattern
        const responseExpr = `json_extract(latest_response.data, '$.${safeField}')`;
        const prelistExpr = `json_extract(assignments.prelist_data, '$.${safeField}')`;
        const groupKeyExpr = `COALESCE(${responseExpr}, ${prelistExpr})`;

        // Use subquery to get only latest response per assignment (prevents duplicates)
        const sql = `
            SELECT 
                ${groupKeyExpr} as group_key, 
                COUNT(*) as count,
                SUM(CASE WHEN assignments.status = 'assigned' THEN 1 ELSE 0 END) as assigned,
                SUM(CASE WHEN assignments.status IN ('in_progress', 'rejected') THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN assignments.status IN ('submitted', 'approved', 'synced') THEN 1 ELSE 0 END) as synced
            FROM assignments
            LEFT JOIN (
                SELECT assignment_id, data, MAX(updated_at)
                FROM responses
                GROUP BY assignment_id
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
            field: safeField
        }));
    },

    buildFilterWhere(filters: FilterConfig[]) {
        let where = '';
        const params: any[] = [];

        if (filters && filters.length > 0) {
            const filterConditions: string[] = [];
            filters.forEach(f => {
                const safeField = sanitizeColumnKey(f.field);
                if (!safeField) return;

                // Determine field expression
                let fieldExpr: string;
                // Standard fields
                if (['status', 'created_at', 'updated_at', 'synced_at'].includes(safeField)) {
                    fieldExpr = `assignments.${safeField}`;
                } else {
                    // JSON Fields (Check Response first, then Prelist)
                    const resp = `json_extract(latest_response.data, '$.${safeField}')`;
                    const pre = `json_extract(assignments.prelist_data, '$.${safeField}')`;
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
        if (!sortConfig || !sortConfig.field) {
            return `assignments.updated_at DESC, assignments.id DESC`;
        }
        
        const safeField = sanitizeColumnKey(sortConfig.field);
        if (!safeField) {
            return `assignments.updated_at DESC, assignments.id DESC`;
        }

        let fieldExpr: string;
        if (['status', 'created_at', 'updated_at', 'synced_at', 'id'].includes(safeField)) {
             fieldExpr = `assignments.${safeField}`;
        } else {
             const resp = `json_extract(latest_response.data, '$.${safeField}')`;
             const pre = `json_extract(assignments.prelist_data, '$.${safeField}')`;
             fieldExpr = `COALESCE(${resp}, ${pre})`;
        }
        const order = sortConfig.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        return `${fieldExpr} ${order}`;
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
                SELECT assignment_id, data, created_at, updated_at, MAX(updated_at)
                FROM responses
                GROUP BY assignment_id
            ) AS latest_response ON assignments.id = latest_response.assignment_id
            ${dynamicWhere}
            ORDER BY ${orderBy} LIMIT ${limit}
        `;
        
        const assignRes = await db.query(sqlJoin, dynamicParams);
        
        if (assignRes.values) {
            return assignRes.values.map(a => ({
                ...a,
                prelist_data: safeParseJson(a.prelist_data),
                response_data: safeParseJson(a.response_data),
                // fix null timestamps by using the joined response timestamps
                created_at: a.response_created_at || a.created_at,
                updated_at: a.response_updated_at || a.updated_at
            }));
        }
        return [];
    },

    async getTotalAssignments(db: SQLiteDBConnection, tableId: string) {
        const countRes = await db.query(`SELECT COUNT(*) as total FROM assignments WHERE assignments.table_id = ?`, [tableId]);
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
                SUM(CASE WHEN assignments.status IN ('in_progress', 'rejected') THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN assignments.status IN ('submitted', 'approved', 'synced') THEN 1 ELSE 0 END) as synced
            FROM assignments
            LEFT JOIN (
                SELECT assignment_id, data, MAX(updated_at)
                FROM responses
                GROUP BY assignment_id
            ) AS latest_response ON assignments.id = latest_response.assignment_id
            ${whereClause}
        `;
        const res = await db.query(sql, params);
        const row = res.values?.[0] || {};
        return {
            all: row.all_count || 0,
            assigned: row.assigned || 0,
            in_progress: row.in_progress || 0,
            synced: row.synced || 0
        };

    }
};
