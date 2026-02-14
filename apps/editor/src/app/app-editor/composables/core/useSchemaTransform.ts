import { v4 as uuid } from 'uuid';
import type { EditableFieldDefinition, FieldType } from '../../types/editor.types';

/** Generate unique editor ID for field */
export function generateEditorId(): string {
  return `field_${uuid().slice(0, 8)}`;
}

/** Get field by path (e.g., "0" or "2.fields.1") */
export function getFieldByPath(
  fields: EditableFieldDefinition[], 
  path: string
): EditableFieldDefinition | null {
  const parts = path.split('.');
  let current: EditableFieldDefinition[] | EditableFieldDefinition = fields;
  
  for (const part of parts) {
    if (part === 'fields') {
      if (!Array.isArray(current) && 'fields' in current) {
        current = current.fields as EditableFieldDefinition[];
      } else {
        return null;
      }
    } else {
      const index = parseInt(part, 10);
      if (Array.isArray(current) && !isNaN(index) && current[index]) {
        current = current[index];
      } else {
        return null;
      }
    }
  }
  
  return Array.isArray(current) ? null : current;
}

/** Create default field definition */
export function createDefaultField(type: FieldType): EditableFieldDefinition {
  const baseName = `field_${Date.now()}`;
  
  const base: EditableFieldDefinition = {
    _editorId: generateEditorId(),
    name: baseName,
    type,
    label: 'New Field',
  };
  
  // Add type-specific defaults
  switch (type) {
    case 'select':
    case 'radio':
    case 'checkbox':
      base.options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];
      break;
    case 'number':
      base.min = 0;
      break;
    case 'html_block':
      base.content = '<p>Enter your content here</p>';
      break;
    case 'nested_form':
      base.fields = [];
      break;
  }
  
  return base;
}

/** Add editor IDs to fields recursively */
export function addEditorIds(fields: EditableFieldDefinition[] | Record<string, any>): EditableFieldDefinition[] {
  if (!fields) return [];

  let fieldsArray: any[] = [];
  if (Array.isArray(fields)) {
    fieldsArray = fields;
  } else if (typeof fields === 'object') {
     // Handle legacy object format (key = field name)
     fieldsArray = Object.entries(fields).map(([key, value]) => ({
        name: key,
        ...(value as any)
     }));
  }

  return fieldsArray.map(field => {
    const editableField: EditableFieldDefinition = {
      ...field,
      _editorId: field._editorId || generateEditorId(),
    };
    
    if (field.fields && Array.isArray(field.fields)) {
      editableField.fields = addEditorIds(field.fields as EditableFieldDefinition[]);
    }
    
    return editableField;
  });
}

/** Strip editor-specific properties from field */
export function stripEditorProps(field: EditableFieldDefinition): Record<string, unknown> {
  const { _editorId, _collapsed, ...rest } = field;
  
  // Handle nested fields recursively
  if (rest.fields && Array.isArray(rest.fields)) {
    return {
      ...rest,
      fields: (rest.fields as EditableFieldDefinition[]).map(stripEditorProps),
    };
  }
  
  return rest;
}
