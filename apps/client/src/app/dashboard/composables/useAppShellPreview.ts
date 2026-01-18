import { ref, type Ref } from 'vue';
import { DashboardRepository } from '../repositories/DashboardRepository';

export function useAppShellPreview(db: any) {
    const previewSheetOpen = ref(false);
    const previewAssignment = ref<any>(null);
    const previewResponseData = ref<Record<string, any>>({});
    
    const showPreview = async (assignment: any, assignmentsRef: Ref<any[]>) => {
        // Find full assignment object if only ID passed, or use passed object
        let target = assignment;
        if (typeof assignment === 'string') {
             target = assignmentsRef.value.find(a => a.id === assignment);
        }

        if (target) {
            previewAssignment.value = target;
            previewSheetOpen.value = true;
            
            // Allow immediate opening, fetch data in background
            try {
                const conn = await db.getDB();
                const response = await DashboardRepository.getResponse(conn, target.id);
                // Ensure we update state for this SPECIFIC assignment to avoid race conditions
                if (previewAssignment.value?.id === target.id) {
                     previewResponseData.value = response || {};
                }
            } catch (e) {
                console.error('Failed to load preview response', e);
                if (previewAssignment.value?.id === target.id) {
                    previewResponseData.value = {};
                }
            }
        }
    };

    return {
        previewSheetOpen,
        previewAssignment,
        previewResponseData,
        showPreview
    };
}
