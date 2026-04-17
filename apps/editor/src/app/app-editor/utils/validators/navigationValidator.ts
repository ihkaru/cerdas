import type { ValidationError } from './types';

export function validateNavigation(
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
            const targetView = (n.view_id || n.view) as string;
            if (!targetView || typeof targetView !== 'string') {
                errors.push({
                    path: `${path}.view`,
                    message: 'Navigation item with type="view" requires "view" or "view_id" reference',
                    severity: 'error'
                });
            } else if (!viewKeys.includes(targetView)) {
                errors.push({
                    path: n.view_id ? `${path}.view_id` : `${path}.view`,
                    message: `Navigation references unknown view "${targetView}". Available: ${viewKeys.join(', ')}`,
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
