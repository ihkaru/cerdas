// Canonical assignment statuses (matches backend Assignment model):
// assigned → in_progress → submitted (complex only) → synced
//                                                    ↘ rejected (complex only)

export const statusChipColor = (status: string) => {
    switch (status) {
        case 'assigned':   return 'gray';
        case 'in_progress': return 'blue';
        case 'submitted':  return 'orange';   // waiting for review / terminal simple
        case 'approved':   return 'teal';     // final: data accepted (complex)
        case 'synced':     return 'teal';     // fallback compatibility
        case 'rejected':   return 'red';      // complex: returned by supervisor
        default:           return 'gray';
    }
};

export const statusLabel = (status: string, mode?: 'simple' | 'complex' | string) => {
    switch (status) {
        case 'assigned':   return 'Pending';
        case 'in_progress': return 'Proses';
        case 'submitted':
            if (mode === 'simple') return 'Terkirim';
            if (mode === 'complex') return 'Menunggu Review';
            return 'Terkirim'; // Default friendly term
        case 'approved':   return 'Disetujui';
        case 'synced':     return 'Disetujui'; // Fallback compatibility
        case 'rejected':   return 'Dikembalikan';
        default: return status || 'Unknown';
    }
};

