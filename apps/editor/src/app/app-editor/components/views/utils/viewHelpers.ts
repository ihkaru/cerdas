
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
