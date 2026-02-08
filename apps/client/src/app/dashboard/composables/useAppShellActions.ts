import { useDatabase } from '@/common/composables/useDatabase';
import { f7 } from 'framework7-vue';
import type { Ref } from 'vue';
import { isRef } from 'vue';
import { DashboardRepository } from '../repositories/DashboardRepository';

export function useAppShellActions(contextId: string | Ref<string>, refreshCallback: (full?: boolean) => Promise<void>) {
    const db = useDatabase();
    
    // Helper to resolve contextId whether it's a string or Ref
    const getContextId = () => isRef(contextId) ? contextId.value : contextId;

    const deleteAssignment = async (assignmentId: string) => {
        try {
            const conn = await db.getDB();
            await conn.run(`DELETE FROM assignments WHERE id = ?`, [assignmentId]);
            await conn.run(`DELETE FROM responses WHERE assignment_id = ?`, [assignmentId]);
            await db.save(); 
            await refreshCallback(true);
            f7.toast.show({ text: 'Assignment dihapus', closeTimeout: 2000 });
        } catch (e: any) {
            f7.dialog.alert('Gagal menghapus: ' + e.message, 'Error');
        }
    };

    const completeAssignment = async (assignmentId: string) => {
        try {
            const conn = await db.getDB();
            // Use saveResponse to ensure a response record is created (triggers sync & banner)
            // We verify if response exists first? DashboardRepository handles upsert.
            // We pass empty data or a marker
            await DashboardRepository.saveResponse(conn, assignmentId, { _meta: 'marked_complete_via_list' }, false);
            await db.save();
            await refreshCallback(true);
            f7.toast.show({ text: 'Ditandai selesai', closeTimeout: 2000, cssClass: 'color-green' });
        } catch (e: any) {
            f7.dialog.alert('Gagal: ' + e.message, 'Error');
        }
    };

    const createAssignment = async () => {
        try {
            const conn = await db.getDB();
            const newId = await DashboardRepository.createLocalAssignment(conn, getContextId());
            await db.save();
            await refreshCallback(true);
            return newId;
        } catch (e: any) {
            throw e;
        }
    };

    return {
        deleteAssignment,
        completeAssignment,
        createAssignment
    };
}
