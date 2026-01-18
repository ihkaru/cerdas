/**
 * Schema Editor State Management
 * 
 * Central composable for managing schema editor state.
 * Uses Vue's provide/inject pattern for component tree access.
 * 
 * REFACTORED: Now acts as an orchestrator for core modules.
 */

import { readonly, toRefs } from 'vue';
import { useEditorState } from './core/useEditorState';
import { useFieldNavigation } from './core/useFieldNavigation';
import { useFieldOperations } from './core/useFieldOperations';
import { usePreviewState } from './ui/usePreviewState';

export function useSchemaEditor() {
  const { 
    editorState, 
    schemaForPreview, 
    hasChanges,
    initNewSchema,
    loadSchema,
    updateSchemaName,
    updateDescription,
    updateSettings,
    updateLayout
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
    schemaForPreview,
    hasChanges,
    isInNestedForm,
    currentFields,
    breadcrumbs,
    
    // Actions - Editor
    initNewSchema,
    loadSchema,
    updateSchemaName,
    updateDescription,
    updateSettings,
    updateLayout,

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
export const SCHEMA_EDITOR_KEY = Symbol('SchemaEditor');
