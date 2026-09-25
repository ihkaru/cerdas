export interface OrganizationItem {
    id: string | number;
    name: string;
    code: string;
    creator_id?: string | number;
    creator?: {
        id: string | number;
        name: string;
        email?: string;
    };
    members_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface OrganizationMember {
    id: string | number;
    name: string;
    email: string;
    pivot?: {
        role: string;
    };
}

export interface OrganizationInvitation {
    id: string | number;
    email: string;
    role: string;
}
