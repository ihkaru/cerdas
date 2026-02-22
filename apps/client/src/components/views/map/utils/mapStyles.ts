export const GoogleHybridStyle = {
    version: 8,
    sources: {
        'google-hybrid': {
            type: 'raster',
            tiles: [
                'cached-tile://https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                'cached-tile://https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                'cached-tile://https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                'cached-tile://https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
            ],
            tileSize: 256,
            attribution: '© Google',
        },
    },
    layers: [
        {
            id: 'google-hybrid-layer',
            type: 'raster',
            source: 'google-hybrid',
            minzoom: 0,
            maxzoom: 22,
        },
    ],
};

export const GoogleStreetsStyle = {
    version: 8,
    sources: {
        'google-streets': {
            type: 'raster',
            tiles: [
                'cached-tile://https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
                'cached-tile://https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
                'cached-tile://https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
                'cached-tile://https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
            ],
            tileSize: 256,
            attribution: '© Google',
        },
    },
    layers: [
        {
            id: 'google-streets-layer',
            type: 'raster',
            source: 'google-streets',
            minzoom: 0,
            maxzoom: 22,
        },
    ],
};
