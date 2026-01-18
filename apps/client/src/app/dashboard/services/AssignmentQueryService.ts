import { SQLiteDBConnection } from '@capacitor-community/sqlite';

export const AssignmentQueryService = {
    async getGroupedAssignments(
        db: SQLiteDBConnection,
        field: string, // The field to group by
        whereClause: string,
        params: any[]
    ) {
        // Prioritize keys from Response (User Input) -> Prelist (Static Data)
        const responseExpr = `json_extract(responses.data, '$.${field}')`;
        const prelistExpr = `json_extract(assignments.prelist_data, '$.${field}')`;
        const groupKeyExpr = `COALESCE(${responseExpr}, ${prelistExpr})`;

        const sql = `
            SELECT 
                ${groupKeyExpr} as group_key, 
                COUNT(*) as count,
                SUM(CASE WHEN assignments.status = 'assigned' THEN 1 ELSE 0 END) as assigned,
                SUM(CASE WHEN assignments.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN assignments.status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM assignments
            LEFT JOIN responses ON assignments.id = responses.assignment_id
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

    async getAssignments(
        db: SQLiteDBConnection,
        whereClause: string,
        params: any[],
        limit = 1000
    ) {
        // Alias assignments as 'a' context implicitly handled by standard columns
        // BUT 'whereClause' comes without alias prefixes usually. 
        // Simple Left Join works if column names distinctive or handled carefully.
        // Safer to just join without alias prefix issues if whereclause is clean.
        
        // Better Strategy: Just use standard JOIN syntx without heavy alias rewrites if the where clause is compatible.
        // Most filters are on 'form_id' or 'prelist_data' which are on assignments. 'status' is also on assignments.
        // 'responses' has 'assignment_id', 'local_id', 'data'.
        


        const sqlJoin = `
            SELECT assignments.*, responses.data as response_data, responses.created_at as response_created_at, responses.updated_at as response_updated_at
            FROM assignments
            LEFT JOIN responses ON assignments.id = responses.assignment_id
            ${whereClause}
            ORDER BY assignments.id DESC LIMIT ${limit}
        `;
        


        const assignRes = await db.query(sqlJoin, params);
        
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

    async getTotalAssignments(db: SQLiteDBConnection, formId: string) {
        const countRes = await db.query(`SELECT COUNT(*) as total FROM assignments WHERE form_id = ?`, [formId]);
        return countRes.values?.[0]?.total || 0;
    },

    async getStatusCounts(
        db: SQLiteDBConnection,
        whereClause: string,
        params: any[]
    ) {
        const sql = `
            SELECT 
                COUNT(*) as all_count,
                SUM(CASE WHEN assignments.status = 'assigned' THEN 1 ELSE 0 END) as assigned,
                SUM(CASE WHEN assignments.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN assignments.status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM assignments
            LEFT JOIN responses ON assignments.id = responses.assignment_id
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
