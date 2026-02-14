import { computed, reactive } from 'vue';
import type {
    EditableFieldDefinition,
    LayoutConfig,
    TableEditorState,
    TableSettings
} from '../../types/editor.types';
import { addEditorIds, stripEditorProps } from './useSchemaTransform';

// ============================================================================
// Defaults
// ============================================================================

const defaultSettings: TableSettings = {
  icon: 'doc_text_search',
  public_access: false,
  allow_comments: false,
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

const editorState = reactive<TableEditorState>({
  tableId: null,
  appId: null,
  tableName: 'Untitled Table',
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

/** Table definition for preview */
const tableForPreview = computed(() => ({
  id: editorState.tableId || 'preview',
  app_id: editorState.appId,
  name: editorState.tableName,
  description: editorState.description,
  fields: editorState.fields.map(stripEditorProps),
  settings: editorState.settings,
  layout: editorState.layout,
}));

/** Check if table has changes */
const hasChanges = computed(() => {
  return JSON.stringify(editorState.fields) !== JSON.stringify(editorState.originalFields);
});

// ============================================================================
// Composable
// ============================================================================

export function useEditorState() {
  /** Update Table Name */
  function updateTableName(name: string): void {
    editorState.tableName = name;
    editorState.isDirty = true;
  }

  /** Update Description */
  function updateDescription(desc: string): void {
    editorState.description = desc;
    editorState.isDirty = true;
  }

  /** Update Table Settings */
  function updateSettings(updates: Partial<TableSettings>): void {
    Object.assign(editorState.settings, updates);
    editorState.isDirty = true;
  }

  /** Update Layout Config */
  function updateLayout(updates: Partial<LayoutConfig>): void {
    // Use Object.assign for in-place mutation (like field operations do).
    // This correctly handles view deletions — if updates.views is provided,
    // it fully replaces editorState.layout.views (no merge with old keys).
    Object.assign(editorState.layout, updates);
    editorState.isDirty = true;
  }

  /** Replace all fields (for Code Editor mode) */
  function replaceAllFields(newFields: EditableFieldDefinition[]): void {
    editorState.fields = newFields;
    editorState.isDirty = true;
  }

  /** Replace entire layout */
  function replaceLayout(newLayout: LayoutConfig): void {
    editorState.layout = JSON.parse(JSON.stringify(newLayout));
    editorState.isDirty = true;
  }

  /** Replace entire settings */
  function replaceSettings(newSettings: TableSettings): void {
    editorState.settings = JSON.parse(JSON.stringify(newSettings));
    editorState.isDirty = true;
  }

  /** Helper to guess icon from name */
  function guessIcon(name: string): string {
      const lower = name.toLowerCase();
      if (lower.includes('user') || lower.includes('pegawai') || lower.includes('staff') || lower.includes('member')) return 'person_2';
      if (lower.includes('product') || lower.includes('item') || lower.includes('barang') || lower.includes('stok')) return 'cart';
      if (lower.includes('order') || lower.includes('pesanan') || lower.includes('transaksi')) return 'doc_text';
      if (lower.includes('event') || lower.includes('calendar') || lower.includes('jadwal') || lower.includes('agenda')) return 'calendar';
      if (lower.includes('location') || lower.includes('place') || lower.includes('lokasi') || lower.includes('tempat')) return 'map';
      if (lower.includes('image') || lower.includes('photo') || lower.includes('foto') || lower.includes('gallery')) return 'photo';
      if (lower.includes('setting') || lower.includes('config') || lower.includes('pengaturan')) return 'gear';
      return 'doc_text_search'; // Default
  }

  /** Initialize editor with new table */
  function initNewTable(): void {
    editorState.tableId = null;
    editorState.tableName = 'Untitled Table';
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

  /** Generate smart defaults for a new table structure */
  function applySmartDefaults(name: string, fields: EditableFieldDefinition[]): void {
      const smartLayout = JSON.parse(JSON.stringify(defaultLayout));

      // 1. Guess icon
      if (editorState.settings) {
          editorState.settings.icon = guessIcon(name);
      }
      
      // 2. Configure Deck View
      if (fields.length > 0 && smartLayout.views.default && smartLayout.views.default.deck) {
          // Primary: First text field that isn't ID or UUID
          const primaryField = fields.find(f => 
              f.type === 'text' && !['id', 'uuid', 'guid'].includes(f.name.toLowerCase())
          ) || fields[0];

          // Secondary: Second text/date/number field
          const secondaryField = fields.find(f => 
              primaryField && f.id !== primaryField.id && 
              (f.type === 'text' || f.type === 'date' || f.type === 'number')
          );

          // Image field
          const imageField = fields.find(f => f.type === 'image' || f.type === 'file');

          smartLayout.views.default.deck.primaryHeaderField = primaryField ? primaryField.name : '';
          smartLayout.views.default.deck.secondaryHeaderField = secondaryField ? secondaryField.name : '';
          
          if (imageField) {
              smartLayout.views.default.deck.imageField = imageField.name;
          }
      }
      
      editorState.layout = smartLayout;
  }

  /** Load table from data */
  function loadTable(
    tableId: string, 
    name: string, 
    fields: Record<string, unknown>[],
    description?: string,
    settings?: TableSettings,
    layout?: LayoutConfig,
    appId?: string
  ): void {
    editorState.isLoading = true;
    
    try {
      // 1. Setup Basic State
      editorState.tableId = tableId;
      editorState.appId = appId || null;
      editorState.tableName = name || 'Untitled Table';
      editorState.description = description || '';

      // 2. Process Fields
      const editableFields = addEditorIds(fields as unknown as EditableFieldDefinition[]);
      editorState.fields = editableFields;
      editorState.originalFields = JSON.parse(JSON.stringify(editableFields));
      
      // 3. Load Settings
      if (layout?.settings) {
         editorState.settings = JSON.parse(JSON.stringify(layout.settings));
      } else if (settings) {
         editorState.settings = JSON.parse(JSON.stringify(settings));
      } else {
         editorState.settings = JSON.parse(JSON.stringify(defaultSettings));
      }
      
      // 4. Load or Generate Layout
      if (layout) {
          editorState.layout = JSON.parse(JSON.stringify(layout));
      } else {
          applySmartDefaults(name, editableFields);
      }

      // 5. Reset Selection
      editorState.selectedFieldPath = null;
      editorState.nestedPath = [];
      editorState.isDirty = false;
      editorState.error = null;
    } finally {
      editorState.isLoading = false;
    }
  }

  return {
    editorState, 
    tableForPreview, // Renamed from schemaForPreview
    hasChanges,
    updateTableName, // Renamed from updateSchemaName
    updateDescription,
    updateSettings,
    updateLayout,
    replaceAllFields,
    replaceLayout,
    replaceSettings,
    initNewTable, // Renamed from initNewSchema
    loadTable // Renamed from loadSchema
  };
}
