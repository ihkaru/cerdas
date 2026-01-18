import { useFormStore } from '@/stores';
import { f7 } from 'framework7-vue';

export function useFormDialog() {
    const formStore = useFormStore();

    function showCreateFormDialog(appId: number | string, onSuccess: (formId: string | number) => void) {
        f7.dialog.prompt('Enter form name', 'New Form', async (name) => {
            if (name && name.trim()) {
                try {
                    const newForm = await formStore.createForm(Number(appId), {
                        name: name.trim()
                    });
                    f7.toast.show({ text: 'Form created', position: 'center', closeTimeout: 2000 });
                    
                    if (onSuccess) {
                        onSuccess(newForm.id);
                    }
                } catch (e: any) {
                    f7.dialog.alert(e.message || 'Failed to create form');
                }
            }
        });
    }

    return {
        showCreateFormDialog
    };
}
