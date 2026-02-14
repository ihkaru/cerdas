import { f7 } from 'framework7-vue';
import type { EditableFieldDefinition, LayoutConfig, TableSettings } from '../types/editor.types';

export function useEditorHandlers(
    props: any,
    dependencies: {
        tableStore: any;
        navManagement: any;
        tableEditor: any;
        tableSelection: any;
    }
) {
    const { tableStore, navManagement, tableEditor, tableSelection } = dependencies;

    // Destructure dependencies for easier access
    const { isNavDirty, saveNavigation } = navManagement;
    const { 
        isDirty, 
        state: editorState, 
        tableForPreview, 
        tableName, 
        updateTableName,
        replaceAllFields,
        replaceLayout,
        replaceSettings 
    } = tableEditor;
    const { isPublished, currentVersion, currentTableId } = tableSelection;

    async function handleSave() {
        // 1. Save Navigation if dirty
        if (isNavDirty.value) {
            await saveNavigation();
        }

        // 2. Save Table if dirty
        if (isDirty.value && tableStore.currentVersion) {
            try {
                const tableId = props.f7route.params.id || currentTableId.value;
                if (!tableId) throw new Error('No table selected');

                let version = tableStore.currentVersion.version;
                let createdNewDraft = false;

                // If current version is published, we need to create a new draft first
                if (isPublished.value || tableStore.currentVersion.published_at) {
                    console.log('[handleSave] Current version is published, creating new draft...');
                    f7.toast.show({ text: 'Creating new draft...', position: 'center', closeTimeout: 1000 });

                    const draft = await tableStore.createDraft(tableId);
                    version = draft.version;
                    isPublished.value = false;
                    createdNewDraft = true;

                    console.log('[handleSave] Draft created, version:', version);
                    f7.toast.show({ text: `Draft v${version} created`, position: 'center', closeTimeout: 1000 });
                }

                // Ensure settings are in layout
                const layoutPayload = {
                    ...editorState.layout,
                    settings: editorState.settings
                };

                const fieldsPayload = tableForPreview.value.fields;

                await tableStore.updateVersion(tableId, version, fieldsPayload, layoutPayload);

                // If we created a new draft, reload the table to sync currentVersion in store
                if (createdNewDraft) {
                    console.log('[handleSave] Reloading table to sync currentVersion...');
                    await tableStore.fetchTable(tableId);
                }

                f7.toast.show({ text: 'Table saved', position: 'center', closeTimeout: 2000 });
            } catch (e: any) {
                f7.dialog.alert(e.message || 'Failed to save table');
            }
        }
    }

    async function handlePublish() {
        console.log('[DEBUG] handlePublish called. currentVersion:', tableStore.currentVersion);
        if (!tableStore.currentVersion) {
            console.warn('[DEBUG] handlePublish aborted: currentVersion is null');
            return;
        }
        try {
            f7.dialog.prompt(
                'Tambahkan catatan perubahan (opsional):',
                'Publish Version',
                async (changelog: string) => {
                    await handleSave(); 
                    const pubId = props.f7route.params.id || currentTableId.value;
                    if (!pubId) return;
                    
                    const currentVer = tableStore.currentVersion;
                    if (!currentVer?.version) {
                        f7.dialog.alert('No version to publish');
                        return;
                    }
                    
                    if (currentVer.published_at) {
                        f7.toast.show({ text: 'Already published. No table changes to publish.', position: 'center', closeTimeout: 2000 });
                        return;
                    }
                    await tableStore.publishVersion(pubId, currentVer.version, changelog || undefined);
                    f7.toast.show({ text: `Version ${currentVer.version} published!`, position: 'center', closeTimeout: 2000 });
                    isPublished.value = true;
                    currentVersion.value = currentVer.version;

                    if (pubId) {
                        await tableStore.fetchTable(pubId);
                    }
                },
                () => { },
                ''
            );
        } catch (e: any) {
            f7.dialog.alert(e.message);
        }
    }

    function handleRename() {
        f7.dialog.prompt('Enter table name', tableName.value, (name) => {
            if (name && name.trim()) {
                updateTableName(name.trim());
            }
        });
    }

    function exportTable() {
        const data = JSON.stringify(tableForPreview.value, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tableName.value || 'table'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function handleCodeApply(payload: {
        fields: EditableFieldDefinition[];
        layout: LayoutConfig;
        settings: TableSettings;
    }) {
        replaceAllFields(payload.fields);
        replaceLayout(payload.layout);
        replaceSettings(payload.settings);
    }

    function handleBack() {
        const history = props.f7router.history;
        if (history.length > 1) {
            props.f7router.back();
        } else {
            props.f7router.navigate('/applications', {
                animate: true,
                transition: 'f7-parallax'
            });
        }
    }

    return {
        handleSave,
        handlePublish,
        handleRename,
        exportTable,
        handleCodeApply,
        handleBack
    };
}
