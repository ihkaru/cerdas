/**
 * JSON Validator for Code Editor Mode
 * 
 * Validates the structure and content of App/Table JSON before applying to visual editor.
 */

import type { FieldType, TableSourceType } from '../types/editor.types';

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
}

export interface ValidationError {
    path: string;      // e.g., "fields[2].type"
    message: string;   // Human-readable error
    severity: 'error' | 'warning';
}

// ============================================================================
// Constants
// ============================================================================

const VALID_FIELD_TYPES: FieldType[] = [
    'text', 'number', 'date', 'select', 'radio', 'checkbox',
    'gps', 'image', 'signature', 'html_block', 'nested_form'
];

const OPTION_REQUIRED_TYPES: FieldType[] = ['select', 'radio', 'checkbox'];

const VALID_LAYOUT_TYPES = ['standard', 'custom'] as const;
const VALID_VIEW_TYPES = ['deck', 'table', 'map', 'calendar'] as const;
const VALID_SOURCE_TYPES: TableSourceType[] = ['internal', 'google_sheets', 'airtable', 'api'];
const VALID_APP_MODES = ['simple', 'complex'] as const;

// ============================================================================
// App-Level Validator (NEW)
// ============================================================================

export function validateAppJson(data: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!data || typeof data !== 'object') {
        errors.push({
            path: '',
            message: 'JSON must be an object',
            severity: 'error'
        });
        return { valid: false, errors, warnings };
    }

    const obj = data as Record<string, unknown>;

    // Validate app metadata
    validateAppMetadata(obj.app, 'app', errors, warnings);

    // Validate tables
    const tableKeys = validateTables(obj.tables, 'tables', errors, warnings);

    // Validate views (with cross-reference to tables)
    const viewKeys = validateViews(obj.views, 'views', tableKeys, errors, warnings);

    // Validate navigation (with cross-reference to views)
    validateNavigation(obj.navigation, 'navigation', viewKeys, errors, warnings);

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

function validateAppMetadata(
    app: unknown,
    basePath: string,
    errors: ValidationError[],
    warnings: ValidationError[]
): void {
    if (!app || typeof app !== 'object') {
        errors.push({
            path: basePath,
            message: '"app" metadata is required',
            severity: 'error'
        });
        return;
    }

    const a = app as Record<string, unknown>;

    if (!a.name || typeof a.name !== 'string' || a.name.trim() === '') {
        errors.push({
            path: `${basePath}.name`,
            message: 'App "name" is required',
            severity: 'error'
        });
    }

    if (!a.slug || typeof a.slug !== 'string' || a.slug.trim() === '') {
        errors.push({
            path: `${basePath}.slug`,
            message: 'App "slug" is required',
            severity: 'error'
        });
    } else if (!/^[a-z0-9-]+$/.test(a.slug as string)) {
        errors.push({
            path: `${basePath}.slug`,
            message: 'App "slug" must be kebab-case (lowercase, numbers, hyphens only)',
            severity: 'error'
        });
    }

    if (a.mode && !VALID_APP_MODES.includes(a.mode as any)) {
        errors.push({
            path: `${basePath}.mode`,
            message: `App "mode" must be one of: ${VALID_APP_MODES.join(', ')}`,
            severity: 'error'
        });
    }
}

function validateTables(
    tables: unknown,
    basePath: string,
    errors: ValidationError[],
    warnings: ValidationError[]
): string[] {
    if (!tables || typeof tables !== 'object' || Array.isArray(tables)) {
        errors.push({
            path: basePath,
            message: '"tables" must be an object with table slugs as keys',
            severity: 'error'
        });
        return [];
    }

    const t = tables as Record<string, unknown>;
    const keys = Object.keys(t);

    if (keys.length === 0) {
        errors.push({
            path: basePath,
            message: 'At least one table is required',
            severity: 'error'
        });
    }

    keys.forEach(slug => {
        validateTableSchema(t[slug], `${basePath}.${slug}`, slug, errors, warnings);
    });

    return keys;
}

