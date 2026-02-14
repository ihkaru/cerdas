/**
 * Generate a UUID v4 compatible with older WebView
 * Uses crypto.getRandomValues for better randomness when available
 */
export function generateUUID(): string {
    // Try native crypto.randomUUID first (fastest, if available)
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    
    // Fallback: Use crypto.getRandomValues if available
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const buffer = new Uint8Array(16);
        crypto.getRandomValues(buffer);
        
        // Set version (4) and variant bits
        buffer[6] = (buffer[6]! & 0x0f) | 0x40;
        buffer[8] = (buffer[8]! & 0x3f) | 0x80;
        
        const hex = Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    
    // Last resort fallback: Math.random based (less secure, but works everywhere)
    /* eslint-disable-next-line */
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
