import { evaluate } from '@cerdas/expression-engine';
import { type Ref } from 'vue';
import type { FieldDefinition } from '../types/schema';

export interface ValidationItem {
    fieldName: string;
    label: string;
    message: string;
    type: 'error' | 'warning' | 'blank';
}

export function useFormValidation(
    formData: Record<string, any>,
    errors: Ref<Record<string, string>>,
    visibleFields: Ref<FieldDefinition[]>,
    externalContext: Ref<Record<string, any>>,
    evaluateEffectiveValue: (field: FieldDefinition, key: 'show_if' | 'editable_if' | 'required_if', def: boolean) => boolean
) {

    const validate = (): boolean => {
        errors.value = {};
        let isValid = true;

        visibleFields.value.forEach(field => {
            const isRequired = evaluateEffectiveValue(field, 'required_if', !!field.required);
            const val = formData[field.name];

            // Required Check
            if (isRequired) {
                if (val === null || val === undefined || val === '') {
                    errors.value[field.name] = 'This field is required';
                    isValid = false;
                    return;
                }
                if (Array.isArray(val) && val.length === 0) {
                    errors.value[field.name] = 'This field is required';
                    isValid = false;
                    return;
                }
            }

            // Custom JS Validation
            if (field.validation_js) {
                const evalContext = { row: formData, value: val, ...externalContext.value };
                // Add self-reference 'ctx'
                (evalContext as any).ctx = evalContext;

                const res = evaluate(field.validation_js, evalContext as any);
                if (typeof res === 'string') {
                    errors.value[field.name] = res;
                    isValid = false;
                } else if (res === false) {
                    errors.value[field.name] = 'Invalid value';
                    isValid = false;
                }
            }
        });

        return isValid;
    };

    const getValidationSummary = (): { errors: ValidationItem[]; warnings: ValidationItem[]; blanks: ValidationItem[] } => {
        const result = { errors: [] as ValidationItem[], warnings: [] as ValidationItem[], blanks: [] as ValidationItem[] };

        // Helper to validate a single field
        const validateField = (
            field: FieldDefinition,
            val: any,
            fieldPath: string,
            labelPrefix: string,
            evalContext: Record<string, any>
        ) => {
            const label = labelPrefix ? `${labelPrefix} → ${field.label || field.name}` : (field.label || field.name);

            // Check if blank (required but empty)
            const isEmpty = val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0);
            const isRequired = evaluateEffectiveValue(field, 'required_if', !!field.required);

            if (isRequired && isEmpty) {
                result.blanks.push({ fieldName: fieldPath, label, message: 'Field wajib belum diisi', type: 'blank' });
                return;
            }

            // Check for validation errors
            if (field.validation_js && !isEmpty) {
                const fullContext = { ...evalContext, value: val };
                (fullContext as any).ctx = fullContext;

                const res = evaluate(field.validation_js, fullContext as any);
                if (typeof res === 'string') {
                    result.errors.push({ fieldName: fieldPath, label, message: res, type: 'error' });
                } else if (res === false) {
                    result.errors.push({ fieldName: fieldPath, label, message: 'Nilai tidak valid', type: 'error' });
                }
            }

            // Check for warnings
            if (field.warning_fn || field.warning_js) {
                const warningCode = (field.warning_fn || field.warning_js) as string;
                try {
                    const fullContext = { ...evalContext, value: val };
                    (fullContext as any).ctx = fullContext;

                    const res = evaluate(warningCode, fullContext as any);
                    if (typeof res === 'string' && res.length > 0) {
                        result.warnings.push({ fieldName: fieldPath, label, message: res, type: 'warning' });
                    }
                } catch (e) {
                    console.error('Warning evaluation error', e);
                }
            }
        };

        // Recursive helper for nested forms
        const validateNestedFields = (
            nestedFields: FieldDefinition[],
            nestedData: any[],
            parentFieldName: string,
            parentLabel: string,
            parentContext: Record<string, any>
        ) => {
            if (!Array.isArray(nestedData)) return;

            nestedData.forEach((item, index) => {
                const itemLabel = `${parentLabel} #${index + 1}`;
                const nestedContext = {
                    ...parentContext,
                    row: item,
                    parentRow: parentContext.row,
                    rowIndex: index
                };

                nestedFields.forEach(childField => {
                    const childPath = `${parentFieldName}[${index}].${childField.name}`;
                    const childVal = item?.[childField.name];

                    // Skip separator/html_block
                    if (childField.type === 'separator' || childField.type === 'html_block') return;

                    // Recurse if nested_form
                    if ((childField.type === 'nested' || childField.type === 'nested_form') && childField.fields) {
                        validateNestedFields(childField.fields, childVal || [], childPath,
                            `${itemLabel} → ${childField.label || childField.name}`, nestedContext);
                        return;
                    }

                    validateField(childField, childVal, childPath, itemLabel, nestedContext);
                });
            });
        };

        // Validate parent fields
        visibleFields.value.forEach(field => {
            const val = formData[field.name];
            const evalContext = { row: formData, ...externalContext.value };

            // Skip separator/html_block
            if (field.type === 'separator' || field.type === 'html_block') return;

            // Handle nested_form recursively
            if ((field.type === 'nested' || field.type === 'nested_form') && field.fields) {
                validateNestedFields(field.fields, val || [], field.name, field.label || field.name, evalContext);
                return;
            }

            validateField(field, val, field.name, '', evalContext);
        });

        return result;
    };

    return {
        validate,
        getValidationSummary
    };
}
