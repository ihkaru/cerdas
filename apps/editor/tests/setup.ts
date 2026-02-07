import { config } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeAll, vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Setup fresh Pinia instance for each test
beforeAll(() => {
    setActivePinia(createPinia());
});

afterEach(() => {
    // Reset all mocks after each test
    vi.clearAllMocks();
});

// Global test utils config
config.global.stubs = {
    // Stub Framework7 components to avoid issues
    'f7-page': true,
    'f7-navbar': true,
    'f7-block': true,
    'f7-button': true,
    'f7-list': true,
    'f7-list-item': true,
    'f7-icon': true,
};
