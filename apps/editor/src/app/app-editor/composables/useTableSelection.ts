import { f7 } from 'framework7-vue'; // Helper to access f7 instance if needed, or window.f7
import { computed, ref, type Ref } from 'vue';
// Note: In composables, direct f7 access via import is common in F7-Vue apps, 
// though strictly it might be better to use f7 instance from context. 
// We will use the standard import as in AppEditorPage.

export function useTableSelection(
    appStore: any,
    tableStore: any,
    callbacks: {
        onTableLoaded: (
            id: string,
            name: string,
            fields: any[],
            description: any,
            settings: any,
            layout: any,
            appId: string
        ) => void;
        showNewSourceModal: Ref<boolean>;
        showExcelImportModal: Ref<boolean>;
    }
) {
    // State (Derived from tableStore)
    const currentVersion = computed(() => tableStore.currentVersion?.version);
    const isPublished = computed(() => !!tableStore.currentVersion?.published_at);
    const currentTableId = computed(() => tableStore.currentTable?.id);

    const appTables = computed(() => appStore.currentApp?.tables || []);
    const loadingTables = computed(() => appStore.loading);
    const hasTableSelected = computed(() => !!currentTableId.value);

    // Actions
    async function selectTable(id: string | number) {
        if (String(id) === String(currentTableId.value)) return;

        f7.preloader.show();
        try {
            await tableStore.fetchTable(id);
            const table = tableStore.currentTable;

            let versionToLoad: any = null;

            if (table?.versions && table.versions.length > 0) {
                // Sort desc by version number
                const sortedVersions = [...table.versions].sort((a: any, b: any) => b.version - a.version);
                versionToLoad = sortedVersions[0];
            }

            if (!versionToLoad) {
                const draft = await tableStore.createDraft(id);
                versionToLoad = draft;
            }

            // Sync with store - this is the source of truth
            tableStore.currentVersion = versionToLoad;

            // Trigger callback
            callbacks.onTableLoaded(
                String(table!.id),
                table!.name || 'Untitled',
                versionToLoad.fields || [],
                table!.description,
                versionToLoad.layout?.settings,
                versionToLoad.layout,
                String(table!.app_id || '')
            );

        } catch (e: any) {
            f7.dialog.alert(e.message);
        } finally {
            f7.preloader.hide();
        }
    }


    function createNewTable() {
        callbacks.showNewSourceModal.value = true;
    }

    function handleSourceSelect(type: 'blank' | 'excel') {
        if (type === 'blank') {
            createBlankTable();
        } else if (type === 'excel') {
            callbacks.showExcelImportModal.value = true;
        }
    }

    function createBlankTable() {
        f7.dialog.prompt('New Table Name', async (name) => {
            if (!name) return;
            f7.preloader.show();
            try {
                if (!appStore.currentApp?.id) throw new Error('No app context');
                const newTable = await tableStore.createTable(appStore.currentApp.id, { name });
                await selectTable(newTable.id);
            } catch (e: any) {
                f7.dialog.alert(e.message || 'Failed to create table');
            } finally {
                f7.preloader.hide();
            }
        });
    }

    async function handleExcelImported(payload?: { table_id?: string }) {
        if (appStore.currentApp?.id) {
            try {
                await appStore.fetchApp(appStore.currentApp.id);
                if (payload?.table_id) {
                    setTimeout(() => {
                        selectTable(payload!.table_id!);
                    }, 500);
                }
            } catch (e) {
                console.error('[AppEditor] Import handling error:', e);
            }
        }
    }

    async function doDelete(tableId: string | number, forceCleanup: boolean) {
        f7.preloader.show();
        let conflictError: any = null;
        try {
            await tableStore.deleteTable(tableId, forceCleanup);
            f7.toast.show({ text: 'Table deleted', position: 'center', closeTimeout: 2000 });
            if (appStore.currentApp?.id) {
                await appStore.fetchApp(appStore.currentApp.id);
            }
        } catch (e: any) {
            // Check if Axios error with 409 status
            if (e.response?.status === 409 && e.response?.data?.requires_force_cleanup) {
                conflictError = e.response.data;
            } else {
                f7.dialog.alert(e.message || 'Failed to delete table');
            }
        } finally {
            f7.preloader.hide();
        }

        if (conflictError) {
            setTimeout(() => {
                f7.dialog.confirm(
                    `${conflictError.message}<br><br>Do you want to automatically remove this Data Source from all dependent views and proceed with deletion?`,
                    'Data Source is in Use',
                    () => {
                        doDelete(tableId, true);
                    }
                );
            }, 100);
        }
    }

    function handleDeleteTable(table: any) {
        f7.dialog.prompt(
            `Type the name of the table exactly (<b>${table.name}</b>) to confirm deletion:`,
            'Delete Data Source',
            (typedName) => {
                if (typedName !== table.name) {
                    f7.dialog.alert('Name does not match. Deletion cancelled.');
                    return;
                }
                doDelete(table.id, false);
            }
        );
    }

    return {
        isPublished,
        currentVersion,
        currentTableId,
        appTables,
        loadingTables,
        hasTableSelected,
        selectTable,
        createNewTable,
        createBlankTable,
        handleSourceSelect,
        handleExcelImported,
        handleDeleteTable
    };
}
