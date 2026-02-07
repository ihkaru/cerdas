import { http, HttpResponse } from 'msw';

// Base URL for API
const API_BASE = 'http://localhost:8080/api';

// Sample data
export const mockTables = [
    {
        id: 'table-uuid-1',
        app_id: 'app-uuid-1',
        name: 'Test Table 1',
        slug: 'test-table-1',
        description: 'A test table',
        current_version: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
    },
    {
        id: 'table-uuid-2',
        app_id: 'app-uuid-1',
        name: 'Test Table 2',
        slug: 'test-table-2',
        description: null,
        current_version: 1,
        created_at: '2026-01-02T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
    },
];

export const mockApps = [
    {
        id: 'app-uuid-1',
        name: 'Test App',
        slug: 'test-app',
        description: 'A test application',
        created_at: '2026-01-01T00:00:00Z',
    },
];

export const mockTableVersion = {
    id: 'version-uuid-1',
    table_id: 'table-uuid-1',
    version: 1,
    fields: [
        { name: 'name', type: 'text', label: 'Name', required: true },
        { name: 'age', type: 'number', label: 'Age' },
    ],
    layout: {},
    published_at: null,
    created_at: '2026-01-01T00:00:00Z',
};

// MSW handlers
export const handlers = [
    // Tables
    http.get(`${API_BASE}/tables`, ({ request }) => {
        const url = new URL(request.url);
        const appId = url.searchParams.get('app_id');
        const filtered = appId
            ? mockTables.filter((t) => t.app_id === appId)
            : mockTables;
        return HttpResponse.json({ success: true, data: filtered });
    }),

    http.get(`${API_BASE}/tables/:id`, ({ params }) => {
        const table = mockTables.find((t) => t.id === params.id);
        if (!table) {
            return HttpResponse.json(
                { success: false, message: 'Not found' },
                { status: 404 }
            );
        }
        return HttpResponse.json({ success: true, data: table });
    }),

    http.post(`${API_BASE}/tables`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        const newTable = {
            id: 'new-table-uuid',
            app_id: body.app_id,
            name: body.name,
            slug: String(body.name).toLowerCase().replace(/ /g, '-'),
            description: body.description || null,
            current_version: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        return HttpResponse.json({ success: true, data: newTable }, { status: 201 });
    }),

    // Table Versions
    http.get(`${API_BASE}/tables/:tableId/versions/:version`, () => {
        return HttpResponse.json({ success: true, data: mockTableVersion });
    }),

    http.put(`${API_BASE}/tables/:tableId/versions/:version`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        const updated = { ...mockTableVersion, fields: body.fields, layout: body.layout };
        return HttpResponse.json({ success: true, data: updated });
    }),

    http.post(`${API_BASE}/tables/:tableId/versions/draft`, () => {
        const draft = { ...mockTableVersion, version: 2, published_at: null };
        return HttpResponse.json({ success: true, data: draft });
    }),

    http.post(`${API_BASE}/tables/:tableId/versions/:version/publish`, () => {
        return HttpResponse.json({ success: true, message: 'Published' });
    }),

    // Apps
    http.get(`${API_BASE}/apps`, () => {
        return HttpResponse.json({ success: true, data: mockApps });
    }),

    http.get(`${API_BASE}/apps/:slug`, ({ params }) => {
        const app = mockApps.find((a) => a.slug === params.slug || a.id === params.slug);
        if (!app) {
            return HttpResponse.json(
                { success: false, message: 'Not found' },
                { status: 404 }
            );
        }
        return HttpResponse.json({ success: true, data: app });
    }),
];
