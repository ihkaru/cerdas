import { ref, watch } from 'vue';

const STORAGE_KEY = 'cerdas-editor-panel-widths';

function loadWidths() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored) as Record<string, number>;
    } catch { /* ignore */ }
    return {};
}

function saveWidths(widths: Record<string, number>) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
    } catch { /* ignore */ }
}

export function useEditorPanels() {
    const stored = loadWidths();

    // Local State
    const activeTab = ref('schema');

    // Panel Widths (for resizable panels) — persisted in localStorage
    const fieldListWidth = ref(stored.fieldListWidth ?? 350);
    const fieldListBaseWidth = ref(stored.fieldListWidth ?? 350);
    const dataListWidth = ref(stored.dataListWidth ?? 300);
    const dataListBaseWidth = ref(stored.dataListWidth ?? 300);

    // Code Editor panel width
    const codeEditorWidth = ref(stored.codeEditorWidth ?? 600);
    const codeEditorBaseWidth = ref(stored.codeEditorWidth ?? 600);

    // Modals
    const showNewSourceModal = ref(false);
    const showExcelImportModal = ref(false);

    // Persist widths on change (debounced via watch)
    watch([fieldListWidth, dataListWidth, codeEditorWidth], ([fl, dl, ce]) => {
        saveWidths({ fieldListWidth: fl, dataListWidth: dl, codeEditorWidth: ce });
    });

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
