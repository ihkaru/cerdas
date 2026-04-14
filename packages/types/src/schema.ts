/**
 * Dynamic Form Schema Types
 */

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'time'
  | 'datetime'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'image'
  | 'gps'
  | 'signature'
  | 'nested'
  | 'nested_form' // Unified alias
  | 'lookup'
  | 'separator'
  | 'html_block';

export interface FieldConfig {
  // Text fields
  maxLength?: number;
  placeholder?: string;
  pattern?: string;
  
  // Number fields
  min?: number;
  max?: number;
  step?: number;
  decimal?: number;
  
  // Date fields
  minDate?: string;
  maxDate?: string;
  format?: string;
  
  // Select/Radio/Checkbox fields
  options?: FieldOption[];
  multiple?: boolean;
  allowOther?: boolean;
  layout?: 'horizontal' | 'vertical';
  
  // Image fields
  maxSize?: number;
  compression?: number;
  source?: 'camera' | 'gallery' | 'both';
  
  // GPS fields
  accuracy?: number;
  autoCapture?: boolean;
  
  // Signature fields
  canvasWidth?: number;
  canvasHeight?: number;
  
  // Nested fields
  childSchemaId?: number;
  minRows?: number;
  maxRows?: number;
  
  // Lookup fields
  sourceTable?: string;
  displayColumn?: string;
  valueColumn?: string;
  filterJs?: string;

  // HTML Block & Separator
  content?: string;
  blockStyle?: 'default' | 'info' | 'warning' | 'success' | 'danger' | 'note';
}

export interface FieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface Field {
  id: string;
  schemaVersionId: string;
  name: string;
  label: string;
  type: FieldType;
  config: FieldConfig;
  validationJs: string | null;
  showIfJs: string | null;
  editableIfJs: string | null;
  requireIfJs: string | null;
  initialValueJs: string | null;
  order: number;
  parentFieldId: string | null;
}

export interface AppSchemaVersion {
  id: string;
  appSchemaId: string;
  version: number;
  schema: Field[];
  changelog: string | null;
  createdAt: string;
  publishedAt: string | null;
}

export interface AppSchema {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  currentVersion: number;
  publishedAt: string | null;
  settings: SchemaSettings;
  createdAt: string;
  updatedAt: string;
}

export interface SchemaSettings {
  theme?: 'ios' | 'md';
  allowOffline?: boolean;
  requireGps?: boolean;
  [key: string]: unknown;
}
