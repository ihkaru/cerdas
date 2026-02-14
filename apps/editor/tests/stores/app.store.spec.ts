import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../../src/common/api/ApiClient';
import { useAppStore } from '../../src/stores/app.store';

// Mock ApiClient
vi.mock('../../src/common/api/ApiClient', () => ({
    ApiClient: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
    },
}));

describe('AppStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    describe('fetchApps', () => {
        it('should fetch all apps', async () => {
            const mockApps = [
                { id: 'app-1', name: 'App 1', slug: 'app-1' },
                { id: 'app-2', name: 'App 2', slug: 'app-2' },
            ];
            
            vi.mocked(ApiClient.get).mockResolvedValue({
                data: { success: true, data: mockApps },
            } as any);

            const store = useAppStore();
            await store.fetchApps();

            expect(ApiClient.get).toHaveBeenCalledWith('/apps');
            expect(store.apps).toEqual(mockApps);
            expect(store.loading).toBe(false);
        });

        it('should handle fetch error', async () => {
            vi.mocked(ApiClient.get).mockRejectedValue(new Error('Network error'));

            const store = useAppStore();
            await store.fetchApps();

            expect(store.error).toBe('Network error');
        });
    });

    describe('fetchApp', () => {
        it('should fetch a single app by slug', async () => {
            const mockApp = { id: 'app-1', name: 'Test App', slug: 'test-app' };
            
            vi.mocked(ApiClient.get).mockResolvedValue({
                data: { success: true, data: mockApp },
            } as any);

            const store = useAppStore();
            await store.fetchApp('test-app');

            expect(ApiClient.get).toHaveBeenCalledWith('/apps/test-app');
            expect(store.currentApp).toEqual(mockApp);
        });
    });

    describe('selectApp', () => {
        it('should set current app', async () => {
            const mockApp = { id: 'app-1', name: 'Test App', slug: 'test-app' };
            
            vi.mocked(ApiClient.get).mockResolvedValue({
                data: { success: true, data: mockApp },
            } as any);

            const store = useAppStore();
            store.apps = [mockApp as any];
            
            await store.fetchApp('test-app');

            expect(store.currentApp).toEqual(mockApp);
        });
    });

    describe('createApp', () => {
        it('should create a new app', async () => {
            const newApp = { id: 'new-app', name: 'New App', slug: 'new-app' };
            
            vi.mocked(ApiClient.post).mockResolvedValue({
                data: { success: true, data: newApp },
            } as any);

            const store = useAppStore();
            const result = await store.createApp({ name: 'New App' });

            expect(ApiClient.post).toHaveBeenCalledWith('/apps', { name: 'New App' });
            expect(result).toEqual(newApp);
            expect(store.apps).toContainEqual(newApp);
        });
    });
});
