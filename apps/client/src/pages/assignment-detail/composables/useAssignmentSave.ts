import { f7 } from 'framework7-vue';
import { ref, type Ref } from 'vue';
import { DashboardRepository } from '../../../app/dashboard/repositories/DashboardRepository';
import type { Assignment } from '../../../app/dashboard/types';
import { useDatabase } from '../../../common/composables/useDatabase';
import { useLogger } from '../../../common/utils/logger';
import type { FormRendererRef } from './useValidationSummary';

function isValueEmpty(val: unknown): boolean {
    if (val === null || val === undefined || val === '') return true;
    if (Array.isArray(val) && val.length === 0) return true;
    if (typeof val === 'object' && Object.keys(val as object).length === 0) return true;
    return false;
}

export function useAssignmentSave(
    assignmentId: string,
    formData: Ref<Record<string, unknown>>,
    clearDirty: () => void,
    formRenderer: Ref<FormRendererRef | null>,
    assignment?: Ref<Assignment | null>,
    hasExistingDraft?: Ref<boolean>
) {
    const log = useLogger('AssignmentDetail:Save');
    const db = useDatabase();
    const saving = ref(false);

    const saveResponse = async (isDraft: boolean) => {
        try {
            const conn = await db.getDB();

            // Data Scrubbing: Clean hidden field values before saving
            const dataToSave = formRenderer.value?.getScrubbedData
                ? formRenderer.value.getScrubbedData()
                : formData.value;

            await DashboardRepository.saveResponse(conn, assignmentId, dataToSave, isDraft);
            await db.save();

            saving.value = false;

            if (isDraft) {
                // Re-snapshot after successful save so form becomes clean again
                clearDirty();
                if (hasExistingDraft) hasExistingDraft.value = true;
                f7.toast.show({ text: 'Draft tersimpan di perangkat', closeTimeout: 1500, cssClass: 'color-green' });
            }
        } catch (e) {
            log.error('Failed to save response', e);
            saving.value = false;
            if (!isDraft) f7.dialog.alert('Gagal menyimpan', 'Error');
        }
    };

    // Explicit Save Draft
    const saveDraft = async () => {
        saving.value = true;
        await saveResponse(true);
    };

    // Helper: check if form is completely empty
    const isFormCompletelyEmpty = (
        data: Record<string, unknown>,
        prelist: Record<string, unknown> = {}
    ): boolean => {
        return Object.entries(data).every(([key, val]) => {
            if (prelist[key] !== undefined && val === prelist[key]) {
                return true;
            }
            return isValueEmpty(val);
        });
    };

    const confirmSubmit = () => {
        saving.value = false;

        const dataToValidate = formRenderer.value?.getScrubbedData
            ? formRenderer.value.getScrubbedData()
            : formData.value;
        const prelist = (assignment?.value?.prelist_data as Record<string, unknown>) || {};

        // 1. Anti-Empty Form Submission Guard
        if (isFormCompletelyEmpty(dataToValidate, prelist)) {
            f7.dialog.alert(
                'Formulir masih kosong. Mohon isi minimal satu data sebelum dapat menyelesaikan tugas.',
                'Formulir Kosong'
            );
            return;
        }

        // 2. Validate Form Before Submitting
        if (formRenderer.value) {
            const isValid = formRenderer.value.validate();
            if (!isValid) {
                f7.toast.show({
                    text: 'Mohon lengkapi semua isian wajib sebelum menyelesaikan survei.',
                    closeTimeout: 3000,
                    cssClass: 'color-red',
                    position: 'bottom'
                });
                return;
            }
        }

        // 3. Confirm submission
        f7.dialog.confirm(
            'Apakah Anda yakin semua data survei sudah lengkap dan ingin diselesaikan?',
            'Selesaikan Survei',
            async () => {
                await saveResponse(false);
                f7.toast.show({ text: 'Assignment Selesai!', closeTimeout: 2000, cssClass: 'color-green' });
                
                // Background push sync immediately
                try {
                    const { syncService } = await import('../../../common/services/SyncService');
                    syncService.push().catch(err => console.error('[AutoPush] Failed to sync in background:', err));
                } catch (err) {
                    console.error('[AutoPush] Failed to load sync service in background:', err);
                }

                f7.view.main.router.back();
            }
        );
    };

    const discardDraft = () => {
        f7.dialog.confirm(
            'Hapus draft isian lokal dan kembalikan data formulir ke kondisi awal?',
            'Hapus Draft',
            async () => {
                try {
                    const conn = await db.getDB();
                    await conn.run(`DELETE FROM responses WHERE assignment_id = ?`, [assignmentId]);
                    await conn.run(`UPDATE assignments SET status = 'assigned' WHERE (id = ? OR external_id = ?) AND status = 'in_progress'`, [assignmentId, assignmentId]);
                    await db.save();
                    clearDirty();
                    if (hasExistingDraft) hasExistingDraft.value = false;
                    f7.toast.show({ text: 'Draft lokal telah dihapus', closeTimeout: 1500, cssClass: 'color-blue' });
                    f7.view.main.router.back();
                } catch (err) {
                    log.error('Failed to discard draft', err);
                    f7.dialog.alert('Gagal membuang draft', 'Error');
                }
            }
        );
    };

    return {
        saving,
        saveDraft,
        saveResponse,
        confirmSubmit,
        discardDraft
    };
}