function validateTableSchema(
    table: unknown,
    basePath: string,
    slug: string,
    errors: ValidationError[],
    warnings: ValidationError[]
): void {
    if (!table || typeof table !== 'object') {
        errors.push({
            path: basePath,
            message: 'Table must be an object',
            severity: 'error'
        });
        return;
    }

    const t = table as Record<string, unknown>;

    // Validate slug format
    if (!/^[a-z0-9_-]+$/.test(slug)) {
        errors.push({
            path: basePath,
            message: `Table slug "${slug}" must be lowercase with underscores/hyphens only`,
            severity: 'error'
        });
    }

    // Required: name
    if (!t.name || typeof t.name !== 'string') {
        errors.push({
            path: `${basePath}.name`,
            message: 'Table "name" is required',
            severity: 'error'
        });
    }

    // Required: source_type
    if (!t.source_type || !VALID_SOURCE_TYPES.includes(t.source_type as TableSourceType)) {
        errors.push({
            path: `${basePath}.source_type`,
            message: `Table "source_type" must be one of: ${VALID_SOURCE_TYPES.join(', ')}`,
            severity: 'error'
        });
    }

    // Required: fields
    if (!Array.isArray(t.fields)) {
        errors.push({
            path: `${basePath}.fields`,
            message: 'Table "fields" must be an array',
            severity: 'error'
        });
    } else {
        validateFields(t.fields, `${basePath}.fields`, errors, warnings);
    }

    // Optional: settings
    if (t.settings !== undefined) {
        validateSettings(t.settings, `${basePath}.settings`, errors, warnings);
    }
}

function validateViews(
    views: unknown,
    basePath: string,
    tableKeys: string[],
    errors: ValidationError[],
    warnings: ValidationError[]
): string[] {
    if (!views || typeof views !== 'object' || Array.isArray(views)) {
        errors.push({
            path: basePath,
            message: '"views" must be an object with view keys',
            severity: 'error'
        });
        return [];
    }

    const v = views as Record<string, unknown>;
    const keys = Object.keys(v);

    if (keys.length === 0) {
        warnings.push({
            path: basePath,
            message: 'No views defined - consider adding at least one view',
            severity: 'warning'
        });
    }

    keys.forEach(viewKey => {
        validateViewSchema(v[viewKey], `${basePath}.${viewKey}`, tableKeys, errors, warnings);
    });

    return keys;
}

function validateViewSchema(
    view: unknown,
    basePath: string,
    tableKeys: string[],
    errors: ValidationError[],
    warnings: ValidationError[]
): void {
    if (!view || typeof view !== 'object') {
        errors.push({
            path: basePath,
            message: 'View must be an object',
            severity: 'error'
        });
        return;
    }

    const v = view as Record<string, unknown>;

    // Required: table reference
    if (!v.table || typeof v.table !== 'string') {
        errors.push({
            path: `${basePath}.table`,
            message: 'View "table" reference is required',
            severity: 'error'
        });
    } else if (!tableKeys.includes(v.table as string)) {
        errors.push({
            path: `${basePath}.table`,
            message: `View references unknown table "${v.table}". Available: ${tableKeys.join(', ')}`,
            severity: 'error'
        });
    }

    // Required: name
    if (!v.name || typeof v.name !== 'string') {
        errors.push({
            path: `${basePath}.name`,
            message: 'View "name" is required',
            severity: 'error'
        });
    }

    // Required: type
    if (!v.type || !VALID_VIEW_TYPES.includes(v.type as any)) {
        errors.push({
            path: `${basePath}.type`,
            message: `View "type" must be one of: ${VALID_VIEW_TYPES.join(', ')}`,
            severity: 'error'
        });
    }

    // Optional: config validation
    if (v.config && typeof v.config === 'object') {
        const config = v.config as Record<string, unknown>;
        
        // Deck-specific
        if (v.type === 'deck' && config.deck && typeof config.deck === 'object') {
            const deck = config.deck as Record<string, unknown>;
            if (!deck.primaryHeaderField) {
                warnings.push({
                    path: `${basePath}.config.deck.primaryHeaderField`,
                    message: 'Deck view should have "primaryHeaderField"',
                    severity: 'warning'
                });
            }
        }

        // Map-specific
        if (v.type === 'map' && config.map && typeof config.map === 'object') {
            const map = config.map as Record<string, unknown>;
            if (!map.lat || !map.long) {
                errors.push({
                    path: `${basePath}.config.map`,
                    message: 'Map view requires "lat" and "long" fields',
                    severity: 'error'
                });
            }
        }
    }
}

