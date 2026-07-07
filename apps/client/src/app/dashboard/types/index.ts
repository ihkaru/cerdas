export interface Table {
    id: string;
    app_id?: string;
    name: string;
    description: string | null;
    layout: any;
    fields: any; // Renamed from schema
    settings: {
        icon?: string;
        color?: string;
        actions?: any;
    } | null;
    version: number;
}

export interface App {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    navigation: any; // JSON
    view_configs: any; // JSON
    version: number | string;
    start_date?: string | null;
    end_date?: string | null;
    expired_behavior?: 'read_only' | 'hidden';
    synced_at?: string;
}

/** Per-app assignment stats — computed via SQL join on assignments → tables → app_id */
export interface AppStats {
    app_id: string;
    pending: number;      // status = 'assigned'
    in_progress: number;  // status = 'in_progress'
    completed: number;    // status = 'completed' | 'synced'
    total: number;
}

/** App enriched with live stats and urgency score for smart sorting */
export interface AppWithStats extends App {
    stats: AppStats;
    isCompleted: boolean; // true when completed === total && total > 0
    isScheduled: boolean; // true if now < start_date
    isExpired: boolean;   // true if now > end_date
    isHidden: boolean;    // true if expired and behavior is 'hidden'
    urgency: number;      // sort key: higher = more urgent
}

export interface Assignment {
    id: string;
    table_id: string; // Renamed from form_id
    organization_id?: string;
    supervisor_id?: string;
    enumerator_id?: string; // Added for simple mode logic
    external_id: string | null;
    status: 'assigned' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
    synced_at: string | null;
    created_at?: string;
    prelist_data: {
        name?: string;
        address?: string;
        [key: string]: any;
    } | null;
    response_data?: any; // Joined from responses table
}

export interface SortConfig {
    field: string;
    order: 'asc' | 'desc';
}

export interface FilterConfig {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'starts_with' | 'ends_with';
    value: any;
}
