
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { defineStore } from 'pinia';
import { apiClient } from '../api/ApiClient';
import { networkService } from '../services/NetworkService';

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
    isSessionVerified: boolean;
}

import { useLogger } from '../utils/logger';
import { databaseService } from '../database/DatabaseService';

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
            isSessionVerified: false,
        };
    },

    getters: {
        isAuthenticated: (state) => !!state.token,
    },

    actions: {
        async login(email: string, password: string) {
            log.info('Attempting login', { email });
            let joinToken = localStorage.getItem('pending_join_token');
            const joinTokenAt = localStorage.getItem('pending_join_token_at');
            
            if (joinTokenAt && (Date.now() - parseInt(joinTokenAt)) > 30 * 60 * 1000) {
                // Expired after 30 mins
                localStorage.removeItem('pending_join_token');
                localStorage.removeItem('pending_join_token_at');
                joinToken = null;
            }

            const res = await apiClient.post('/auth/login', { 
                email, 
                password, 
                device_name: 'web-client',
                join_token: joinToken || undefined
            });

            // ApiClient returns the parsed JSON directly
            if (res && res.token && res.user) {
                log.info('Login successful');
                await this.setAuth(res.token, res.user);
                localStorage.removeItem('pending_join_token');
                return true;
            }
            log.warn('Login failed', res);
            return false;
        },

        async loginWithGoogle(idToken: string) {
            log.info('Attempting Google login');
            try {
                let joinToken = localStorage.getItem('pending_join_token');
                const joinTokenAt = localStorage.getItem('pending_join_token_at');
                
                if (joinTokenAt && (Date.now() - parseInt(joinTokenAt)) > 30 * 60 * 1000) {
                    // Expired after 30 mins
                    localStorage.removeItem('pending_join_token');
                    localStorage.removeItem('pending_join_token_at');
                    joinToken = null;
                }

                log.info('Google ID Token received for Join Handoff', { 
                    hasJoinToken: !!joinToken,
                    tokenLength: idToken?.length
                });

                const payload = { 
                    id_token: idToken, 
                    client_type: 'web',
                    join_token: joinToken || undefined
                };

                const res = await apiClient.post('/auth/google', payload);
                
                if (res && res.token && res.user) {
                    log.info('Google Login successful');
                    await this.setAuth(res.token, res.user);
                    
                    // Specific Join Handoff: If backend returned joined_app, 
                    // we can trigger an immediate sync or at least log it.
                    if (res.joined_app) {
                        log.info('Account joined app during login:', res.joined_app);
                    }

                    // We only remove the pending token IF the login was successful.
                    localStorage.removeItem('pending_join_token');
                    localStorage.removeItem('pending_join_token_at');
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

        async verifySession() {
            if (!this.token) return false;
            
            // If we already verified in this app session, skip network.
            if (this.isSessionVerified) return true;

            // INDUSTRY BEST PRACTICE 2026: 
            // If offline, don't even try the network. Trust the local token optimistically.
            if (!networkService.isOnline()) {
                log.info('Offline detected. Skipping server session verification (Optimistic Mode)');
                // We don't set isSessionVerified to true because we want to check as soon as we go back online
                return true;
            }
            
            try {
                const res = await apiClient.get('/auth/me');
                // The API returns { success: true, data: { user: { id: ... } } }
                const userData = res?.data?.user || res?.user || res?.data;
                if (userData && userData.id) {
                    // Update user info silently
                    this.user = { ...this.user, ...userData } as User;
                    localStorage.setItem('auth_user', JSON.stringify(this.user));
                    this.isSessionVerified = true;
                    return true;
                }
            } catch (e: any) {
                // Determine if this is a network failure or a 401
                const isNetworkError = !e.response && (
                    e.message?.includes('Failed to fetch') || 
                    e.message?.includes('Network Error') ||
                    e.message?.includes('Load failed')
                );

                if (isNetworkError) {
                    log.warn('Network error during session verification. Assuming session is still valid (Offline First).');
                    return true; // Optimistic return
                }

                // If ApiClient hit 401, it already cleared auth and redirected.
                log.warn('Session verification rejected by server', e);
            }
            return false;
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

        async setAuth(token: string, user: User) {
            log.info('Setting Auth:', { tokenLength: token.length, userId: user.id });
            this.token = token;
            this.user = user;
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_user', JSON.stringify(user));

            // EXTREMELY IMPORTANT: Check for User Switch before any other initialization
            // If the user logging in is DIFFERENT from the last one seen by SQLite, 
            // the database will be purged to prevent data leakage.
            await databaseService.checkUserSwitch(user.id.toString());

            // Force fresh sync on login to prevent stale/empty dashboard
            log.info('Clearing sync checkpoints for fresh session');
            const syncKeys = ['sync_global', 'sync_responses_all'];
            syncKeys.forEach(key => localStorage.removeItem(key));
            
            // Also clear all assignment/response sync keys
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith('sync_assignments_') || key?.startsWith('sync_responses_')) {
                    localStorage.removeItem(key);
                }
            }

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
