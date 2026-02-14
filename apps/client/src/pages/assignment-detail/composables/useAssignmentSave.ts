import { f7 } from 'framework7-vue';
import { ref, type Ref } from 'vue';
import { DashboardRepository } from '../../../app/dashboard/repositories/DashboardRepository';
import { useDatabase } from '../../../common/composables/useDatabase';
import { useLogger } from '../../../common/utils/logger';
import type { FormRendererRef } from './useValidationSummary';

export function useAssignmentSave(
    assignmentId: string,
    formData: Ref<Record<string, unknown>>,
    clearDirty: () => void,
    formRenderer: Ref<FormRendererRef | null>
) {
    const log = useLogger('AssignmentDetail:Save');
    const db = useDatabase();
    const saving = ref(false);

    const saveResponse = async (isDraft: boolean) => {
        try {
            const conn = await db.getDB();
            await DashboardRepository.saveResponse(conn, assignmentId, formData.value, isDraft);
            await db.save();

            saving.value = false;

            if (isDraft) {
                // Re-snapshot after successful save so form becomes clean again
                clearDirty();
                f7.toast.show({ text: 'Draft tersimpan', closeTimeout: 1500, cssClass: 'color-green' });
            }
        } catch (e) {
            log.error('Failed to save response', e);
            saving.value = false;
            if (!isDraft) f7.dialog.alert('Gagal menyimpan', 'Error');
        }
    };

    // Explicit Save Draft (FAB)
    const saveDraft = async () => {
        saving.value = true;
        await saveResponse(true);
    };

    const confirmSubmit = () => {
        saving.value = false;

        // Validate Form Before Submitting
        if (formRenderer.value) {
            const isValid = formRenderer.value.validate();
            if (!isValid) {
                f7.toast.show({
                    text: 'Mohon perbaiki error di form sebelum submit.',
                    closeTimeout: 3000,
                    cssClass: 'color-red',
                    position: 'bottom'
                });
                return;
            }
        }

        f7.dialog.confirm('Apakah Anda yakin ingin menyelesaikan assignment ini?', 'Selesaikan', async () => {
            await saveResponse(false);
            f7.toast.show({ text: 'Assignment Selesai!', closeTimeout: 2000, cssClass: 'color-green' });
            f7.view.main.router.back();
        });
    };

    return {
        saving,
        saveDraft,
        saveResponse,
        confirmSubmit
    };
}
