import { type AppSchema } from '@cerdas/form-engine';
import { f7 } from 'framework7-vue';
import { ref, type Ref } from 'vue';
import { DashboardRepository } from '../../../app/dashboard/repositories/DashboardRepository';
import type { Assignment } from '../../../app/dashboard/types';
import { useDatabase } from '../../../common/composables/useDatabase';
import { useLogger } from '../../../common/utils/logger';

export function useVersionPinning(
    assignmentId: string,
    assignment: Ref<Assignment | null>,
    schema: Ref<AppSchema | null>,
    formData: Ref<Record<string, unknown>>,
    pinnedSchemaVersion: Ref<number | null>,
    currentTableVersion: Ref<number | null>,
    takeSnapshot: (data: Record<string, unknown>) => void
) {
    const log = useLogger('AssignmentDetail:VersionPinning');
    const db = useDatabase();
    const migrating = ref(false);

    /**
     * Migrate draft from pinned schema version to the latest version.
     * Keeps data for fields that still exist, discards removed fields.
     */
    const handleMigrateVersion = () => {
        f7.dialog.confirm(
            'Data akan dimigrasikan ke versi terbaru. Field yang sudah dihapus akan dibuang. Field baru akan kosong dan perlu diisi. Lanjutkan?',
            'Update Versi Form',
            async () => {
                migrating.value = true;
                try {
                    const conn = await db.getDB();
                    const tableId = assignment.value?.table_id;
                    if (!tableId) throw new Error('Table ID not found');

                    const result = await DashboardRepository.migrateToLatestVersion(
                        conn, assignmentId, tableId
                    );

                    if (!result) {
                        f7.toast.show({ text: 'Gagal migrasi: schema tidak ditemukan', closeTimeout: 2000, cssClass: 'color-red' });
                        return;
                    }

                    await db.save();

                    // Update schema to new version
                    const newFields = result.newFields;
                    if (Array.isArray(newFields)) {
                        schema.value = { fields: newFields } as unknown as AppSchema;
                    } else {
                        schema.value = newFields as unknown as AppSchema;
                    }

                    // Update form data with migrated data
                    formData.value = result.migratedData;
                    
                    // Update snapshot so it doesn't prompt for save on back if user just migrated
                    // actually user might want to save migration result? 
                    // The original code did takeSnapshot(formData.value) effectively making it "clean" relative to migration
                    takeSnapshot(formData.value);

                    // Update version refs — banner will disappear
                    pinnedSchemaVersion.value = result.newVersion;
                    currentTableVersion.value = result.newVersion;

                    f7.toast.show({
                        text: `✅ Berhasil update ke v${result.newVersion}`,
                        closeTimeout: 2000,
                        cssClass: 'color-green'
                    });

                    log.info('[VersionMigration] Migration complete', {
                        newVersion: result.newVersion,
                        fieldsKept: Object.keys(result.migratedData).length,
                    });
                } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : 'Unknown error';
                    log.error('[VersionMigration] Failed', e);
                    f7.toast.show({ text: `Gagal migrasi: ${msg}`, closeTimeout: 3000, cssClass: 'color-red' });
                } finally {
                    migrating.value = false;
                }
            }
        );
    };

    return {
        migrating,
        handleMigrateVersion
    };
}
