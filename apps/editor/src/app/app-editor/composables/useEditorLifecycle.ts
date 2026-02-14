import { f7ready } from 'framework7-vue';
import { onMounted } from 'vue';

export function useEditorLifecycle(
    props: any,
    dependencies: {
        appStore: any;
        tableStore: any;
        onTableLoaded: (
            id: string,
            name: string,
            fields: any[],
            description: any,
            settings: any,
            layout: any,
            appId: string
        ) => void;
        fetchNavigation: () => Promise<void>;
        initNewTable: () => void;
        setActiveTab: (tab: string) => void;
        selectTable: (id: string | number) => Promise<void>;
        currentVersion: any; // Ref
        isPublished: any; // Ref
    }
) {
    const { 
        appStore, 
        tableStore, 
        onTableLoaded, 
        fetchNavigation, 
        initNewTable, 
        setActiveTab, 
        selectTable,
        currentVersion,
        isPublished
    } = dependencies;

    onMounted(() => {
        const slug = props.f7route.params.slug;
        const tableId = props.f7route.params.id;
        
        f7ready(async (f7Instance) => {
            f7Instance.preloader.show();
            try {
                const targetTableId = tableId;
    
                // Scenario 1: Accessed via App Slug (e.g., /editor/housing-survey)
                if (slug && !targetTableId) {
                    // 1. Fetch App details
                    await appStore.fetchApp(slug);
    
                    const tables = appStore.currentApp?.tables || [];
    
                    // 2. Auto-select if there's only 1 table
                    if (tables.length === 1) {
                        const singleTable = tables[0];
                        await selectTable(singleTable.id);
                        await fetchNavigation();
                        setActiveTab('fields');
                        f7Instance.preloader.hide();
                        return;
                    }
    
                    // 3. Multiple tables or no tables
                    if (tables.length === 0) {
                        initNewTable();
                    }
    
                    await fetchNavigation();
                    setActiveTab('data');
                    f7Instance.preloader.hide();
                    return;
                }
    
                // Scenario 2: Have Table ID
                if (targetTableId) {
                    await tableStore.fetchTable(targetTableId);
                    const draft = await tableStore.createDraft(targetTableId);
    
                    const fieldsData = draft.fields || [];
                    const layoutData = draft.layout;
    
                    // Load table using callback
                    onTableLoaded(
                        String(draft.table_id || draft.id),
                        tableStore.currentTable?.name || 'Untitled',
                        fieldsData,
                        tableStore.currentTable?.description,
                        layoutData?.settings,
                        layoutData,
                        tableStore.currentTable?.app_id || ''
                    );
    
                    isPublished.value = !!draft.published_at;
                    currentVersion.value = draft.version || 1;
    
                    if (tableStore.currentTable?.app_id) {
                        await appStore.fetchApp(tableStore.currentTable.app_id);
                        await fetchNavigation();
                    }
                } else {
                    initNewTable();
                }
    
            } catch (e: any) {
                console.error('[AppEditor] Failed to load:', e);
    
                // Handle 404 - Table was deleted
                if (e?.response?.status === 404 || e?.message?.includes('404')) {
                    f7Instance.toast.create({
                        text: 'Data source sebelumnya tidak ditemukan. Silakan pilih atau buat data source baru.',
                        position: 'center',
                        closeTimeout: 3000,
                    }).open();
    
                    setActiveTab('data');
                    initNewTable();
                } else {
                    f7Instance.dialog.alert(e.message || 'Failed to load editor');
                }
            } finally {
                f7Instance.preloader.hide();
            }
        });
    });
}
