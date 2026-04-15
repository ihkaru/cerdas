<template>
    <f7-list inset class="config-section">
        <f7-list-item accordion-item title="Advanced Logic">
            <f7-icon slot="media" f7="bolt" />
            <f7-accordion-content>
                <f7-list>
                    <!-- Schema Reference -->
                    <div class="padding-horizontal padding-vertical-half bg-color-white">
                        <f7-accordion-item>
                            <div slot="title" class="size-12 text-color-gray flex-row align-items-center">
                                <f7-icon f7="briefcase" size="14" class="margin-right-half" />
                                <strong>Available Data (Click to Copy)</strong>
                            </div>
                            <f7-accordion-content>
                                <div class="schema-list margin-top-half">
                                    <div class="schema-hint size-10 text-color-gray margin-bottom-half">
                                        Context: <code>ctx.row</code> (Current Form), <code>ctx.user</code>
                                    </div>
                                    <!-- Field List -->
                                    <div v-for="f in (allFields || [])" :key="f.id"
                                        class="schema-item display-flex align-items-center padding-vertical-half cursor-pointer"
                                        @click="copyToClipboard(`ctx.row.${f.name}`)">
                                        <f7-icon :f7="getFieldIcon(f.type)" size="14"
                                            class="text-color-blue margin-right-half" />
                                        <div class="flex-grow-1">
                                            <div class="text-color-black size-12 font-weight-bold">{{ f.name }}
                                            </div>
                                            <div class="text-color-gray size-10">{{ f.label }}</div>
                                        </div>
                                        <f7-icon f7="doc_on_doc" size="12" class="text-color-gray opacity-50" />
                                    </div>
                                    <!-- System Contexts -->
                                    <div class="schema-item display-flex align-items-center padding-vertical-half cursor-pointer"
                                        @click="copyToClipboard('ctx.user.email')">
                                        <f7-icon f7="person_circle" size="14"
                                            class="text-color-purple margin-right-half" />
                                        <div class="flex-grow-1">
                                            <div class="text-color-black size-12 font-weight-bold">ctx.user
                                            </div>
                                            <div class="text-color-gray size-10">User Info</div>
                                        </div>
                                        <f7-icon f7="doc_on_doc" size="12" class="text-color-gray opacity-50" />
                                    </div>
                                </div>
                            </f7-accordion-content>
                        </f7-accordion-item>
                    </div>

                    <div class="logic-editor-group">
                        <div class="logic-label">Show If (JS)</div>
                        <CodeEditor :model-value="field.show_if_fn || ''" language="javascript" height="100px"
                            placeholder="return ctx.row.other_field === 'value';"
                            @update:model-value="emit('update', { show_if_fn: $event })" />
                        <div v-if="getSyntaxError(field.show_if_fn)" class="text-color-red size-10 margin-top-half">
                            <f7-icon f7="exclamationmark_triangle_fill" size="10" /> {{
                                getSyntaxError(field.show_if_fn) }}
                        </div>
                    </div>

                    <div class="logic-editor-group">
                        <div class="logic-label">Required If (JS)</div>
                        <CodeEditor :model-value="field.required_if_fn || ''" language="javascript" height="100px"
                            placeholder="return ctx.row.other_field !== '';"
                            @update:model-value="emit('update', { required_if_fn: $event })" />
                        <div v-if="getSyntaxError(field.required_if_fn)" class="text-color-red size-10 margin-top-half">
                            <f7-icon f7="exclamationmark_triangle_fill" size="10" /> {{
                                getSyntaxError(field.required_if_fn)
                            }}
                        </div>
                    </div>

                    <div class="logic-editor-group">
                        <div class="logic-label-row">
                            <div class="logic-label">Editable If (JS)</div>
                            <!-- Status badge when sentinel is active -->
                            <div v-if="isReadonlySentinel" class="readonly-badge">
                                <f7-icon f7="lock_fill" size="10" />
                                Always Read-only
                            </div>
                        </div>
                        <!-- Readonly sentinel banner -->
                        <div v-if="isReadonlySentinel" class="sentinel-banner">
                            <f7-icon f7="info_circle_fill" size="14" class="banner-icon" />
                            <div class="banner-text">
                                This field is set to <strong>always read-only</strong> via the Display toggle.
                                Edit the code below to add conditional logic instead.
                            </div>
                        </div>
                        <CodeEditor :model-value="field.editable_if_fn || ''" language="javascript" height="100px"
                            placeholder="return ctx.user.role === 'admin';"
                            @update:model-value="emit('update', { editable_if_fn: $event })" />
                        <div v-if="getSyntaxError(field.editable_if_fn)" class="text-color-red size-10 margin-top-half">
                            <f7-icon f7="exclamationmark_triangle_fill" size="10" /> {{
                                getSyntaxError(field.editable_if_fn)
                            }}
                        </div>
                    </div>

                    <div class="logic-editor-group">
                        <div class="logic-label">Formula (JS)</div>
                        <CodeEditor :model-value="field.formula_fn || ''" language="javascript" height="100px"
                            placeholder="return ctx.row.a + ctx.row.b;"
                            @update:model-value="emit('update', { formula_fn: $event })" />
                        <div v-if="getSyntaxError(field.formula_fn)" class="text-color-red size-10 margin-top-half">
                            <f7-icon f7="exclamationmark_triangle_fill" size="10" /> {{
                                getSyntaxError(field.formula_fn) }}
                        </div>
                    </div>

                    <div class="logic-editor-group">
                        <div class="logic-label">Warning (JS)</div>
                        <CodeEditor :model-value="field.warning_fn || ''" language="javascript" height="100px"
                            placeholder="if (value < 0) return 'Value should be positive';"
                            @update:model-value="emit('update', { warning_fn: $event })" />
                        <div v-if="getSyntaxError(field.warning_fn)" class="text-color-red size-10 margin-top-half">
                            <f7-icon f7="exclamationmark_triangle_fill" size="10" /> {{
                                getSyntaxError(field.warning_fn) }}
                        </div>
                    </div>

                    <div v-if="hasOptions" class="logic-editor-group">
                        <div class="logic-label">Dynamic Options (JS)</div>
                        <CodeEditor :model-value="field.options_fn || ''" language="javascript" height="100px"
                            placeholder="return ctx.maps.cities[ctx.row.province] || [];"
                            @update:model-value="emit('update', { options_fn: $event })" />
                        <div v-if="getSyntaxError(field.options_fn)" class="text-color-red size-10 margin-top-half">
                            <f7-icon f7="exclamationmark_triangle_fill" size="10" /> {{
                                getSyntaxError(field.options_fn) }}
                        </div>
                    </div>

                    <div class="logic-editor-group">
                        <div class="logic-label">Initial Value (JS)</div>
                        <CodeEditor :model-value="field.initial_value_fn || ''" language="javascript" height="100px"
                            placeholder="return new Date().toISOString();"
                            @update:model-value="emit('update', { initial_value_fn: $event })" />
                        <div v-if="getSyntaxError(field.initial_value_fn)"
                            class="text-color-red size-10 margin-top-half">
                            <f7-icon f7="exclamationmark_triangle_fill" size="10" /> {{
                                getSyntaxError(field.initial_value_fn) }}
                        </div>
                    </div>
                </f7-list>
            </f7-accordion-content>
        </f7-list-item>
    </f7-list>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CodeEditor from '@/components/CodeEditor.vue';
