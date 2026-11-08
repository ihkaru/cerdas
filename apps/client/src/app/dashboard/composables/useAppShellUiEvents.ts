import { f7 } from 'framework7-vue';
import { ref, type ComputedRef, type Ref } from 'vue';

export interface UiEventContext {
    f7router?: any;
    currentGroupLevel: Ref<number>;
    routeViewId: ComputedRef<string | undefined>;
    pendingUploadCount: Ref<number>;
    navigateUp: () => boolean;
    createAssignment: () => Promise<string>;
    deleteAssignment: (id: string) => Promise<void>;
    completeAssignment: (id: string) => Promise<void>;
    syncApp: () => Promise<void>;
    loadApp: (force?: boolean) => Promise<void>;
    db: any;
}

export function useAppShellUiEvents(ctx: UiEventContext) {
    const actionsSheetOpen = ref(false);

    const handleBackNav = () => {
        const handled = ctx.navigateUp();
        if (!handled) {
            const router = ctx.f7router || f7.views.main?.router;
            if (ctx.currentGroupLevel.value === 0) {
                router?.navigate('/', { clearPreviousHistory: true, force: true, transition: 'f7-push-back' });
                return;
            }
            if (ctx.routeViewId.value) {
                router?.navigate(router.currentRoute.path.split('?')[0], { reloadCurrent: true });
                return;
            }
            router?.navigate('/', { clearPreviousHistory: true, force: true, transition: 'f7-push-back' });
        }
    };

    const openAssignment = (id: string) => {
        const router = f7.views.main?.router || ctx.f7router;
        if (router) {
            router.navigate(`/assignments/${id}`);
        } else {
            f7.dialog.alert('Navigation Error: Router not found.', 'Error');
        }
    };

    const executeAction = (action: any) => {
        actionsSheetOpen.value = false;
        switch (action.type) {
            case 'create':
                f7.dialog.confirm('Create new assignment?', 'New', async () => {
                    f7.dialog.preloader('Creating...');
                    try {
                        const newId = await ctx.createAssignment();
                        f7.dialog.close();
                        openAssignment(newId);
                    } catch (e: any) {
                        f7.dialog.close();
                        f7.dialog.alert(e.message, 'Error');
                    }
                });
                break;
            case 'sync':
                ctx.syncApp();
                break;
            case 'reset':
                f7.dialog.confirm(
                    'Are you sure you want to delete all local data and reset the database? This cannot be undone.',
                    'Reset Data',
                    async () => {
                        f7.dialog.preloader('Resetting...');
                        try {
                            await ctx.db.reset?.();
                            f7.dialog.close();
                            window.location.reload();
                        } catch (e: unknown) {
                            f7.dialog.close();
                            f7.dialog.alert('Reset failed: ' + (e instanceof Error ? e.message : String(e)), 'Error');
                        }
                    }
                );
                break;
            default:
                f7.toast.show({ text: 'Not implemented', closeTimeout: 1000 });
        }
    };

    const handleRowAction = async ({ actionId, assignmentId }: { actionId: string; assignmentId: string }) => {
        switch (actionId) {
            case 'open':
            case 'edit':
                openAssignment(assignmentId);
                break;
            case 'delete':
                f7.dialog.confirm('Hapus?', 'Konfirmasi', () => ctx.deleteAssignment(assignmentId));
                break;
            case 'complete':
                ctx.completeAssignment(assignmentId);
                break;
            default:
                f7.toast.show({ text: 'Not implemented', closeTimeout: 1000 });
        }
    };

    const handleBannerSync = () => {
        f7.dialog.confirm(
            `Terdapat ${ctx.pendingUploadCount.value} data yang akan dikirim ke server. Kirim data sekarang?`,
            'Sinkronisasi ke Server',
            () => { ctx.syncApp(); }
        );
    };

    const refresh = async (done: () => void) => {
        try {
            await ctx.syncApp();
        } catch (e) {
            console.warn('Sync on refresh failed', e);
        }
        await ctx.loadApp(true);
        done();
    };

    return {
        actionsSheetOpen,
        handleBackNav,
        openAssignment,
        executeAction,
        handleRowAction,
        handleBannerSync,
        refresh
    };
}
