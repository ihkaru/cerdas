/** Map F7 color names to hex for MapLibre circle-color */
export const COLOR_MAP: Record<string, string> = {
    red: '#ff3b30',
    green: '#34c759',
    blue: '#2196f3',
    orange: '#ff9500',
    yellow: '#ffcc00',
    purple: '#af52de',
    pink: '#ff2d55',
    gray: '#8e8e93',
    teal: '#5ac8fa',
    deeporange: '#ff6d00',
    lightblue: '#64b5f6',
    white: '#ffffff',
    black: '#1c1c1e',
};

export const resolveColor = (colorName: string): string => {
    return COLOR_MAP[colorName] ?? '#2196f3';
};
