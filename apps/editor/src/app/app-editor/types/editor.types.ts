/**
 * Schema Editor Types
 */

import type { FieldDefinition } from '@cerdas/form-engine';

// ============================================================================
// App-Level Schema Types (for Code Editor)
// ============================================================================

/** Source types for Table data */
export type TableSourceType = 'internal' | 'google_sheets' | 'airtable' | 'api';

/** Source configuration for different backends */
export interface TableSourceConfig {
  // Google Sheets
  spreadsheet_id?: string;
  sheet_name?: string;
  sync_mode?: 'one_way' | 'two_way';
  
  // API
  api_url?: string;
  api_method?: 'GET' | 'POST';
  api_headers?: Record<string, string>;
  
  // Generic
  [key: string]: unknown;
}

/** Table definition within App schema */
export interface TableSchema {
  name: string;
  description?: string;
  source_type: TableSourceType;
  source_config: TableSourceConfig;
  fields: FieldDefinition[];
  settings: TableSettings;
}

/** View definition within App schema */
export interface ViewSchema {
  table: string; // Reference to table slug
  name: string;
  type: 'deck' | 'table' | 'map' | 'calendar';
  description?: string;
  config: ViewConfig;
}

/** View configuration (deck, map, etc.) */
export interface ViewConfig {
  groupBy?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: string;
  actions?: string[];
  
  // Deck-specific
  deck?: {
    primaryHeaderField: string;
    secondaryHeaderField?: string;
    imageField?: string;
    imageShape?: 'square' | 'circle';
  };
  
  // Map-specific
  map?: {
    mapbox_style?: string;
    lat: string;
    long: string;
    label: string;
  };
}

/** Navigation item in App */
export interface NavigationItem {
  id: string;
  type: 'view' | 'link';
  view?: string; // Reference to view key (if type=view)
  url?: string;  // External URL (if type=link)
  label: string;
  icon: string;
}

/** App metadata */
export interface AppMetadata {
  name: string;
  slug: string;
  description?: string;
  mode: 'simple' | 'complex';
}

/** Complete App-level schema for Code Editor */
export interface AppSchema {
  app: AppMetadata;
  tables: Record<string, TableSchema>;
  views: Record<string, ViewSchema>;
  navigation: NavigationItem[];
}

// ============================================================================
// Editor State Types
// ============================================================================

export interface TableEditorState { // Renamed from SchemaEditorState
  /** Table ID from backend (null for new table) */
  tableId: string | null; // Renamed from schemaId
  
  /** Table name */
  tableName: string; // Renamed from schemaName

  /** Linked App ID */
  appId: string | null;

  /** Table description */
  description?: string;
  
  /** List of fields in the table */
  fields: EditableFieldDefinition[];
  
  /** Table Settings (icon, actions, etc.) */
  settings: TableSettings; // Renamed from AppSettings

  /** Layout Configuration */
  layout: LayoutConfig;

  /** Original fields for dirty check */
  originalFields: EditableFieldDefinition[];
  
  /** Currently selected field path (e.g., "0" or "2.fields.1") */
  selectedFieldPath: string | null;
  
  /** 
   * Current drill-down path into nested forms
   * e.g., [{ index: 2, name: 'Family Members' }] means we're editing field[2]'s sub-fields
   */
  nestedPath: { index: number; name: string }[];
  
  /** Has unsaved changes */
  isDirty: boolean;
  
  /** Currently saving */
  isSaving: boolean;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error message */
  error: string | null;
}

export interface PreviewState {
  /** Preview device type */
  device: 'phone' | 'tablet';
  
  /** Preview orientation */
  orientation: 'portrait' | 'landscape';
  
  /** Sample data for preview */
  sampleData: Record<string, unknown>;
}

// ============================================================================
// Field Types
// ============================================================================

/** Extended FieldDefinition with editor-specific properties */
export interface EditableFieldDefinition extends FieldDefinition {
  /** Unique editor ID (for drag-drop) */
  _editorId: string;
  
  /** Collapsed state in editor */
  _collapsed?: boolean;

  /** Helper text */
  hint?: string;

  /** Show in preview list */
  preview?: boolean;

  /** Allow searching by this field */
  searchable?: boolean;
}

/** Supported field types in the editor */
export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'gps'
  | 'image'
  | 'signature'
  | 'html_block'
  | 'nested_form';

/** Field type metadata for UI */
export interface FieldTypeMeta {
  type: FieldType;
  label: string;
  icon: string;
  description: string;
  hasOptions: boolean;
  supportsFormula: boolean;
  category: 'basic' | 'choice' | 'media' | 'advanced';
}

// ============================================================================
// UI Types
// ============================================================================

