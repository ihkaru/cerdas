import type { EditableFieldDefinition, FieldType } from '../../types/editor.types';
import { useEditorState } from './useEditorState';
import { useFieldNavigation } from './useFieldNavigation';
import { createDefaultField, generateEditorId, getFieldByPath } from './useSchemaTransform';

export function useFieldOperations() {
  const { editorState } = useEditorState();
  const { currentFields } = useFieldNavigation();

  /** Add a new field */
  function addField(type: FieldType, afterIndex?: number): void {
    const newField = createDefaultField(type);
    
    if (afterIndex !== undefined && afterIndex >= 0) {
      editorState.fields.splice(afterIndex + 1, 0, newField);
    } else {
      editorState.fields.push(newField);
    }
    
    editorState.isDirty = true;
    
    // Select the new field (approximate path, assumes top level used)
    const newIndex = afterIndex !== undefined ? afterIndex + 1 : editorState.fields.length - 1;
    editorState.selectedFieldPath = String(newIndex);
  }

  /** Add field at current nested level */
  function addFieldAtCurrentLevel(type: FieldType, afterIndex?: number): void {
    const newField = createDefaultField(type);
    const fields = currentFields.value;
    
    if (afterIndex !== undefined && afterIndex >= 0) {
      fields.splice(afterIndex + 1, 0, newField);
    } else {
      fields.push(newField);
    }
    
    editorState.isDirty = true;
    
    // Select the new field
    const newIndex = afterIndex !== undefined ? afterIndex + 1 : fields.length - 1;
    editorState.selectedFieldPath = String(newIndex);
  }

  /** Update field by path */
  function updateField(path: string, updates: Partial<EditableFieldDefinition>): void {
    const field = getFieldByPath(editorState.fields, path);
    if (field) {
      Object.assign(field, updates);
      editorState.isDirty = true;
    }
  }

  /** Remove field by path */
  function removeField(path: string): void {
    const parts = path.split('.');
    const lastPart = parts[parts.length - 1];
    if (lastPart === undefined) return;
    const index = parseInt(lastPart, 10);
    
    if (parts.length === 1) {
      // Top-level field
      editorState.fields.splice(index, 1);
    } else {
      // Nested field - find parent
      const parentPath = parts.slice(0, -2).join('.');
      const parent = getFieldByPath(editorState.fields, parentPath);
      if (parent && parent.fields) {
        (parent.fields as EditableFieldDefinition[]).splice(index, 1);
      }
    }
    
    // Clear selection if deleted field was selected
    if (editorState.selectedFieldPath === path) {
      editorState.selectedFieldPath = null;
    }
    
    editorState.isDirty = true;
  }

  /** Move field (for drag-drop) - Top Level Only or generic? Previous impl was top level array splicing on editorState.fields */
  function moveField(fromIndex: number, toIndex: number): void {
    const [removed] = editorState.fields.splice(fromIndex, 1);
    
    if (removed) {
      editorState.fields.splice(toIndex, 0, removed);
      editorState.isDirty = true;
      
      // Update selection if needed
      if (editorState.selectedFieldPath === String(fromIndex)) {
        editorState.selectedFieldPath = String(toIndex);
      }
    }
  }

  /** Reorder fields (replace entire array - for vuedraggable) */
  function reorderFields(newFields: EditableFieldDefinition[]): void {
    editorState.fields = newFields;
    editorState.isDirty = true;
  }

  /** Reorder fields at current nested level */
  function reorderFieldsAtCurrentLevel(newFields: EditableFieldDefinition[]): void {
    if (editorState.nestedPath.length === 0) {
      editorState.fields = newFields;
    } else {
      // Navigate to parent and update its fields
      let parent: EditableFieldDefinition | null = null;
      let parentFields = editorState.fields;
      
      for (let i = 0; i < editorState.nestedPath.length; i++) {
        const segment = editorState.nestedPath[i];
        if (!segment) break;

        parent = parentFields[segment.index] || null;
        if (i < editorState.nestedPath.length - 1 && parent && Array.isArray(parent.fields)) {
          parentFields = parent.fields as EditableFieldDefinition[];
        }
      }
      
      if (parent) {
        parent.fields = newFields;
      }
    }
    editorState.isDirty = true;
  }

  /** Duplicate field */
  function duplicateField(path: string): void {
    const field = getFieldByPath(editorState.fields, path);
    if (!field) return;
    
    const duplicate: EditableFieldDefinition = {
      ...JSON.parse(JSON.stringify(field)),
      _editorId: generateEditorId(),
      name: `${field.name}_copy`,
    };
    
    const parts = path.split('.');
    const lastPart = parts[parts.length - 1];
    if (lastPart === undefined) return;
    const index = parseInt(lastPart, 10);
    
    if (parts.length === 1) {
      editorState.fields.splice(index + 1, 0, duplicate);
    }
    
    editorState.isDirty = true;
  }

  return {
    addField,
    addFieldAtCurrentLevel,
    updateField,
    removeField,
    moveField,
    reorderFields,
    reorderFieldsAtCurrentLevel,
    duplicateField
  };
}
