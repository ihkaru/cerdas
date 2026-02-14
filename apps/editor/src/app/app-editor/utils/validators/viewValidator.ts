import { VALID_VIEW_TYPES } from './constants';
import type { ValidationError } from './types';

export function validateViewSchema(
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
    if (!v.type || !(VALID_VIEW_TYPES as readonly string[]).includes(v.type as string)) {
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
            const hasGps = !!map.gps_column;
            const hasLatLong = !!map.lat && !!map.long;
            
            if (!hasGps && !hasLatLong) {
                errors.push({
                    path: `${basePath}.config.map`,
                    message: 'Map view requires "gps_column" OR "lat" and "long" fields',
                    severity: 'error'
                });
            }
        }
    }
}

export function validateView(
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
    if (!v.type || !(VALID_VIEW_TYPES as readonly string[]).includes(v.type as string)) {
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
        const hasGps = !!map.gps_column;
        const hasLatLong = !!map.lat && !!map.long;

        if (!hasGps && !hasLatLong) {
            errors.push({
                path: `${basePath}.map`,
                message: 'Map view requires "gps_column" OR "lat" and "long" fields',
                severity: 'error'
            });
        }
    }
}
