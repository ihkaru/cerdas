
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
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
            const joinToken = localStorage.getItem('pending_join_token');
            const res = await apiClient.post('/auth/login', { 
                email, 
                password, 
                device_name: 'web-client',
                join_token: joinToken || undefined
            });

            // ApiClient returns the parsed JSON directly
            if (res && res.token && res.user) {
                log.info('Login successful');
                this.setAuth(res.token, res.user);
                localStorage.removeItem('pending_join_token');
                return true;
            }
            log.warn('Login failed', res);
            return false;
        },

        async loginWithGoogle(idToken: string) {
            log.info('Attempting Google login');
            try {
                const joinToken = localStorage.getItem('pending_join_token');
                log.info('Google ID Token received for Join Handoff', { 
                    hasJoinToken: !!joinToken,
                    tokenLength: idToken?.length
                });

                const res = await apiClient.post('/auth/google', { 
                    id_token: idToken, 
                    client_type: 'web',
                    join_token: joinToken || undefined
                });
                
                if (res && res.token && res.user) {
                    log.info('Google Login successful');
                    this.setAuth(res.token, res.user);
                    
                    // We only remove the pending token IF the login was successful.
                    // If backend failed to join but login worked, we keep it for manual retry if needed,
                    // but usually the backend handles it.
                    localStorage.removeItem('pending_join_token');
                    return true;
                } else {
                    log.warn('Google Login failed: Invalid response structure', res);
                    return false;
                }
            } catch (e: any) {
                log.error('Google Login Error', e);
                // Log detailed error for Android debugging
                console.error('GOOGLE_LOGIN_FAILURE_DETAILS:', JSON.stringify(e, null, 2));
                throw e;
            }
        },

        async logout() {
            try {
                await apiClient.post('/auth/logout', {});
            } catch (e) {
                log.warn('Logout callback failed', e);
            }

            // Google Sign Out (Native)
            try {
                await GoogleAuth.signOut();
            } catch (e) {
                // Ignore if not signed in or not native
                log.debug('Google SignOut skipped/failed', e);
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
