# Schema Editor - Implementation Plan

> Phase 5: No-Code Form Builder / Schema Editor

## 1. Architecture Overview

```
apps/editor/src/
├── app/
│   └── schema-editor/                    # Feature Module
│       ├── SchemaEditorPage.vue          # Main page (orchestrator only)
│       ├── components/
│       │   ├── layout/
│       │   │   ├── EditorLayout.vue      # Split panel container
│       │   │   ├── EditorPanel.vue       # Left panel wrapper
│       │   │   └── PreviewPanel.vue      # Right panel wrapper
│       │   ├── field-list/
│       │   │   ├── FieldList.vue         # Sortable field list
│       │   │   ├── FieldListItem.vue     # Single field row
│       │   │   └── FieldListEmpty.vue    # Empty state
│       │   ├── field-config/
│       │   │   ├── FieldConfigPanel.vue  # Config panel container
│       │   │   ├── FieldBasicConfig.vue  # Name, label, type
│       │   │   ├── FieldOptionsConfig.vue # Options for select/radio
│       │   │   ├── FieldLogicConfig.vue  # show_if, required_if, etc.
│       │   │   ├── FieldFormulaConfig.vue # formula_fn editor
│       │   │   └── FieldAdvancedConfig.vue # Other props
│       │   ├── preview/
│       │   │   ├── DeviceFrame.vue       # Mock device frame
│       │   │   └── PreviewToolbar.vue    # Device selector, orientation
│       │   └── shared/
│       │       ├── CodeEditor.vue        # Monaco/simple textarea for closures
│       │       ├── IconPicker.vue        # Icon selector
│       │       └── TypeSelector.vue      # Field type dropdown
│       ├── composables/
│       │   ├── useSchemaEditor.ts        # Main state management
│       │   ├── useFieldConfig.ts         # Selected field state
│       │   ├── usePreview.ts             # Preview device/orientation
│       │   └── useDragDrop.ts            # Sortable field reordering
│       └── types/
│           └── editor.types.ts           # Editor-specific types
├── common/
│   ├── api/                              # API client (copy from client)
│   ├── stores/                           # Pinia stores
│   └── utils/                            # Logger, helpers
└── pages/
    └── HomePage.vue                      # Dashboard / schema list
```

## 2. Component Hierarchy

```
SchemaEditorPage.vue (Page)
└── EditorLayout.vue (Split Panel Container)
    ├── EditorPanel.vue (Left Side)
    │   ├── FieldList.vue
    │   │   └── FieldListItem.vue (×N)
    │   └── FieldConfigPanel.vue (if field selected)
    │       ├── FieldBasicConfig.vue
    │       ├── FieldOptionsConfig.vue (if select/radio)
    │       ├── FieldLogicConfig.vue
    │       └── FieldAdvancedConfig.vue
    │
    └── PreviewPanel.vue (Right Side)
        ├── PreviewToolbar.vue
        └── DeviceFrame.vue
            └── FormRenderer (from @cerdas/form-engine)
```

## 3. State Management

### Central Store: `useSchemaEditor.ts`
```typescript
interface SchemaEditorState {
  // Schema Data
  schemaId: string | null;
  schema: AppSchemaDefinition;
  originalSchema: AppSchemaDefinition; // For dirty check
  
  // UI State
  selectedFieldPath: string | null; // e.g., "fields.0" or "fields.2.fields.1"
  isDirty: boolean;
  isSaving: boolean;
  
  // Preview State
  previewDevice: 'phone' | 'tablet';
  previewOrientation: 'portrait' | 'landscape';
  previewData: Record<string, any>;
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
loadSchema(schemaId: string): Promise<void>
saveSchema(): Promise<void>
publishSchema(): Promise<void>
```

## 4. Implementation Phases

### Phase 5A: Core Structure (Sprint 1)
- [ ] Create folder structure
- [ ] Create EditorLayout with responsive split panel
- [ ] Create FieldList with basic display
- [ ] Create FieldListItem with type icon
- [ ] Add FormRenderer preview (readonly)
- [ ] Create useSchemaEditor composable

