/**
 * Table Editor State Management
 * 
 * Central composable for managing table editor state.
 * Uses Vue's provide/inject pattern for component tree access.
 */

import { readonly, toRefs } from 'vue';
import { useEditorState } from './core/useEditorState';
import { useFieldNavigation } from './core/useFieldNavigation';
import { useFieldOperations } from './core/useFieldOperations';
import { usePreviewState } from './ui/usePreviewState';

export function useTableEditor() {
  const { 
    editorState, 
    tableForPreview, 
    hasChanges,
    initNewTable,
    loadTable,
    updateTableName,
    updateDescription,
    updateSettings,
    updateLayout,
    replaceAllFields,
    replaceLayout,
    replaceSettings
  } = useEditorState();

  const {
    previewState,
    setPreviewDevice,
    setPreviewOrientation,
    updatePreviewData
  } = usePreviewState();

  const {
    selectedField,
    isInNestedForm,
    currentFields,
    breadcrumbs,
    drillInto,
    drillUp,
    drillToPath,
    selectField,
    clearSelection
  } = useFieldNavigation();

  const {
    addField,
    addFieldAtCurrentLevel,
    updateField,
    removeField,
    moveField,
    reorderFields,
    reorderFieldsAtCurrentLevel,
    duplicateField
  } = useFieldOperations();

  return {
    // State (readonly to prevent direct mutation)
    state: readonly(editorState),
    previewState: readonly(previewState),
    
    // Refs for template binding
    ...toRefs(editorState),
    
    // Computed
    selectedField,
    tableForPreview, // Renamed from schemaForPreview
    hasChanges,
    isInNestedForm,
    currentFields,
    breadcrumbs,
    
    // Actions - Editor
    initNewTable, // Renamed
    loadTable, // Renamed
    updateTableName, // Renamed
    updateDescription,
    updateSettings,
    updateLayout,
    replaceAllFields,
    replaceLayout,
    replaceSettings,

    // Actions - Fields
    addField,
    updateField,
    removeField,
    moveField,
    reorderFields,
    duplicateField,
    selectField,
    clearSelection,
    
    // Nested Navigation
    drillInto,
    drillUp,
    drillToPath,
    addFieldAtCurrentLevel,
    reorderFieldsAtCurrentLevel,
    
    // Preview Actions
    setPreviewDevice,
    setPreviewOrientation,
    updatePreviewData,
  };
}

// Provide/Inject key
export const TABLE_EDITOR_KEY = Symbol('TableEditor');
