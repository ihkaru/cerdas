export const statusChipColor = (status: string) => {
    switch (status) {
        case 'completed': return 'green';
        case 'in_progress': return 'blue';
        case 'synced': return 'teal';
        default: return 'gray';
    }
};

export const statusLabel = (status: string) => {
    switch (status) {
        case 'completed': return 'Selesai';
        case 'in_progress': return 'Proses';
        case 'synced': return 'Tersinkron';
        case 'assigned': return 'Pending';
        default: return status || 'Unknown';
    }
};
