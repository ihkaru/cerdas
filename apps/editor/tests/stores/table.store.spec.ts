import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../../../../src/common/api/ApiClient';
import { useTableStore } from '../../../../src/stores/table.store';

// Mock ApiClient
vi.mock('../../../../src/common/api/ApiClient', () => ({
    ApiClient: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('TableStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    describe('fetchTables', () => {
        it('should fetch tables for an app', async () => {
            const mockTables = [
                { id: '1', name: 'Table 1', slug: 'table-1' },
                { id: '2', name: 'Table 2', slug: 'table-2' },
            ];
            
            vi.mocked(ApiClient.get).mockResolvedValue({
                data: { success: true, data: mockTables },
            });

            const store = useTableStore();
            await store.fetchTables(1);

            expect(ApiClient.get).toHaveBeenCalledWith('/tables', { app_id: 1 });
            expect(store.tables).toEqual(mockTables);
            expect(store.loading).toBe(false);
        });

        it('should handle fetch error', async () => {
            vi.mocked(ApiClient.get).mockRejectedValue(new Error('Network error'));

            const store = useTableStore();
            await store.fetchTables(1);

            expect(store.error).toBe('Network error');
            expect(store.loading).toBe(false);
        });
    });

    describe('fetchTable', () => {
        it('should fetch a single table by ID', async () => {
            const mockTable = { id: 'table-1', name: 'Test Table' };
            
            vi.mocked(ApiClient.get).mockResolvedValue({
                data: { success: true, data: mockTable },
            });

            const store = useTableStore();
            await store.fetchTable('table-1');

            expect(ApiClient.get).toHaveBeenCalledWith('/tables/table-1');
            expect(store.currentTable).toEqual(mockTable);
        });
    });

    describe('createTable', () => {
        it('should create a new table', async () => {
            const newTable = { id: 'new-id', name: 'New Table', slug: 'new-table' };
            
            vi.mocked(ApiClient.post).mockResolvedValue({
                data: { success: true, data: newTable },
            });

            const store = useTableStore();
            const result = await store.createTable(1, { name: 'New Table' });

            expect(ApiClient.post).toHaveBeenCalledWith('/tables', {
                name: 'New Table',
                app_id: 1,
            });
            expect(result).toEqual(newTable);
            expect(store.tables).toContainEqual(newTable);
        });

        it('should throw on creation error', async () => {
            vi.mocked(ApiClient.post).mockRejectedValue(new Error('Create failed'));

            const store = useTableStore();
            
            await expect(store.createTable(1, { name: 'Test' })).rejects.toThrow('Create failed');
            expect(store.error).toBe('Create failed');
        });
    });

    describe('updateVersion', () => {
        it('should update table version fields and layout', async () => {
            const fields = [{ name: 'field1', type: 'text' }];
            const layout = { sections: [] };
            
            vi.mocked(ApiClient.put).mockResolvedValue({
                data: { success: true },
            });

            const store = useTableStore();
            store.currentVersion = { version: 1 } as any;
            
            await store.updateVersion(1, 1, fields, layout);

            expect(ApiClient.put).toHaveBeenCalledWith('/tables/1/versions/1', {
                fields,
                layout,
            });
            expect(store.saving).toBe(false);
        });
    });

    describe('createDraft', () => {
        it('should create a new draft version', async () => {
            const draftVersion = { id: 'v2', version: 2, published_at: null };
            
            vi.mocked(ApiClient.post).mockResolvedValue({
                data: { success: true, data: draftVersion },
            });

            const store = useTableStore();
            const result = await store.createDraft(1);

            expect(ApiClient.post).toHaveBeenCalledWith('/tables/1/versions/draft');
            expect(result).toEqual(draftVersion);
            expect(store.currentVersion).toEqual(draftVersion);
        });
    });

    describe('publishVersion', () => {
        it('should publish a version and refresh table', async () => {
            vi.mocked(ApiClient.post).mockResolvedValue({ data: { success: true } });
            vi.mocked(ApiClient.get).mockResolvedValue({
                data: { success: true, data: { id: 'table-1' } },
            });

            const store = useTableStore();
            await store.publishVersion(1, 1);

            expect(ApiClient.post).toHaveBeenCalledWith('/tables/1/versions/1/publish');
            // Should also fetchTable to refresh
            expect(ApiClient.get).toHaveBeenCalledWith('/tables/1');
        });
    });
});
