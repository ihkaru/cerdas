import { databaseService } from '@/common/database/DatabaseService';
import { useLogger } from '@/common/utils/logger';
import { computed, onMounted, onUnmounted, ref } from 'vue';

const logger = useLogger('VersionGate');

/**
 * Composable to check if a table's local version matches the server's current version.
 * Used to block or warn enumerators when their form is outdated.
 */
export function useVersionGate(tableId: () => string | null) {
    const localVersion = ref<number>(0);
    const versionPolicy = ref<string>('accept_all');
    const rejectedMessage = ref<string>('');

    const isOutdated = computed(() => rejectedMessage.value !== '');
    const isBlocked = computed(() => versionPolicy.value === 'require_update' && isOutdated.value);
    const isWarning = computed(() => versionPolicy.value === 'warn' && isOutdated.value);
    const canCreateResponse = computed(() => !isBlocked.value);

    async function checkVersion() {
        const id = tableId();
        if (!id) return;

        try {
            const db = await databaseService.getDB();
            const res = await db.query(
                'SELECT version, version_policy FROM tables WHERE id = ?',
                [id]
            );
            if (res.values && res.values.length > 0) {
                localVersion.value = res.values[0].version || 0;
                versionPolicy.value = res.values[0].version_policy || 'accept_all';
            }
        } catch (e) {
            logger.error('[VersionGate] Failed to check version', e);
        }
    }

    function handleVersionRejected(event: Event) {
        const detail = (event as CustomEvent).detail;
        rejectedMessage.value = detail.message || 'Form version outdated. Please sync.';
        logger.warn('[VersionGate] Version rejected event received', detail);
    }

    function clearRejection() {
        rejectedMessage.value = '';
    }

    onMounted(() => {
        checkVersion();
        window.addEventListener('version-rejected', handleVersionRejected);
    });

    onUnmounted(() => {
        window.removeEventListener('version-rejected', handleVersionRejected);
    });

    return {
        localVersion,
        versionPolicy,
        rejectedMessage,
        isOutdated,
        isBlocked,
        isWarning,
        canCreateResponse,
        checkVersion,
        clearRejection,
    };
}
