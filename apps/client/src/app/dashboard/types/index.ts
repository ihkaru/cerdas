export interface Form {
    id: string;
    app_id?: string;
    name: string;
    description: string | null;
    layout: any;
    schema: any; // Form Definition
    settings: {
        icon?: string;
        color?: string;
        actions?: any; // Added actions
    } | null;
    version: number;
}

export interface Assignment {
    id: string;
    form_id: string;
    organization_id?: string;
    supervisor_id?: string;
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
