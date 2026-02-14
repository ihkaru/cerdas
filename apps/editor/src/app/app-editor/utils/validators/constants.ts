import type { FieldType, TableSourceType } from '../../types/editor.types';

export const VALID_FIELD_TYPES: FieldType[] = [
    'text', 'number', 'date', 'select', 'radio', 'checkbox',
    'gps', 'image', 'signature', 'html_block', 'nested_form'
];

export const OPTION_REQUIRED_TYPES: FieldType[] = ['select', 'radio', 'checkbox'];

export const VALID_LAYOUT_TYPES = ['standard', 'custom'] as const;
export const VALID_VIEW_TYPES = ['deck', 'table', 'map', 'calendar'] as const;
export const VALID_SOURCE_TYPES: TableSourceType[] = ['internal', 'google_sheets', 'airtable', 'api'];
export const VALID_APP_MODES = ['simple', 'complex'] as const;