import type { EditableFieldDefinition } from '../../../types/editor.types';

const READONLY_SENTINEL = 'return false;';

const props = defineProps<{
    field: EditableFieldDefinition;
    allFields?: EditableFieldDefinition[];
    hasOptions: boolean;
    getSyntaxError: (code: string | undefined) => string | null;
    copyToClipboard: (text: string) => void;
    getFieldIcon: (type: string) => string;
}>();

const emit = defineEmits<{
    (e: 'update', updates: Partial<EditableFieldDefinition>): void;
}>();

/** Detect if the simple read-only toggle is active */
const isReadonlySentinel = computed(() =>
    (props.field.editable_if_fn ?? '').trim() === READONLY_SENTINEL
);
</script>

<style scoped>
.config-section {
    margin: 8px 12px;
    --f7-list-margin-vertical: 0;
    --f7-list-inset-border-radius: 10px;
}

.logic-editor-group {
    padding: 12px 14px 16px 14px;
    border-bottom: 1px solid #f1f5f9;
}

.logic-editor-group:last-child {
    border-bottom: none;
}

.logic-label-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.logic-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--editor-text-secondary, #64748b);
    letter-spacing: 0.5px;
    /* Remove margin-bottom — now controlled by parent .logic-label-row */
}

/* Keep original single-label logic sections working */
.logic-editor-group > .logic-label:first-child {
    margin-bottom: 8px;
}

.readonly-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(255, 59, 48, 0.1);
    color: #ff3b30;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 10px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

.sentinel-banner {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: #fff8f8;
    border: 1px solid rgba(255, 59, 48, 0.2);
    border-radius: 6px;
    padding: 8px 10px;
    margin-bottom: 8px;
}

.banner-icon {
    color: #ff3b30;
    flex-shrink: 0;
    margin-top: 1px;
}

.banner-text {
    font-size: 12px;
    color: #555;
    line-height: 1.5;
}

.schema-item {
    border-bottom: 1px solid #f1f5f9;
    padding: 6px 8px;
    border-radius: 4px;
    transition: background 0.1s;
}

.schema-item:hover {
    background: #f8fafc;
}

.schema-item:last-child {
    border-bottom: none;
}
</style>
