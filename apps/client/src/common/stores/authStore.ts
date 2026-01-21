
import { defineStore } from 'pinia';
import { apiClient } from '../api/ApiClient';

interface User {
    id: number;
    name: string;
    email: string;
    // App-wide context properties (populated per-app login)
    role?: 'app_admin' | 'org_admin' | 'supervisor' | 'enumerator';
    organizationId?: number | null;
    organizationName?: string | null;
}

interface AuthState {
    token: string | null;
    user: User | null;
}

import { useLogger } from '../utils/logger';

const log = useLogger('AuthStore');

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => {
        const token = localStorage.getItem('auth_token');
        const user = JSON.parse(localStorage.getItem('auth_user') || 'null');
        log.debug('Initializing State:', { 
            hasToken: !!token, 
            tokenLength: token?.length,
            hasUser: !!user 
        });
        log.debug('AuthStore initialized', { hasToken: !!token, user });
        return {
            token,
            user,
        };
    },

    getters: {
        isAuthenticated: (state) => !!state.token,
    },

    actions: {
        async login(email: string, password: string) {
            log.info('Attempting login', { email });
            const res = await apiClient.post('/auth/login', { email, password, device_name: 'web-client' });
            if (res.data && res.data.token) {
                log.info('Login successful');
                this.setAuth(res.data.token, res.data.user);
                return true;
            }
            log.warn('Login failed', res);
            return false;
        },

        async logout() {
            try {
                await apiClient.post('/auth/logout', {});
            } catch (e) {
                // ignore
            }
            this.clearAuth();
        },

        setAuth(token: string, user: User) {
            log.info('Setting Auth:', { tokenLength: token.length, userId: user.id });
            this.token = token;
            this.user = user;
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_user', JSON.stringify(user));
            log.debug('Auth saved to LocalStorage');
        },

        clearAuth() {
            log.info('Clearing Auth');
            this.token = null;
            this.user = null;
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
        },

        updateUser(fields: Partial<User>) {
            if (!this.user) return;
            this.user = { ...this.user, ...fields };
            localStorage.setItem('auth_user', JSON.stringify(this.user));
            log.debug('User updated and saved to LocalStorage', fields);
        }
    }
});
