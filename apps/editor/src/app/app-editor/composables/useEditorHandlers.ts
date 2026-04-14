import { f7 } from 'framework7-vue';
import type { EditableFieldDefinition, LayoutConfig, TableSettings } from '../types/editor.types';

export function useEditorHandlers(
    props: any,
    dependencies: {
        tableStore: any;
        navManagement: any;
        tableEditor: any;
        tableSelection: any;
        appViewManagement?: any;
    }
) {
    const { tableStore, navManagement, tableEditor, tableSelection, appViewManagement } = dependencies;

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

        // 2. Save App Views if dirty
        if (appViewManagement?.isViewsDirty?.value) {
            await appViewManagement.saveAppViews();
        }

        // 3. Save Table if dirty
        // We explicitly check tableStore.currentVersion to ensure we are in a table context
        const activeVersion = tableStore.currentVersion;
        
        if (isDirty.value && activeVersion) {
            try {
                const tableId = props.f7route.params.id || currentTableId.value;
                if (!tableId) throw new Error('No table selected');

                let version = activeVersion.version;
                let createdNewDraft = false;

                // If current version is published, we need to create a new draft first
                if (isPublished.value || activeVersion.published_at) {
                    console.log('[handleSave] Current version is published, creating new draft...');
                    f7.toast.show({ text: 'Creating new draft...', position: 'center', closeTimeout: 1000 });

                    const draft = await tableStore.createDraft(tableId);
                    version = draft.version;
                    // isPublished is now computed, so it will update automatically when store.currentVersion changes
                    createdNewDraft = true;

                    console.log('[handleSave] Draft created, version:', version);
                }

                // Ensure settings are in layout
                const layoutPayload = {
                    ...editorState.layout,
                    settings: editorState.settings
                };

                const fieldsPayload = tableForPreview.value.fields;

                await tableStore.updateVersion(tableId, version, fieldsPayload, layoutPayload);

                // If we created a new draft, we need to make sure the store knows it's the current one
                // fetchTable might be needed to refresh the sidebar list, but currentVersion is already updated by createDraft
                if (createdNewDraft) {
                    await tableStore.fetchTable(tableId);
                }

                f7.toast.show({ text: 'Table saved', position: 'center', closeTimeout: 2000 });
            } catch (e: any) {
                console.error('[handleSave] Error:', e);
                f7.dialog.alert(e.message || 'Failed to save table');
            }
        }
    }

    async function handlePublish() {
        const activeVersion = tableStore.currentVersion;
        console.log('[DEBUG] handlePublish: activeVersion from store:', activeVersion);
        
        // If no table version (e.g. App context), just save.
        if (!activeVersion) {
            console.warn('[DEBUG] handlePublish: No active table version found. Saving App configuration instead.');
            await handleSave();
            f7.toast.show({ text: 'App configuration saved', position: 'center', closeTimeout: 2000 });
            return;
        }
        
        return { action: 'show-publish-dialog' };
    }
        

    async function confirmPublish(payload: { changelog: string; versionPolicy: string }) {
        try {
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
            await tableStore.publishVersion(pubId, currentVer.version, payload.changelog || undefined, payload.versionPolicy);
            f7.toast.show({ text: `Version ${currentVer.version} published!`, position: 'center', closeTimeout: 2000 });
            isPublished.value = true;
            currentVersion.value = currentVer.version;

            if (pubId) {
                await tableStore.fetchTable(pubId);
            }
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

    function handleBack(isDirtyGlobal?: boolean) {
        const history = props.f7router.history;
        const performBack = () => {
            if (history.length > 1) {
                props.f7router.back();
            } else {
                props.f7router.navigate('/applications', {
                    animate: true,
                    transition: 'f7-parallax'
                });
            }
        };

        if (isDirtyGlobal) {
            f7.dialog.create({
                title: 'Perubahan Belum Disimpan',
                text: 'Anda memiliki perubahan yang belum disimpan. Apa yang ingin Anda lakukan?',
                buttons: [
                    {
                        text: 'Simpan & Keluar',
                        bold: true,
                        onClick: async () => {
                            f7.dialog.preloader('Menyimpan...');
                            await handleSave();
                            f7.dialog.close();
                            performBack();
                        }
                    },
                    {
                        text: 'Buang Perubahan',
                        color: 'red',
                        onClick: () => {
                            performBack();
                        }
                    },
                    {
                        text: 'Batal',
                        onClick: () => {}
                    }
                ],
                verticalButtons: true
            }).open();
        } else {
            performBack();
        }
    }

    return {
        handleSave,
        handlePublish,
        confirmPublish,
        handleRename,
        exportTable,
        handleCodeApply,
        handleBack
    };
}