/** Tab in field config panel */
export type ConfigTab = 'basic' | 'options' | 'logic' | 'advanced';

/** Configuration for Table Actions (Header, Row, Swipe) */
export interface ActionDefinition {
  id: string;
  label: string;
  icon: string;
  type: 'create' | 'sync' | 'export' | 'settings' | 'open' | 'delete' | 'duplicate' | 'complete' | string;
  primary?: boolean;
  color?: string; // red, green, blue, etc.
}

/** Table-level Settings stored in TableVersion.layout or separate */
export interface TableSettings { // Renamed from AppSettings
  icon: string;
  public_access?: boolean;
  allow_comments?: boolean;
  actions: {
    header: ActionDefinition[];
    row: ActionDefinition[];
    swipe: {
      left: string[];
      right: string[];
    };
  };
}

/** Config for a specific View (Deck, Table, etc) */
export interface ViewDefinition {
  type: 'deck' | 'table' | 'map' | 'calendar';
  title: string;
  icon?: string;
  slice_filter?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  groupBy: string[];
  deck?: {
    primaryHeaderField: string;
    secondaryHeaderField: string;
    imageField: string | null;
    imageShape: 'square' | 'circle';
  };
  map?: {
    mapbox_style: string;
    gps_column: string;
    label: string;
    marker_style_fn?: string;
  };
  actions: string[];
}

/** Layout Configuration stored in TableVersion.layout */
export interface LayoutConfig {
  type: 'standard' | 'custom';
  app_name: string; // Maybe tableName?
  groupBy: string[];
  views: Record<string, ViewDefinition>;
  settings?: TableSettings; // Store settings here for persistence
}

/** Device frame dimensions */
export interface DeviceDimensions {
  width: number;
  height: number;
  borderRadius: number;
}

// ============================================================================
// Constants
// ============================================================================

export const FIELD_TYPE_META: Record<FieldType, FieldTypeMeta> = {
  text: {
    type: 'text',
    label: 'Text',
    icon: 'textformat',
    description: 'Single line text input',
    hasOptions: false,
    supportsFormula: true,
    category: 'basic',
  },
  number: {
    type: 'number',
    label: 'Number',
    icon: 'number',
    description: 'Numeric input',
    hasOptions: false,
    supportsFormula: true,
    category: 'basic',
  },
  date: {
    type: 'date',
    label: 'Date',
    icon: 'calendar',
    description: 'Date picker',
    hasOptions: false,
    supportsFormula: true,
    category: 'basic',
  },
  select: {
    type: 'select',
    label: 'Dropdown',
    icon: 'chevron_down_circle',
    description: 'Single select dropdown',
    hasOptions: true,
    supportsFormula: false,
    category: 'choice',
  },
  radio: {
    type: 'radio',
    label: 'Radio',
    icon: 'circle_grid_3x3',
    description: 'Radio button group',
    hasOptions: true,
    supportsFormula: false,
    category: 'choice',
  },
  checkbox: {
    type: 'checkbox',
    label: 'Checkbox',
    icon: 'checkmark_square',
    description: 'Multiple select checkboxes',
    hasOptions: true,
    supportsFormula: false,
    category: 'choice',
  },
  gps: {
    type: 'gps',
    label: 'GPS Location',
    icon: 'location',
    description: 'Capture GPS coordinates',
    hasOptions: false,
    supportsFormula: false,
    category: 'media',
  },
  image: {
    type: 'image',
    label: 'Image',
    icon: 'camera',
    description: 'Capture or upload image',
    hasOptions: false,
    supportsFormula: false,
    category: 'media',
  },
  signature: {
    type: 'signature',
    label: 'Signature',
    icon: 'signature',
    description: 'Signature capture pad',
    hasOptions: false,
    supportsFormula: false,
    category: 'media',
  },
  html_block: {
    type: 'html_block',
    label: 'HTML Block',
    icon: 'doc_richtext',
    description: 'Static HTML content',
    hasOptions: false,
    supportsFormula: false,
    category: 'advanced',
  },
  nested_form: {
    type: 'nested_form',
    label: 'Nested Form',
    icon: 'square_stack_3d_down_right',
    description: 'Repeatable sub-form',
    hasOptions: false,
    supportsFormula: false,
    category: 'advanced',
  },
};

export const DEVICE_DIMENSIONS: Record<string, DeviceDimensions> = {
  'phone-portrait': { width: 375, height: 667, borderRadius: 40 },
  'phone-landscape': { width: 667, height: 375, borderRadius: 40 },
  'tablet-portrait': { width: 768, height: 1024, borderRadius: 20 },
  'tablet-landscape': { width: 1024, height: 768, borderRadius: 20 },
};
