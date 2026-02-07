
import type { ActionDefinition, EditableFieldDefinition, ViewDefinition } from './editor.types';

export interface ViewConfigPanelProps {
    view: ViewDefinition;
    fields: EditableFieldDefinition[];
    actions: readonly ActionDefinition[];
}

export interface NavigationItem {
    id: string;
    type: 'view' | 'link';
    label: string;
    icon: string;
    view_id?: string;
    url?: string;
}

export interface NavConfigPanelProps {
    navItem: NavigationItem;
    availableViews: Record<string, ViewDefinition>;
}

export interface DeckConfigProps {
    deckConfig: NonNullable<ViewDefinition['deck']>;
    fields: EditableFieldDefinition[];
}

export interface MapConfigProps {
    mapConfig: NonNullable<ViewDefinition['map']>;
    fields: EditableFieldDefinition[];
}
