import type { TableSourceType } from '../../types/editor.types';
import { VALID_LAYOUT_TYPES, VALID_SOURCE_TYPES } from './constants';
import { validateActionDefinition, validateFields } from './fieldValidator';
import type { ValidationError, ValidationResult } from './types';
import { validateView } from './viewValidator';

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

export function validateTableSchema(
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

export function validateLayout(
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
    if (!l.type || !(VALID_LAYOUT_TYPES as readonly string[]).includes(l.type as string)) {
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

export function validateSettings(
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
