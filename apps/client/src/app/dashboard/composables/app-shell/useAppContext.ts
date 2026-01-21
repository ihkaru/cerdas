import { apiClient } from '@/common/api/ApiClient';
import { useLogger } from '@/common/utils/logger';
import type { Ref } from 'vue';

export function useAppContext(authStore: any, currentUserRole: Ref<string>) {
    const log = useLogger('UseAppContext');

    const fetchAppContext = async (appId: number | string) => {
        if (!navigator.onLine) {
            log.debug('Offline - skipping app context fetch');
            return;
        }

        try {
            const ctx = await apiClient.getAppContext(appId);
            if (ctx?.user) {
                log.info('App context loaded:', { role: ctx.user.role, orgId: ctx.user.organizationId });
                
                // Update authStore with app-specific role & org
                if (authStore.user) {
                    authStore.updateUser({
                        role: ctx.user.role,
                        organizationId: ctx.user.organizationId,
                        organizationName: ctx.user.organizationName,
                    });
                }
                
                // Also update currentUserRole for UI display
                currentUserRole.value = ctx.user.role;
                
                // Cache role locally for offline use
                localStorage.setItem(`app_role_${appId}`, ctx.user.role);
            }
        } catch (e) {
            log.warn('Failed to fetch app context', e);
        }
    };
    
    return {
        fetchAppContext
    };
}
