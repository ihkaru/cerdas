export const getAvatarStyle = (name: string) => {
    const colors = [
        { bg: '#FFEBEE', text: '#C62828' }, // Red
        { bg: '#E3F2FD', text: '#1565C0' }, // Blue
        { bg: '#E8F5E9', text: '#2E7D32' }, // Green
        { bg: '#FFF3E0', text: '#EF6C00' }, // Orange
        { bg: '#F3E5F5', text: '#6A1B9A' }, // Purple
        { bg: '#E0F7FA', text: '#006064' }, // Cyan
    ];

    let hash = 0;
    const str = name || '';
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    const color = colors[index];
    const bg = color?.bg || '#eee';
    const text = color?.text || '#333';
    return `background-color: ${bg}; color: ${text};`;
};