function validateNavigation(
    navigation: unknown,
    basePath: string,
    viewKeys: string[],
    errors: ValidationError[],
    warnings: ValidationError[]
): void {
    if (!Array.isArray(navigation)) {
        warnings.push({
            path: basePath,
            message: '"navigation" should be an array',
            severity: 'warning'
        });
        return;
    }

    navigation.forEach((item, index) => {
        const path = `${basePath}[${index}]`;
        
        if (!item || typeof item !== 'object') {
            errors.push({
                path,
                message: 'Navigation item must be an object',
                severity: 'error'
            });
            return;
        }

        const n = item as Record<string, unknown>;

        if (!n.id || typeof n.id !== 'string') {
            errors.push({
                path: `${path}.id`,
                message: 'Navigation item "id" is required',
                severity: 'error'
            });
        }

        if (!n.type || !['view', 'link'].includes(n.type as string)) {
            errors.push({
                path: `${path}.type`,
                message: 'Navigation item "type" must be "view" or "link"',
                severity: 'error'
            });
        }

        if (n.type === 'view') {
            if (!n.view || typeof n.view !== 'string') {
                errors.push({
                    path: `${path}.view`,
                    message: 'Navigation item with type="view" requires "view" reference',
                    severity: 'error'
                });
            } else if (!viewKeys.includes(n.view as string)) {
                errors.push({
                    path: `${path}.view`,
                    message: `Navigation references unknown view "${n.view}". Available: ${viewKeys.join(', ')}`,
                    severity: 'error'
                });
            }
        }

        if (n.type === 'link' && (!n.url || typeof n.url !== 'string')) {
            errors.push({
                path: `${path}.url`,
                message: 'Navigation item with type="link" requires "url"',
                severity: 'error'
            });
        }

        if (!n.label || typeof n.label !== 'string') {
            errors.push({
                path: `${path}.label`,
                message: 'Navigation item "label" is required',
                severity: 'error'
            });
        }
    });
}

// ============================================================================
// Table-Level Validator (Existing - for backward compatibility)
// ============================================================================

