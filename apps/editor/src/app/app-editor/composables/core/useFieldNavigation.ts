import { computed } from 'vue';
import type { EditableFieldDefinition } from '../../types/editor.types';
import { useEditorState } from './useEditorState';
import { getFieldByPath } from './useSchemaTransform';

export function useFieldNavigation() {
  const { editorState } = useEditorState();

  // ============================================================================
  // Computed
  // ============================================================================

  /** Get currently selected field */
  const selectedField = computed<EditableFieldDefinition | null>(() => {
    if (!editorState.selectedFieldPath) return null;
    return getFieldByPath(editorState.fields, editorState.selectedFieldPath);
  });

  /** Check if we're currently editing inside a nested form */
  const isInNestedForm = computed(() => editorState.nestedPath.length > 0);

  /** Get the fields at the current drill-down level */
  const currentFields = computed<EditableFieldDefinition[]>(() => {
    if (editorState.nestedPath.length === 0) {
      return editorState.fields;
    }
    
    // Navigate through the nested path to find current fields
    let fields: EditableFieldDefinition[] = editorState.fields;
    for (const segment of editorState.nestedPath) {
      const parentField = fields[segment.index];
      if (parentField && Array.isArray(parentField.fields)) {
        fields = parentField.fields as EditableFieldDefinition[];
      } else {
        return []; // Path is invalid
      }
    }
    return fields;
  });

  /** Get breadcrumbs for navigation */
  const breadcrumbs = computed(() => {
    const crumbs = [{ label: 'Main Form', path: [] as { index: number; name: string }[] }];
    
    let currentPath: { index: number; name: string }[] = [];
    for (const segment of editorState.nestedPath) {
      currentPath = [...currentPath, segment];
      crumbs.push({
        label: segment.name,
        path: [...currentPath]
      });
    }
    
    return crumbs;
  });

  // ============================================================================
  // Actions
  // ============================================================================

  /** Drill into a nested form field */
  function drillInto(index: number): void {
    const fields = currentFields.value;
    const field = fields[index];
    
    if (field && field.type === 'nested_form') {
      // Ensure the field has a fields array
      if (!Array.isArray(field.fields)) {
        field.fields = [];
      }
      
      editorState.nestedPath.push({
        index,
        name: field.label || field.name || 'Nested Form'
      });
      
      // Clear selection when drilling in
      editorState.selectedFieldPath = null;
    }
  }

  /** Go up one level */
  function drillUp(): void {
    if (editorState.nestedPath.length > 0) {
      editorState.nestedPath.pop();
      editorState.selectedFieldPath = null;
    }
  }

  /** Navigate to a specific path (for breadcrumb clicks) */
  function drillToPath(path: { index: number; name: string }[]): void {
    editorState.nestedPath = [...path];
    editorState.selectedFieldPath = null;
  }

  /** Select a field */
  function selectField(path: string | null): void {
    editorState.selectedFieldPath = path;
  }

  /** Clear selection */
  function clearSelection(): void {
    editorState.selectedFieldPath = null;
  }

  return {
    selectedField,
    isInNestedForm,
    currentFields,
    breadcrumbs,
    
    drillInto,
    drillUp,
    drillToPath,
    selectField,
    clearSelection
  };
}
