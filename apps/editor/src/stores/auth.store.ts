import { ApiClient } from '@/common/api/ApiClient';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export interface User {
    id: number;
    name: string;
    email: string;
    is_super_admin: boolean;
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null);
    const token = ref<string | null>(localStorage.getItem('auth_token'));
    const loading = ref(false);
    const error = ref<string | null>(null);

    const isAuthenticated = computed(() => !!token.value);
    const isSuperAdmin = computed(() => !!user.value?.is_super_admin);

    async function login(payload: { email: string; password: string }) {
        loading.value = true;
        error.value = null;
        try {
            const res = await ApiClient.post('/auth/login', payload);
            
            // ApiClient returns { success: true, data: { user, token } } directly if using handleResponse in previous step check
            // BUT wait, in Editor ApiClient it was returning AxiosResponse based on view_file default_api:view_file output in Step 238
            // "export const ApiClient = { get: ... => api.get<T> ... }"
            // So we need res.data
            const responseData = res.data;
            
            if (responseData.success) {
                token.value = responseData.data.token;
                user.value = responseData.data.user;
                
                if (token.value) {
                    localStorage.setItem('auth_token', token.value);
                }
                
                // Fetch full profile to get super admin status if not in login response
                // Login response has user object, let's assume it has is_super_admin or we fetch 'me'
                return true;
            } else {
                throw new Error(responseData.message || 'Login failed');
            }
        } catch (e: any) {
            error.value = e.response?.data?.message || e.message || 'Login failed';
            return false;
        } finally {
            loading.value = false;
        }
    }

    async function fetchUser() {
        if (!token.value) return;
        loading.value = true;
        try {
            const res = await ApiClient.get('/auth/me');
            // Backend AuthController@me returns { success: true, data: { user, is_super_admin, memberships } }
            // Wait, user object also has is_super_admin field?
            // Response wrapper: res.data is { success: true, data: ... }
            const data = res.data.data;
            user.value = {
                ...data.user,
                is_super_admin: data.is_super_admin // Ensure this property is explicitly set
            };
        } catch (e: any) {
             // If 401, logout
             if (e.response?.status === 401) {
                 logout();
             }
        } finally {
            loading.value = false;
        }
    }

    function logout() {
        token.value = null;
        user.value = null;
        localStorage.removeItem('auth_token');
        // Redirect logic handled by router guard or component
    }

    return {
        user,
        token,
        loading,
        error,
        isAuthenticated,
        isSuperAdmin,
        login,
        fetchUser,
        logout
    };
});
