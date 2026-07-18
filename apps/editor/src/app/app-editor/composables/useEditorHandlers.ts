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
        isGlobalDirty: { value: boolean };
    }
) {
    const { tableStore, navManagement, tableEditor, tableSelection, appViewManagement, isGlobalDirty } = dependencies;

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
    const { isPublished, currentTableId } = tableSelection;

    async function handleSave() {
        if (!isGlobalDirty.value) return;

        try {
            const tableId = props.f7route.params.id || currentTableId.value;
            if (!tableId) throw new Error('No table selected');

            f7.dialog.preloader('Menyimpan...');

            // 1. Save Navigation if dirty
            if (isNavDirty.value) {
                await saveNavigation();
            }

            // 2. Save App Views if dirty
            if (appViewManagement?.isViewsDirty?.value) {
                await appViewManagement.saveAppViews();
            }

            // 3. Save Table Metadata (Name/Desc) if changed
            const state = editorState as any;
            const metadataChanged = state.tableName !== state.originalName || state.description !== state.originalDescription;
            
            if (metadataChanged) {
                console.log('[handleSave] Saving table metadata...');
                await tableStore.updateTable(tableId, {
                    name: state.tableName,
                    description: state.description
                });
                // Reset original values for dirtiness tracking
                state.originalName = state.tableName;
                state.originalDescription = state.description;
            }

            // 4. Save Table Version if dirty
            // We explicitly check tableStore.currentVersion to ensure we are in a table context
            const activeVersion = tableStore.currentVersion;
            
            if (isDirty.value && activeVersion) {
                let version = activeVersion.version;
                let createdNewDraft = false;

                // If current version is already published on the server, we MUST create a new draft first
                // We check both the local 'isPublished' flag and the version's published_at date
                if (isPublished.value || activeVersion.published_at) {
                    console.log('[handleSave] Current version is published, creating new draft...');
                    const draft = await tableStore.createDraft(tableId);
                    version = draft.version;
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

                // If we created a new draft, refresh the store
                if (createdNewDraft) {
                    await tableStore.fetchTable(tableId);
                }
                
                // Reset original fields/layout for dirtiness tracking
                editorState.originalFields = JSON.parse(JSON.stringify(editorState.fields));
                (editorState as any).originalLayout = JSON.parse(JSON.stringify(editorState.layout));
                (editorState as any).originalSettings = JSON.parse(JSON.stringify(editorState.settings));
            }

            editorState.isDirty = false;
            f7.dialog.close();
            f7.toast.show({ text: 'Semua perubahan disimpan', position: 'center', closeTimeout: 2000 });
        } catch (e: any) {
            f7.dialog.close();
            console.error('[handleSave] Error:', e);
            f7.dialog.alert(e.message || 'Gagal menyimpan perubahan');
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
            f7.dialog.preloader('Publishing...');
            await handleSave();
            const pubId = props.f7route.params.id || currentTableId.value;
            if (!pubId) return;

            const currentVer = tableStore.currentVersion;
            // Verify version is still valid for publishing
            if (!currentVer?.version || currentVer.published_at) {
                f7.dialog.close();
                f7.dialog.alert('Versi ini sudah dipublikasi atau tidak tersedia.');
                return;
            }
            
            await tableStore.publishVersion(pubId, currentVer.version, payload.changelog || undefined, payload.versionPolicy);
            
            // IMPORTANT: After publish, we MUST refresh the table structure 
            // set it's now immutable.
            await tableStore.fetchTable(pubId);

            // Create a new draft version immediately so editor is not locked on a published immutable version
            const newDraft = await tableStore.createDraft(pubId);
            tableStore.currentVersion = newDraft;

            tableEditor.loadTable(
                String(newDraft.table_id || newDraft.id),
                tableStore.currentTable?.name || 'Untitled',
                newDraft.fields || [],
                tableStore.currentTable?.description,
                newDraft.layout?.settings,
                newDraft.layout,
                tableStore.currentTable?.app_id || ''
            );
            
            f7.dialog.close();
            f7.toast.show({ text: `Versi ${currentVer.version} berhasil dipublikasi!`, position: 'center', closeTimeout: 2000 });
            
            // Pivot check: If there is no draft, we might want to stay in "Read Only" view
            // The isPublished computed will now be true for the currentVersion.
        } catch (e: any) {
            f7.dialog.close();
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
        navigation?: any[];
        views?: any;
    }) {
        replaceAllFields(payload.fields);
        replaceLayout(payload.layout);
        replaceSettings(payload.settings);
        if (payload.navigation && navManagement?.fetchNavigation) {
            navManagement.fetchNavigation();
        }
        if (payload.views && appViewManagement?.fetchAppViews) {
            appViewManagement.fetchAppViews();
        }
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
