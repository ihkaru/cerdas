import { ref } from 'vue';

export function useEditorPanels() {
    // Local State
    const activeTab = ref('fields');

    // Panel Widths (for resizable panels)
    const fieldListWidth = ref(350);
    const fieldListBaseWidth = ref(350);
    const dataListWidth = ref(300);
    const dataListBaseWidth = ref(300);

    // Code Editor panel width
    const codeEditorWidth = ref(600);
    const codeEditorBaseWidth = ref(600);

    // Modals
    const showNewSourceModal = ref(false);
    const showExcelImportModal = ref(false);

    return {
        activeTab,
        fieldListWidth,
        fieldListBaseWidth,
        dataListWidth,
        dataListBaseWidth,
        codeEditorWidth,
        codeEditorBaseWidth,
        showNewSourceModal,
        showExcelImportModal
    };
}
