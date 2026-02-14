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
