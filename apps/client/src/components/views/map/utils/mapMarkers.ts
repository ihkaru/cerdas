/** 
 * Standard Map Icons as SVG strings for MapLibre image loading.
 * We use simple shapes that can be easily colored.
 */

export const MARKER_ICONS = {
    'circle': `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" fill="{COLOR}" stroke="white" stroke-width="2"/>
    </svg>`,
    'pin': `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="{COLOR}" stroke="white" stroke-width="1.5"/>
        <circle cx="12" cy="9" r="2.5" fill="white"/>
    </svg>`,
    'star': `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="{COLOR}" stroke="white" stroke-width="1.5"/>
    </svg>`,
    'flag': `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" fill="{COLOR}" stroke="white" stroke-width="1.5"/>
    </svg>`,
    'check': `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="{COLOR}" stroke="white" stroke-width="1.5"/>
    </svg>`
};

/**
 * Creates a Data URL from an SVG string with a specific color.
 */
export function getMarkerImage(iconName: keyof typeof MARKER_ICONS, color: string): string {
    const svg = MARKER_ICONS[iconName] || MARKER_ICONS['circle'];
    const coloredSvg = svg.replace('{COLOR}', color);
    return `data:image/svg+xml;base64,${btoa(coloredSvg)}`;
}
