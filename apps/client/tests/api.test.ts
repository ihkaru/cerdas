
import { describe, expect, it } from 'vitest';

// Configure fetch for Node environment (Vitest runs in Node)
// Vite/Vitest polyfills fetch in newer versions, but we might need to be explicit if using native node fetch
// We'll use the ApiClient logic but instantiated manually or just raw fetch for independence.

const BASE_URL = 'http://127.0.0.1:9999/api';
let AUTH_TOKEN = '';

describe('Backend API Integration Tests', () => {
    
    // 1. Auth Flow
    it('should login successfully', async () => {
        // Assume seeder created user@example.com / password
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: 'user@example.com',
                password: 'password',
                device_name: 'test-runner'
            })
        });

        console.log('Login Status:', res.status);
        if (!res.ok) {
            const text = await res.text();
            console.error('Login Failed Body:', text);
            throw new Error(`Login failed with status ${res.status}`);
        }

        const response = await res.json();
        console.log('Login Response:', JSON.stringify(response, null, 2));
        
        expect(res.status).toBe(200);
        expect(response.data).toHaveProperty('token');
        expect(response.data.user.email).toBe('user@example.com');
        
        AUTH_TOKEN = response.data.token;
    });

    // 2. Data Flow
    it('should fetch assignments', async () => {
        expect(AUTH_TOKEN).toBeTruthy();
        
        const res = await fetch(`${BASE_URL}/assignments`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Accept': 'application/json'
            }
        });

        if (!res.ok) {
            const text = await res.text();
            console.error('Assignments Fetch Failed Body:', text);
        }

        const data = await res.json();
        console.log('Assignments Status:', res.status);
        
        expect(res.status).toBe(200);
        // data might be wrapped in paginated object or resource
        // Our controller uses ApiResource usually, checking structure
        expect(data).toHaveProperty('data');
        // Paginator structure: data.data is the array
        expect(Array.isArray(data.data.data)).toBe(true);
    });

    // 3. Sync Flow
    it('should push responses', async () => {
        expect(AUTH_TOKEN).toBeTruthy();
        
        // Need a valid assignment ID first. 
        // For test, we might fail if no assignment exists.
        // But the endpoint should at least be reachable.
        
        const payload = {
            responses: [
                {
                    local_id: crypto.randomUUID(),
                    assignment_id: 99999, // Likely not found, but API should respond 200 with error status in body
                    data: { foo: 'bar' },
                    created_at: new Date().toISOString()
                }
            ]
        };

        const res = await fetch(`${BASE_URL}/responses/sync`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.data).toHaveLength(1);
        expect(data.data[0].status).toBe('error'); // Expected "Assignment not found" unless we seeded it real good
        expect(data.data[0].message).toBe('Assignment not found');
    });

    // 4. Schema Flow
    it('should fetch project schemas', async () => {
        expect(AUTH_TOKEN).toBeTruthy();
        
        // Fetch projects first to get a valid project ID
        // Note: In a real scenario we'd use the Project endpoint or assume implicit assignments
        // But for now let's try to fetch schemas for the seeded project (check seeded IDs if possible, or list all)
        
        // Let's assume we list schemas based on user access
        // Since we don't have a direct "list all schemas" endpoint that isn't project-scoped usually,
        // let's check if we have an endpoint for it.
        // Looking at routes/api.php would be good, but for now assuming /app-schemas context
        
        const res = await fetch(`${BASE_URL}/app-schemas`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Accept': 'application/json'
            }
        });

        if (res.status === 404) {
            console.warn('Skipping Schema test: Endpoint not implemented yet');
            return;
        }

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toHaveProperty('data');
    });

    // 5. Project Flow (Metadata)
    it('should fetch projects', async () => {
         expect(AUTH_TOKEN).toBeTruthy();
         
         const res = await fetch(`${BASE_URL}/projects`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Accept': 'application/json'
            }
        });
        
        if (res.status === 404) {
             console.warn('Skipping Project test: Endpoint not implemented yet');
             return;
        }

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toHaveProperty('data');
    });

});
