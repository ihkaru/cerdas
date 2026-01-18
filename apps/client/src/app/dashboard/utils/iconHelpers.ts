export const getIcon = (type: string) => {
    switch (type) {
        case 'map': return 'map';
        case 'deck': return 'list_bullet';
        default: return 'square';
    }
};
