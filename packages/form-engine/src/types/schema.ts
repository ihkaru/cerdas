import type { FieldType } from '@cerdas/types';

// Flattened to match DB Schema
export interface FieldDefinition {
    id?: string;
    name: string;
    label: string;
    type: FieldType; // Centralized SSOT
    
    // Standard Config
    placeholder?: string;
    required?: boolean;
    min?: number;
    max?: number;
    options?: { label: string; value: any }[]; // For select/radio
    rows?: number; // For textarea
    description?: string;     // Legacy helper text
    hint?: string;            // Primary helper text (synchronized with Editor)
    
    // HTML Block
    content?: string; // HTML content to render
    blockStyle?: 'default' | 'info' | 'warning' | 'success' | 'danger' | 'note';

    // AppSheet-like Logic (Legacy Expressions)
    formula?: string;         
    initialValue?: any;       
    show_if?: string | boolean; 
    editable_if?: string | boolean; 
    required_if?: string | boolean; 

    // True Closures (JS Function Body Strings)
    // Signature: (ctx, row, utils) => any
    show_if_fn?: string;
    editable_if_fn?: string;
    required_if_fn?: string;
    formula_fn?: string;      
    initial_value_fn?: string;
    options_fn?: string;      
    
    // Metadata/Flags
    isKey?: boolean;          
    isLabel?: boolean;        
    searchable?: boolean;
    scannable?: boolean;      
    nfc?: boolean;
    pii?: boolean;            

    // Runtime Flags (Computed)
    readonly?: boolean;
    
    // Field-specific configuration (used by ImageField, etc.)
    config?: Record<string, any>;
    
    // Nested
    fields?: FieldDefinition[];

    // Legacy/Compat
    validation_js?: string;
    show_if_js?: string;
    
    // Warnings (custom warning messages)
    warning_fn?: string;   // Closure: (ctx, row, utils) => string | null
    warning_js?: string;   // Legacy JS expression

    // GPS Field mitigations
    allow_manual_input?: boolean;
    allow_manual?: boolean;
}

export interface TableSchema {
    id: string;
    fields: FieldDefinition[];
}

/** @deprecated Use TableSchema instead */
export type AppSchema = TableSchema;
