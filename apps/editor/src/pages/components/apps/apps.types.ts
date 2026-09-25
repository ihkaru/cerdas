export interface AppItem {
    id: string | number;
    slug?: string;
    name: string;
    description?: string;
    color: string;
    formCount: number;
    memberCount: number;
    tables_count?: number;
    memberships_count?: number;
    updated_at?: string;
}

export interface CreateAppPayload {
    name: string;
    description?: string;
    mode?: string;
    is_evergreen?: boolean;
    start_date?: string | null;
    end_date?: string | null;
    expired_behavior?: string;
}
