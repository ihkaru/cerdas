/**
 * Framework7 Route Type Definitions
 * 
 * These types provide proper typing for Framework7 route props
 * to eliminate `any` usage in page components.
 */

import type { Router } from 'framework7/types';

/**
 * Props interface for Framework7 page components
 */
export interface F7PageProps {
    f7route: Router.Route;
    f7router: Router.Router;
}

/**
 * Extended route params for common patterns
 */
export interface AppEditorRouteParams {
    id?: string;
    slug?: string;
}

export interface FormEditorRouteParams {
    id?: string;
}