export function validateTableJson(data: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!data || typeof data !== 'object') {
        errors.push({
            path: '',
            message: 'JSON must be an object',
            severity: 'error'
        });
        return { valid: false, errors, warnings };
    }

    const obj = data as Record<string, unknown>;

    // Validate fields
    if (!Array.isArray(obj.fields)) {
        errors.push({
            path: 'fields',
            message: '"fields" must be an array',
            severity: 'error'
        });
    } else {
        validateFields(obj.fields, 'fields', errors, warnings);
    }

    // Validate layout (optional but check if present)
    if (obj.layout !== undefined) {
        validateLayout(obj.layout, 'layout', errors, warnings);
    }

    // Validate settings (optional but check if present)
    if (obj.settings !== undefined) {
        validateSettings(obj.settings, 'settings', errors, warnings);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

// ============================================================================
// Field Validation
// ============================================================================

function validateFields(
    fields: unknown[],
    basePath: string,
    errors: ValidationError[],
    warnings: ValidationError[]
): void {
    const seenNames = new Set<string>();

    fields.forEach((field, index) => {
        const path = `${basePath}[${index}]`;
        
        if (!field || typeof field !== 'object') {
            errors.push({
                path,
                message: 'Field must be an object',
                severity: 'error'
            });
            return;
        }

        const f = field as Record<string, unknown>;

        // Required: name
        if (!f.name || typeof f.name !== 'string' || f.name.trim() === '') {
            errors.push({
                path: `${path}.name`,
                message: 'Field "name" is required and must be a non-empty string',
                severity: 'error'
            });
        } else {
            // Check uniqueness
            if (seenNames.has(f.name as string)) {
                errors.push({
                    path: `${path}.name`,
                    message: `Duplicate field name: "${f.name}"`,
                    severity: 'error'
                });
            }
            seenNames.add(f.name as string);
        }

        // Required: type
        if (!f.type || typeof f.type !== 'string') {
            errors.push({
                path: `${path}.type`,
                message: 'Field "type" is required',
                severity: 'error'
            });
        } else if (!VALID_FIELD_TYPES.includes(f.type as FieldType)) {
            errors.push({
                path: `${path}.type`,
                message: `Invalid field type "${f.type}". Valid types: ${VALID_FIELD_TYPES.join(', ')}`,
                severity: 'error'
            });
        } else {
            const fieldType = f.type as FieldType;

            // Label required for all types EXCEPT html_block
            if (fieldType !== 'html_block') {
                if (!f.label || typeof f.label !== 'string' || f.label.trim() === '') {
                    errors.push({
                        path: `${path}.label`,
                        message: 'Field "label" is required and must be a non-empty string',
                        severity: 'error'
                    });
                }
            }

            // Options required for select/radio/checkbox UNLESS options_fn is provided
            if (OPTION_REQUIRED_TYPES.includes(fieldType)) {
                const hasOptions = Array.isArray(f.options) && f.options.length > 0;
                const hasOptionsFn = typeof f.options_fn === 'string' && f.options_fn.trim() !== '';
                
                if (!hasOptions && !hasOptionsFn) {
                    errors.push({
                        path: `${path}.options`,
                        message: `"options" array or "options_fn" function is required for type "${fieldType}"`,
                        severity: 'error'
                    });
                } else if (hasOptions) {
                    // Validate each option
                    (f.options as unknown[]).forEach((opt, optIdx) => {
                        if (!opt || typeof opt !== 'object') {
                            errors.push({
                                path: `${path}.options[${optIdx}]`,
                                message: 'Option must be an object with "value" and "label"',
                                severity: 'error'
                            });
                        } else {
                            const o = opt as Record<string, unknown>;
                            if (o.value === undefined || o.value === '') {
                                errors.push({
                                    path: `${path}.options[${optIdx}].value`,
                                    message: 'Option "value" is required',
                                    severity: 'error'
                                });
                            }
                            if (!o.label || typeof o.label !== 'string') {
                                errors.push({
                                    path: `${path}.options[${optIdx}].label`,
                                    message: 'Option "label" is required',
                                    severity: 'error'
                                });
                            }
                        }
                    });
                }
            }

            // html_block requires content
            if (fieldType === 'html_block') {
                if (!f.content || typeof f.content !== 'string') {
                    warnings.push({
                        path: `${path}.content`,
                        message: 'HTML block should have "content" property',
                        severity: 'warning'
                    });
                }
            }

            // Nested form requires fields array
            if (fieldType === 'nested_form') {
                if (!Array.isArray(f.fields)) {
                    errors.push({
                        path: `${path}.fields`,
                        message: 'Nested form must have a "fields" array',
                        severity: 'error'
                    });
                } else {
                    // Recursive validation
                    validateFields(f.fields as unknown[], `${path}.fields`, errors, warnings);
                }
            }
        }

        // Optional boolean fields
        if (f.required !== undefined && typeof f.required !== 'boolean') {
            warnings.push({
                path: `${path}.required`,
                message: '"required" should be a boolean',
                severity: 'warning'
            });
        }
    });
}

// ============================================================================
// Layout Validation
// ============================================================================

function validateLayout(
    layout: unknown,
    basePath: string,
    errors: ValidationError[],
    warnings: ValidationError[]
): void {
    if (!layout || typeof layout !== 'object') {
        errors.push({
            path: basePath,
            message: '"layout" must be an object',
            severity: 'error'
        });
        return;
    }

    const l = layout as Record<string, unknown>;

    // Required: type
    if (!l.type || !VALID_LAYOUT_TYPES.includes(l.type as any)) {
        errors.push({
            path: `${basePath}.type`,
            message: `Layout "type" must be one of: ${VALID_LAYOUT_TYPES.join(', ')}`,
            severity: 'error'
        });
    }

    // Note: app_name belongs to App level, not layout
    // Note: groupBy belongs to View level, not layout

    // Required: views object with at least one view
    if (!l.views || typeof l.views !== 'object') {
        errors.push({
            path: `${basePath}.views`,
            message: '"views" must be an object',
            severity: 'error'
        });
    } else {
        const views = l.views as Record<string, unknown>;
        const viewKeys = Object.keys(views);

        if (viewKeys.length === 0) {
            errors.push({
                path: `${basePath}.views`,
                message: 'At least one view is required',
                severity: 'error'
            });
        }

        viewKeys.forEach(viewKey => {
            validateView(views[viewKey], `${basePath}.views.${viewKey}`, errors, warnings);
        });
    }
}

function validateView(
    view: unknown,
    basePath: string,
    errors: ValidationError[],
    warnings: ValidationError[]
): void {
    if (!view || typeof view !== 'object') {
        errors.push({
            path: basePath,
            message: 'View must be an object',
            severity: 'error'
        });
        return;
    }

    const v = view as Record<string, unknown>;

    // Required: type
    if (!v.type || !VALID_VIEW_TYPES.includes(v.type as any)) {
        errors.push({
            path: `${basePath}.type`,
            message: `View "type" must be one of: ${VALID_VIEW_TYPES.join(', ')}`,
            severity: 'error'
        });
    }

    // Required: title
    if (!v.title || typeof v.title !== 'string') {
        errors.push({
            path: `${basePath}.title`,
            message: 'View "title" is required',
            severity: 'error'
        });
    }

    // Note: actions is optional - not all views need row actions (e.g., map views)

    // Deck-specific validation
    if (v.type === 'deck' && v.deck) {
        const deck = v.deck as Record<string, unknown>;
        if (!deck.primaryHeaderField || typeof deck.primaryHeaderField !== 'string') {
            warnings.push({
                path: `${basePath}.deck.primaryHeaderField`,
                message: 'Deck view should have "primaryHeaderField"',
                severity: 'warning'
            });
        }
    }

    // Map-specific validation
    if (v.type === 'map' && v.map) {
        const map = v.map as Record<string, unknown>;
        if (!map.lat || !map.long) {
            errors.push({
                path: `${basePath}.map`,
                message: 'Map view requires "lat" and "long" fields',
                severity: 'error'
            });
        }
    }
}

// ============================================================================
// Settings Validation
// ============================================================================

function validateSettings(
    settings: unknown,
    basePath: string,
    errors: ValidationError[],
    warnings: ValidationError[]
): void {
    if (!settings || typeof settings !== 'object') {
        errors.push({
            path: basePath,
            message: '"settings" must be an object',
            severity: 'error'
        });
        return;
    }

    const s = settings as Record<string, unknown>;

    // Required: icon
    if (!s.icon || typeof s.icon !== 'string') {
        warnings.push({
            path: `${basePath}.icon`,
            message: 'Settings "icon" should be a string',
            severity: 'warning'
        });
    }

    // Optional: actions object
    if (!s.actions || typeof s.actions !== 'object') {
        warnings.push({
            path: `${basePath}.actions`,
            message: 'Settings "actions" is recommended for defining button behaviors',
            severity: 'warning'
        });
        return; // Can't validate action details without actions object
    }

    const actions = s.actions as Record<string, unknown>;

    // Validate header actions
    if (!Array.isArray(actions.header)) {
        warnings.push({
            path: `${basePath}.actions.header`,
            message: '"actions.header" should be an array',
            severity: 'warning'
        });
    } else {
        (actions.header as unknown[]).forEach((action, idx) => {
            validateActionDefinition(action, `${basePath}.actions.header[${idx}]`, errors, warnings);
        });
    }

    // Validate row actions
    if (!Array.isArray(actions.row)) {
        warnings.push({
            path: `${basePath}.actions.row`,
            message: '"actions.row" should be an array',
            severity: 'warning'
        });
    } else {
        (actions.row as unknown[]).forEach((action, idx) => {
            validateActionDefinition(action, `${basePath}.actions.row[${idx}]`, errors, warnings);
        });
    }

    // Validate swipe
    if (actions.swipe && typeof actions.swipe === 'object') {
        const swipe = actions.swipe as Record<string, unknown>;
        if (!Array.isArray(swipe.left)) {
            warnings.push({
                path: `${basePath}.actions.swipe.left`,
                message: '"swipe.left" should be an array',
                severity: 'warning'
            });
        }
        if (!Array.isArray(swipe.right)) {
            warnings.push({
                path: `${basePath}.actions.swipe.right`,
                message: '"swipe.right" should be an array',
                severity: 'warning'
            });
        }
    }
}

function validateActionDefinition(
    action: unknown,
    basePath: string,
    errors: ValidationError[],
    warnings: ValidationError[]
): void {
    if (!action || typeof action !== 'object') {
        errors.push({
            path: basePath,
            message: 'Action must be an object',
            severity: 'error'
        });
        return;
    }

    const a = action as Record<string, unknown>;

    if (!a.id || typeof a.id !== 'string') {
        errors.push({
            path: `${basePath}.id`,
            message: 'Action "id" is required',
            severity: 'error'
        });
    }

    if (!a.label || typeof a.label !== 'string') {
        errors.push({
            path: `${basePath}.label`,
            message: 'Action "label" is required',
            severity: 'error'
        });
    }

    if (!a.icon || typeof a.icon !== 'string') {
        warnings.push({
            path: `${basePath}.icon`,
            message: 'Action "icon" should be specified',
            severity: 'warning'
        });
    }

    if (!a.type || typeof a.type !== 'string') {
        errors.push({
            path: `${basePath}.type`,
            message: 'Action "type" is required',
            severity: 'error'
        });
    }
}
