
import type { ViewDefinition } from '../../../types/editor.types';
import type { NavigationItem } from '../../../types/view-config.types';

export function validateViewConfig(view: ViewDefinition): string | null {
    if (!view.title) return 'View title is required';
    if (!view.type) return 'View type is required';
    
    if (view.type === 'deck' && view.deck) {
        // if (!view.deck.primaryHeaderField) return 'Primary header is required for Deck view';
    }

    if (view.type === 'map' && view.map) {
        if (!view.map.lat || !view.map.long) return 'Latitude and Longitude fields are required for Map view';
    }

    return null;
}

export function validateNavItem(navItem: NavigationItem): string | null {
    if (!navItem.label) return 'Navigation label is required';
    if (navItem.type === 'view' && !navItem.view_id) return 'Target view is required';
    if (navItem.type === 'link' && !navItem.url) return 'URL is required';
    
    return null;
}
