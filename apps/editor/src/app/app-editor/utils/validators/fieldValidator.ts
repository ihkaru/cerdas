import type { FieldType } from '../../types/editor.types';
import { OPTION_REQUIRED_TYPES, VALID_FIELD_TYPES } from './constants';
import type { ValidationError } from './types';

export function validateFields(
    fields: unknown[],
    basePath: string,
    errors: ValidationError[],
    warnings: ValidationError[]
): void {
    const seenNames = new Set<string>();

    fields.forEach((field, index) => {
        validateSingleField(field, `${basePath}[${index}]`, errors, warnings, seenNames);
    });
}

function validateSingleField(
    field: unknown,
    path: string,
    errors: ValidationError[],
    warnings: ValidationError[],
    seenNames: Set<string>
): void {
    if (!field || typeof field !== 'object') {
        errors.push({ path, message: 'Field must be an object', severity: 'error' });
        return;
    }

    const f = field as Record<string, unknown>;

    validateCommonProps(f, path, errors, warnings, seenNames);
    validateTypeSpecifics(f, path, errors, warnings);
}

function validateCommonProps(
    f: Record<string, unknown>,
    path: string,
    errors: ValidationError[],
    warnings: ValidationError[],
    seenNames: Set<string>
): void {
    // Name
    if (!f.name || typeof f.name !== 'string' || f.name.trim() === '') {
        errors.push({ path: `${path}.name`, message: 'Field "name" is required and must be a non-empty string', severity: 'error' });
    } else {
        if (seenNames.has(f.name)) {
            errors.push({ path: `${path}.name`, message: `Duplicate field name: "${f.name}"`, severity: 'error' });
        }
        seenNames.add(f.name);
    }

    // Label (except html_block)
    if (f.type !== 'html_block') {
        if (!f.label || typeof f.label !== 'string' || f.label.trim() === '') {
            errors.push({ path: `${path}.label`, message: 'Field "label" is required and must be a non-empty string', severity: 'error' });
        }
    }

    // Required boolean
    if (f.required !== undefined && typeof f.required !== 'boolean') {
        warnings.push({ path: `${path}.required`, message: '"required" should be a boolean', severity: 'warning' });
    }
}

function validateTypeSpecifics(
    f: Record<string, unknown>,
    path: string,
    errors: ValidationError[],
    warnings: ValidationError[]
): void {
    if (!f.type || typeof f.type !== 'string') {
        errors.push({ path: `${path}.type`, message: 'Field "type" is required', severity: 'error' });
        return;
    }

    if (!VALID_FIELD_TYPES.includes(f.type as FieldType)) {
        errors.push({ path: `${path}.type`, message: `Invalid field type "${f.type}". Valid types: ${VALID_FIELD_TYPES.join(', ')}`, severity: 'error' });
        return;
    }

    const fieldType = f.type as FieldType;

    if (OPTION_REQUIRED_TYPES.includes(fieldType)) {
        validateOptions(f, path, errors);
    }

    if (fieldType === 'html_block') {
        if (!f.content || typeof f.content !== 'string') {
            warnings.push({ path: `${path}.content`, message: 'HTML block should have "content" property', severity: 'warning' });
        }
    }

    if (fieldType === 'nested_form') {
        if (!Array.isArray(f.fields)) {
            errors.push({ path: `${path}.fields`, message: 'Nested form must have a "fields" array', severity: 'error' });
        } else {
            validateFields(f.fields as unknown[], `${path}.fields`, errors, warnings);
        }
    }
}

function validateOptions(f: Record<string, unknown>, path: string, errors: ValidationError[]) {
    const hasOptions = Array.isArray(f.options) && f.options.length > 0;
    const hasOptionsFn = typeof f.options_fn === 'string' && f.options_fn.trim() !== '';

    if (!hasOptions && !hasOptionsFn) {
        errors.push({
            path: `${path}.options`,
            message: `"options" array or "options_fn" function is required for type "${f.type}"`,
            severity: 'error'
        });
    } else if (hasOptions) {
        (f.options as unknown[]).forEach((opt, optIdx) => {
            if (!opt || typeof opt !== 'object') {
                errors.push({ path: `${path}.options[${optIdx}]`, message: 'Option must be an object with "value" and "label"', severity: 'error' });
            } else {
                const o = opt as Record<string, unknown>;
                if (o.value === undefined || o.value === '') {
                    errors.push({ path: `${path}.options[${optIdx}].value`, message: 'Option "value" is required', severity: 'error' });
                }
                if (!o.label || typeof o.label !== 'string') {
                    errors.push({ path: `${path}.options[${optIdx}].label`, message: 'Option "label" is required', severity: 'error' });
                }
            }
        });
    }
}

export function validateActionDefinition(
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
