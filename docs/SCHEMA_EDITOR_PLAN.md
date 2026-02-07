# App Editor - Implementation Plan

> Phase 5: No-Code Form Builder / App Editor

## 1. Architecture Overview

```
apps/editor/src/
├── app/
│   └── app-editor/                        # Feature Module
│       ├── AppEditorPage.vue              # Main page (orchestrator only)
│       ├── TableEditorPage.vue            # Table fields editor
│       ├── components/
│       │   ├── layout/
│       │   │   ├── EditorLayout.vue       # Split panel container
│       │   │   ├── EditorPanel.vue        # Left panel wrapper
│       │   │   └── PreviewPanel.vue       # Right panel wrapper
│       │   ├── field-list/
│       │   │   ├── FieldList.vue          # Sortable field list
│       │   │   ├── FieldListItem.vue      # Single field row
│       │   │   └── FieldListEmpty.vue     # Empty state
│       │   ├── field-config/
│       │   │   ├── FieldConfigPanel.vue   # Config panel container
│       │   │   ├── FieldBasicConfig.vue   # Name, label, type
│       │   │   ├── FieldOptionsConfig.vue # Options for select/radio
│       │   │   ├── FieldLogicConfig.vue   # show_if, required_if, etc.
│       │   │   ├── FieldFormulaConfig.vue # formula_fn editor
│       │   │   └── FieldAdvancedConfig.vue # Other props
│       │   ├── preview/
│       │   │   ├── DeviceFrame.vue        # Mock device frame
│       │   │   └── PreviewToolbar.vue     # Device selector, orientation
│       │   └── shared/
│       │       ├── CodeEditor.vue         # Monaco/simple textarea for closures
│       │       ├── IconPicker.vue         # Icon selector
│       │       └── TypeSelector.vue       # Field type dropdown
│       ├── composables/
│       │   ├── useTableEditor.ts          # Main state management
│       │   ├── useFieldConfig.ts          # Selected field state
│       │   ├── usePreview.ts              # Preview device/orientation
│       │   └── useDragDrop.ts             # Sortable field reordering
│       └── types/
│           └── editor.types.ts            # Editor-specific types
├── common/
│   ├── api/                               # API client (copy from client)
│   ├── stores/                            # Pinia stores
│   └── utils/                             # Logger, helpers
└── pages/
    └── HomePage.vue                       # Dashboard / app list
```

## 2. Terminology Mapping

| User-Facing | Dev-Facing | Database | Description |
|-------------|------------|----------|-------------|
| App | `App` | `apps` | Container project |
| Table | `Table` | `tables` | Data source with field definitions |
| Fields | `fields` | `table_versions.fields` | Field definitions (JSON) |
| View | `View` | `views` | Presentation layer (deck, table, map) |
| Assignment | `Assignment` | `assignments` | Task linked to Table |

## 3. Component Hierarchy

```
AppEditorPage.vue (Page with Tabs)
├── [Tables Tab]
│   └── TableList.vue
├── [Fields Tab] (when Table selected)
│   └── EditorLayout.vue (Split Panel Container)
│       ├── EditorPanel.vue (Left Side)
│       │   ├── FieldList.vue
│       │   │   └── FieldListItem.vue (×N)
│       │   └── FieldConfigPanel.vue (if field selected)
│       │       ├── FieldBasicConfig.vue
│       │       ├── FieldOptionsConfig.vue (if select/radio)
│       │       ├── FieldLogicConfig.vue
│       │       └── FieldAdvancedConfig.vue
│       └── PreviewPanel.vue (Right Side)
│           ├── PreviewToolbar.vue
│           └── DeviceFrame.vue
│               └── FormRenderer (from @cerdas/form-engine)
├── [Views Tab]
│   └── ViewsPanel.vue
├── [Actions Tab]
│   └── ActionsPanel.vue
└── [Settings Tab]
    └── SettingsPanel.vue
```

## 4. State Management

### Central Store: `useTableEditor.ts`

```typescript
interface TableEditorState {
  // Table Data
  tableId: string | null;
  tableName: string;
  appId: string | null;
  
  // Fields (from active TableVersion)
  fields: EditableFieldDefinition[];
  originalFields: EditableFieldDefinition[]; // For dirty check
  
  // UI State
  selectedFieldPath: string | null;
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
  
  // Preview State
  previewDevice: 'phone' | 'tablet';
  previewOrientation: 'portrait' | 'landscape';
  previewData: Record<string, unknown>;
}
```

### Actions

```typescript
// Field CRUD
addField(fieldDef: Partial<FieldDefinition>, afterIndex?: number): void
updateField(path: string, updates: Partial<FieldDefinition>): void
removeField(path: string): void
moveField(fromPath: string, toPath: string): void

// Selection
selectField(path: string): void
clearSelection(): void

// Persistence
loadTable(tableId: string): Promise<void>
saveTable(): Promise<void>
publishTable(): Promise<void>
```

## 5. Implementation Phases

### Phase 5A: Core Structure (Sprint 1)
- [ ] Rename folder `form-editor/` → `app-editor/`
- [ ] Update component names (FormEditorPage → TableEditorPage)
- [ ] Create EditorLayout with responsive split panel
- [ ] Create FieldList with basic display
- [ ] Add FormRenderer preview (readonly)
- [ ] Create useTableEditor composable

### Phase 5B: Field CRUD (Sprint 2)
- [ ] Add Field button + type selector
- [ ] FieldConfigPanel with basic properties
- [ ] Delete field functionality
- [ ] Drag-and-drop reordering (vue-draggable-plus)

### Phase 5C: Field Options (Sprint 3)
- [ ] FieldOptionsConfig for select/radio/checkbox
- [ ] Add/remove options
- [ ] Options from API (options_fn) toggle

### Phase 5D: Logic Editor (Sprint 4)
- [ ] FieldLogicConfig component
- [ ] show_if_fn editor
- [ ] required_if_fn editor
- [ ] CodeEditor component with syntax highlighting

### Phase 5E: Save & Publish (Sprint 5)
- [ ] API integration (save draft, publish)
- [ ] Version management
- [ ] Table validation before publish

## 6. File Creation Order

1. `src/app/app-editor/types/editor.types.ts`
2. `src/app/app-editor/composables/useTableEditor.ts`
3. `src/app/app-editor/components/layout/EditorLayout.vue`
4. `src/app/app-editor/components/field-list/FieldListItem.vue`
5. `src/app/app-editor/components/field-list/FieldList.vue`
6. `src/app/app-editor/components/preview/DeviceFrame.vue`
7. `src/app/app-editor/AppEditorPage.vue`
8. Update `src/routes.ts`

## 7. Success Criteria

- [ ] Split panel works on desktop, tabs on mobile
- [ ] Can add fields of all types
- [ ] Can edit field properties
- [ ] Can reorder fields via drag-and-drop
- [ ] Live preview updates as fields change
- [ ] Can save Table to backend
- [ ] Can handle nested fields (recursive editing)