### Phase 5B: Field CRUD (Sprint 2)
- [ ] Add Field button + type selector
- [ ] FieldConfigPanel with basic properties
- [ ] FieldBasicConfig (name, label, type, required)
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
- [ ] editable_if_fn editor
- [ ] CodeEditor component with syntax highlighting

### Phase 5E: Formula & Advanced (Sprint 5)
- [ ] FieldFormulaConfig (formula_fn)
- [ ] FieldAdvancedConfig (warning_fn, hint, placeholder)
- [ ] Nested form editor (recursive FieldList)

### Phase 5F: Save & Publish (Sprint 6)
- [ ] API integration (save draft, publish)
- [ ] Version management
- [ ] Schema validation before publish

## 5. Component Specs

### EditorLayout.vue
**Purpose**: Responsive container that switches between split (desktop) and tabs (mobile)

```vue
<template>
  <div class="editor-layout" :class="{ 'split-mode': !isMobile }">
    <template v-if="isMobile">
      <f7-toolbar tabbar>
        <f7-link tab-link="#editor" tab-link-active>Editor</f7-link>
        <f7-link tab-link="#preview">Preview</f7-link>
      </f7-toolbar>
      <f7-tabs>
        <f7-tab id="editor" tab-active><slot name="editor" /></f7-tab>
        <f7-tab id="preview"><slot name="preview" /></f7-tab>
      </f7-tabs>
    </template>
    <template v-else>
      <div class="editor-pane"><slot name="editor" /></div>
      <div class="preview-pane"><slot name="preview" /></div>
    </template>
  </div>
</template>
```

### FieldListItem.vue
**Purpose**: Single row in field list with icon, name, and actions

**Props**:
- `field: FieldDefinition`
- `selected: boolean`
- `depth: number` (for nested fields indentation)

**Emits**:
- `select`
- `delete`
- `duplicate`

### FieldConfigPanel.vue
**Purpose**: Right sidebar (or inline accordion on mobile) for editing selected field

**Structure**: Accordion with sections:
1. Basic (always open)
2. Options (if applicable)
3. Logic (collapsible)
4. Advanced (collapsible)

### DeviceFrame.vue
**Purpose**: Mock phone/tablet frame around FormRenderer

**Props**:
- `device: 'phone' | 'tablet'`
- `orientation: 'portrait' | 'landscape'`

## 6. State Flow Diagram

```
                    ┌─────────────────────┐
                    │   SchemaEditorPage  │
                    │   (provide state)   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
      ┌───────────┐    ┌────────────┐    ┌───────────┐
      │ FieldList │    │FieldConfig │    │  Preview  │
      │  (reads)  │    │  (writes)  │    │  (reads)  │
      └─────┬─────┘    └─────┬──────┘    └─────┬─────┘
            │                │                  │
            ▼                ▼                  ▼
      ┌─────────────────────────────────────────────┐
      │           useSchemaEditor (store)           │
      │  - schema: reactive                         │
      │  - selectedFieldPath                        │
      │  - previewDevice                            │
      └─────────────────────────────────────────────┘
```

## 7. File Creation Order

1. `src/app/schema-editor/types/editor.types.ts`
2. `src/app/schema-editor/composables/useSchemaEditor.ts`
3. `src/app/schema-editor/components/layout/EditorLayout.vue`
4. `src/app/schema-editor/components/field-list/FieldListItem.vue`
5. `src/app/schema-editor/components/field-list/FieldList.vue`
6. `src/app/schema-editor/components/preview/DeviceFrame.vue`
7. `src/app/schema-editor/components/preview/PreviewToolbar.vue`
8. `src/app/schema-editor/SchemaEditorPage.vue`
9. Update `src/routes.ts`

## 8. Dependencies to Add

```json
{
  "dependencies": {
    "@cerdas/form-engine": "workspace:^",
    "vue-draggable-plus": "^0.6.0"
  }
}
```

## 9. Success Criteria

- [ ] Split panel works on desktop, tabs on mobile
- [ ] Can add fields of all types
- [ ] Can edit field properties
- [ ] Can reorder fields via drag-and-drop
- [ ] Live preview updates as schema changes
- [ ] Can save schema to backend
- [ ] Can handle nested forms (recursive editing)
