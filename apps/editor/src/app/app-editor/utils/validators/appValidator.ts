import { VALID_APP_MODES } from './constants';
import { validateNavigation } from './navigationValidator';
import { validateTableSchema } from './tableValidator';
import type { ValidationError, ValidationResult } from './types';
import { validateViewSchema } from './viewValidator';

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

export function validateAppMetadata(
    app: unknown,
    basePath: string,
    errors: ValidationError[],
    _warnings: ValidationError[]
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

    if (a.mode && !(VALID_APP_MODES as readonly string[]).includes(a.mode as string)) {
        errors.push({
            path: `${basePath}.mode`,
            message: `App "mode" must be one of: ${VALID_APP_MODES.join(', ')}`,
            severity: 'error'
        });
    }
}

export function validateTables(
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

export function validateViews(
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
