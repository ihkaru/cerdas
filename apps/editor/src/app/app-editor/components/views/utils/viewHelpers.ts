
import type { ViewDefinition } from '../../../types/editor.types';

export function getViewIcon(type: string | undefined): string {
    switch (type) {
        case 'map': return 'map';
        case 'deck': return 'rectangle_stack';
        case 'table': return 'table';
        case 'calendar': return 'calendar';
        default: return 'square_grid_2x2';
    }
}

export function getSmartViewFields(fields: any[]) {
    if (!fields || fields.length === 0) {
        return {
            primaryHeaderField: 'name',
            secondaryHeaderField: 'description'
        };
    }
    
    // Find best primary field name
    const primaryCandidates = ['name', 'nama', 'title', 'judul', 'label', 'id'];
    let primaryField = fields.find(f => primaryCandidates.includes(String(f.name).toLowerCase()));
    if (!primaryField) {
        // Fallback to first text/number/gps/select field
        primaryField = fields.find(f => ['text', 'number', 'gps', 'select'].includes(f.type)) || fields[0];
    }
    const primaryName = primaryField ? String(primaryField.name) : 'name';
    
    // Find best secondary field name (excluding primary)
    const secondaryCandidates = ['description', 'deskripsi', 'address', 'alamat', 'location', 'lokasi', 'status'];
    let secondaryField = fields.find(f => f.name !== primaryName && secondaryCandidates.includes(String(f.name).toLowerCase()));
    if (!secondaryField) {
        secondaryField = fields.find(f => f.name !== primaryName && ['text', 'select', 'date'].includes(f.type));
    }
    const secondaryName = secondaryField ? String(secondaryField.name) : 'description';
    
    return {
        primaryHeaderField: primaryName,
        secondaryHeaderField: secondaryName
    };
}

export function createDefaultView(title: string, fields?: any[]): ViewDefinition {
    const smart = getSmartViewFields(fields || []);
    return {
        type: 'deck',
        title,
        groupBy: [],
        deck: {
            primaryHeaderField: smart.primaryHeaderField,
            secondaryHeaderField: smart.secondaryHeaderField,
            imageField: null,
            imageShape: 'square',
        },
        actions: ['open', 'delete'],
    };
}

export function generateViewId(title: string): string {
    let randomSuffix: number;
    const win = window as any;
    if (typeof win !== 'undefined' && win.crypto && win.crypto.getRandomValues) {
        randomSuffix = win.crypto.getRandomValues(new Uint32Array(1))[0] % 10000;
    } else {
        // eslint-disable-next-line
        randomSuffix = Math.floor(Math.random() * 10000);
    }
    return title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + randomSuffix;
}
