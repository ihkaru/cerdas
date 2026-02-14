/**
 * Generate a UUID v4 compatible with older WebView.
 * Uses crypto.getRandomValues for cryptographically secure randomness.
 *
 * @throws {Error} If no secure random source is available in the current environment.
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

        // Set version (4) and variant bits without bitwise operators
        const byte6 = buffer[6] ?? 0;
        const byte8 = buffer[8] ?? 0;
        buffer[6] = (byte6 % 16) + 64;  // (byte & 0x0f) | 0x40
        buffer[8] = (byte8 % 64) + 128; // (byte & 0x3f) | 0x80

        const hex = Array.from(buffer)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');

        return [
            hex.slice(0, 8),
            hex.slice(8, 12),
            hex.slice(12, 16),
            hex.slice(16, 20),
            hex.slice(20),
        ].join('-');
    }

    throw new Error(
        'generateUUID: No cryptographically secure random source available. ' +
        'This environment does not support crypto.randomUUID or crypto.getRandomValues.',
    );
}