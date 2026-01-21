
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

export function createDefaultView(title: string): ViewDefinition {
    return {
        type: 'deck',
        title,
        groupBy: [],
        deck: {
            primaryHeaderField: 'name',
            secondaryHeaderField: 'description',
            imageField: null,
            imageShape: 'square',
        },
        actions: ['open', 'delete'],
    };
}

export function generateViewId(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.floor(Math.random() * 1000);
}
