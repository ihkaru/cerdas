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
    synced_at?: string;
}

export interface Assignment {
    id: string;
    table_id: string; // Renamed from form_id
    organization_id?: string;
    supervisor_id?: string;
    enumerator_id?: string; // Added for simple mode logic
    external_id: string | null;
    status: 'pending' | 'in_progress' | 'completed' | 'synced';
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
