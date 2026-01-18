import { computed, reactive } from 'vue';
import type {
    AppSettings,
    EditableFieldDefinition,
    LayoutConfig,
    SchemaEditorState
} from '../../types/editor.types';
import { addEditorIds, stripEditorProps } from './useSchemaTransform';

// ============================================================================
// Defaults
// ============================================================================

const defaultSettings: AppSettings = {
  icon: 'doc_text_search',
  actions: {
    header: [
      { id: 'create', label: 'Tambah Baru', icon: 'plus', type: 'create' },
      { id: 'sync', label: 'Sync Data', icon: 'arrow_2_circlepath', type: 'sync' }
    ],
    row: [
      { id: 'open', label: 'Buka', icon: 'doc_text', type: 'open', primary: true },
      { id: 'delete', label: 'Hapus', icon: 'trash', type: 'delete', color: 'red' }
    ],
    swipe: {
      left: ['delete'],
      right: ['complete']
    }
  }
};

const defaultLayout: LayoutConfig = {
  type: 'standard',
  app_name: 'Untitled App',
  groupBy: [],
  views: {
    default: {
      type: 'deck',
      title: 'Assignments',
      groupBy: [],
      deck: {
        primaryHeaderField: 'name',
        secondaryHeaderField: 'description',
        imageField: null,
        imageShape: 'square'
      },
      actions: ['open', 'delete']
    }
  }
};

// ============================================================================
// State
// ============================================================================

const editorState = reactive<SchemaEditorState>({
  schemaId: null,
  appId: null,
  schemaName: 'Untitled Schema',
  description: '',
  fields: [],
  originalFields: [],
  settings: JSON.parse(JSON.stringify(defaultSettings)),
  layout: JSON.parse(JSON.stringify(defaultLayout)),
  selectedFieldPath: null,
  nestedPath: [],
  isDirty: false,
  isSaving: false,
  isLoading: false,
  error: null,
});

// ============================================================================
// Computed
// ============================================================================

/** Schema as FormRenderer-compatible format */
const schemaForPreview = computed(() => ({
  id: editorState.schemaId || 'preview',
  app_id: (editorState as any).appId,
  name: editorState.schemaName,
  description: editorState.description,
  fields: editorState.fields.map(stripEditorProps),
  settings: editorState.settings,
}));

/** Check if schema has changes */
const hasChanges = computed(() => {
  return JSON.stringify(editorState.fields) !== JSON.stringify(editorState.originalFields);
});

// ============================================================================
// Composable
// ============================================================================

export function useEditorState() {
  /** Update Schema Name */
  function updateSchemaName(name: string): void {
    editorState.schemaName = name;
    editorState.isDirty = true;
  }

  /** Update Description */
  function updateDescription(desc: string): void {
    editorState.description = desc;
    editorState.isDirty = true;
  }

  /** Update App Settings */
  function updateSettings(updates: Partial<AppSettings>): void {
    Object.assign(editorState.settings, updates);
    editorState.isDirty = true;
  }

  /** Update Layout Config */
  function updateLayout(updates: Partial<LayoutConfig>): void {
    Object.assign(editorState.layout, updates);
    editorState.isDirty = true;
  }

  /** Initialize editor with new schema */
  function initNewSchema(): void {
    editorState.schemaId = null;
    editorState.schemaName = 'Untitled Schema';
    editorState.description = '';
    editorState.fields = [];
    editorState.originalFields = [];
    editorState.settings = JSON.parse(JSON.stringify(defaultSettings));
    editorState.layout = JSON.parse(JSON.stringify(defaultLayout));
    editorState.selectedFieldPath = null;
    editorState.nestedPath = [];
    editorState.isDirty = false;
    editorState.error = null;
  }

  /** Load schema from data */
  function loadSchema(
    schemaId: string, 
    name: string, 
    fields: Record<string, unknown>[],
    description?: string,
    settings?: AppSettings,
    layout?: LayoutConfig,
    appId?: string
  ): void {
    editorState.isLoading = true;
    
    try {
      // Add editor IDs to all fields
      const editableFields = addEditorIds(fields as unknown as EditableFieldDefinition[]);
      
      editorState.schemaId = schemaId;
      (editorState as any).appId = appId || null;
      editorState.schemaName = name || 'Untitled Schema';
      editorState.description = description || '';
      editorState.fields = editableFields;
      editorState.originalFields = JSON.parse(JSON.stringify(editableFields));
      
      if (settings) {
        editorState.settings = JSON.parse(JSON.stringify(settings));
      } else {
        editorState.settings = JSON.parse(JSON.stringify(defaultSettings));
      }
      
      if (layout) {
          editorState.layout = JSON.parse(JSON.stringify(layout));
      } else {
          editorState.layout = JSON.parse(JSON.stringify(defaultLayout));
      }

      editorState.selectedFieldPath = null;
      editorState.nestedPath = [];
      editorState.isDirty = false;
      editorState.error = null;
    } finally {
      editorState.isLoading = false;
    }
  }

  return {
    // We expose the raw reactive state object to internal core modules 
    // but the consuming 'useSchemaEditor' should prefer readonly access.
    // Since we are splitting files, we export the reactive object here for others to use.
    editorState, 
    
    // Computed props
    schemaForPreview,
    hasChanges,

    // Actions
    updateSchemaName,
    updateDescription,
    updateSettings,
    updateLayout,
    initNewSchema,
    loadSchema
  };
}
