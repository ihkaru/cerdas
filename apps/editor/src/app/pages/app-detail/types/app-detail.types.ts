export interface AppDetail {
    id: string | number;
    name: string;
    description: string;
    color: string;
}

export interface AppForm {
    id: string | number;
    name: string;
    description: string;
    icon: string;
    status: 'published' | 'draft';
    version: number | string;
    fieldCount: number;
    responseCount: number;
}

export interface AppMember {
    id: string | number;
    name: string;
    initials: string;
    role: string;
    color: string;
}

export interface AppView {
    id: string | number;
    name: string;
    type: 'deck' | 'table' | 'map' | 'form' | 'details' | 'calendar';
    config?: any;
}

export interface AppNavigationItem {
    id: string;
    type: 'view' | 'group' | 'link';
    view_id?: string | number;
    label: string;
    icon: string;
    children?: AppNavigationItem[];
}
