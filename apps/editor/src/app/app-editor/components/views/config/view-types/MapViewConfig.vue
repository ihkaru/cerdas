<template>
    <div class="map-config">
        <f7-block-title>Map Configuration</f7-block-title>
        <f7-list inset strong>
            <f7-list-item>
                <template #title>GPS Field</template>
                <template #after>
                    <FieldPicker :model-value="mapConfig.gps_column || null" :fields="fields" :allow-none="false"
                        :filter-types="['gps']" placeholder="Select GPS field..."
                        @update:model-value="$emit('update', 'gps_column', $event)" />
                </template>
            </f7-list-item>
            <f7-list-item>
                <template #title>Label Field</template>
                <template #after>
                    <FieldPicker :model-value="mapConfig.label || null" :fields="fields" :allow-none="true"
                        placeholder="Field for pin label..." @update:model-value="$emit('update', 'label', $event)" />
                </template>
            </f7-list-item>
            <f7-list-item>
                <template #title>Subtitle Field</template>
                <template #after>
                    <FieldPicker :model-value="mapConfig.subtitle || null" :fields="fields" :allow-none="true"
                        placeholder="Field for pin subtitle..."
                        @update:model-value="$emit('update', 'subtitle', $event)" />
                </template>
            </f7-list-item>

            <!-- Schema Reference -->
            <f7-list-item accordion-item title="Available Data (Click to Copy)">
                <f7-icon slot="media" f7="briefcase" size="14" />
                <f7-accordion-content>
                    <div class="schema-list padding-horizontal padding-bottom-half">
                        <!-- Search Bar -->
                        <div class="schema-search margin-bottom-half display-flex align-items-center bg-color-white padding-half border-radius">
                            <f7-icon f7="search" size="14" class="text-color-gray margin-right-half" />
                            <input type="text" v-model="searchQuery" placeholder="Search fields..." 
                                style="border:none; background:transparent; width:100%; font-size:12px; outline:none;" />
                            <f7-icon v-if="searchQuery" f7="xmark_circle_fill" size="14" class="text-color-gray cursor-pointer" 
                                @click="searchQuery = ''" />
                        </div>

                        <div class="schema-hint size-10 text-color-gray margin-bottom-half">
                            Context: <code>data</code> (Row Data), <code>item</code> (Full Object)
                        </div>
                        
                        <!-- Field List -->
                        <div class="fields-container" style="max-height: 200px; overflow-y: auto;">
                            <div v-for="f in filteredFields" :key="f.id"
                                class="schema-item display-flex align-items-center padding-vertical-half cursor-pointer hover:bg-gray-50"
                                @click="copyToClipboard(`data.${f.name}`)">
                                <f7-icon :f7="getFieldIcon(f.type)" size="14" class="text-color-blue margin-right-half" />
                                <div class="flex-grow-1">
                                    <div class="text-color-black size-12 font-weight-bold">{{ f.name }}</div>
                                    <div class="text-color-gray size-10">{{ f.label }}</div>
                                </div>
                                <f7-icon f7="doc_on_doc" size="12" class="text-color-gray opacity-50" />
                            </div>
                            <div v-if="filteredFields.length === 0" class="text-center text-color-gray size-12 padding">
                                No fields found
                            </div>
                        </div>
                    </div>
                </f7-accordion-content>
            </f7-list-item>

            <f7-list-item group-title>Format Rules (Simple)</f7-list-item>
            <f7-block strong outline class="margin-vertical-half no-padding-horizontal">
                <div v-for="(rule, index) in (mapConfig.format_rules || [])" :key="index"
                    class="rule-item padding margin-bottom-half border-bottom">
                    <div class="display-flex align-items-center justify-content-space-between margin-bottom-half">
                        <span class="size-12 font-weight-bold">Rule #{{ index + 1 }}</span>
                        <f7-link color="red" @click="removeRule(index)">
                            <f7-icon f7="trash" size="14" />
                        </f7-link>
                    </div>

                    <div class="display-flex flex-wrap gap-half">
                        <!-- Condition Builder -->
                        <div class="width-100 display-flex align-items-center gap-half margin-bottom-half">
                            <select :value="getRulePart(rule.condition, 0)" class="rule-select flex-grow-1"
                                @change="updateRuleCondition(index, $event.target.value, 0)">
                                <option value="">Select Field...</option>
                                <option v-for="f in fields" :key="f.id" :value="`row.${f.name}`">{{ f.label }}</option>
                            </select>
                            <select :value="getRulePart(rule.condition, 1)" class="rule-select" style="width: 80px;"
                                @change="updateRuleCondition(index, $event.target.value, 1)">
                                <option value="===">==</option>
                                <option value="!==">!=</option>
                                <option value="includes">contains</option>
                            </select>
                            <input type="text" :value="getRulePart(rule.condition, 2)" class="rule-input flex-grow-1"
                                placeholder="Value..." @input="updateRuleCondition(index, $event.target.value, 2)" />
                        </div>

                        <!-- Style Picker -->
                        <div class="width-100 display-flex align-items-center gap-half">
                            <select :value="rule.style?.icon || 'circle'" class="rule-select"
                                @change="updateRuleStyle(index, 'icon', $event.target.value)">
                                <option v-for="icon in markerIcons" :key="icon" :value="icon">{{ icon }}</option>
                            </select>
                            <select :value="rule.style?.color || 'orange'" class="rule-select"
                                @change="updateRuleStyle(index, 'color', $event.target.value)">
                                <option v-for="color in markerColors" :key="color" :value="color">{{ color }}</option>
                            </select>
                            <f7-checkbox :checked="rule.style?.bold"
                                @change="updateRuleStyle(index, 'bold', $event.target.checked)">
                                <span class="size-11 margin-left-half">Bold</span>
                            </f7-checkbox>
                        </div>
                    </div>
                </div>

                <div class="padding">
                    <f7-button small outline @click="addRule">
                        <f7-icon f7="plus" size="14" class="margin-right-half" /> Add Format Rule
                    </f7-button>
                </div>
            </f7-block>

            <f7-list-item group-title>Marker Styling (Advanced)</f7-list-item>
            <div class="padding-horizontal padding-bottom">
                <CodeEditor :model-value="mapConfig.marker_style_fn || ''" language="javascript" height="120px"
                    :schema-fields="fields"
                    placeholder="// return { icon: 'location_fill', color: 'blue' };"
                    @update:model-value="$emit('update', 'marker_style_fn', $event)" />
                <div v-if="getSyntaxError(mapConfig.marker_style_fn)" class="text-color-red size-10 margin-top-half">
                    <f7-icon f7="exclamationmark_triangle_fill" size="10" /> {{
                        getSyntaxError(mapConfig.marker_style_fn) }}
                </div>
            </div>

        </f7-list>
    </div>
</template>

<script setup lang="ts">

import CodeEditor from '@/components/CodeEditor.vue';
import { computed, ref } from 'vue';
import type { MapConfigProps } from '../../../../types/view-config.types';
import FieldPicker from '../../../shared/FieldPicker.vue';

const props = defineProps<MapConfigProps>();

const emit = defineEmits<{
    (e: 'update', key: string, value: any): void
}>();

// ============================================================================
// Format Rules Logic
// ============================================================================

const markerIcons = ['circle', 'pin', 'star', 'flag', 'check'];
const markerColors = ['orange', 'red', 'green', 'blue', 'purple', 'pink', 'yellow', 'teal', 'gray', 'black'];

function addRule() {
    const rules = [...(props.mapConfig.format_rules || [])];
    rules.push({
        condition: '',
        style: { color: 'orange', icon: 'circle', bold: false }
    });
    emit('update', 'format_rules', rules);
}

function removeRule(index: number) {
    const rules = [...(props.mapConfig.format_rules || [])];
    rules.splice(index, 1);
    emit('update', 'format_rules', rules);
}

function updateRuleStyle(index: number, key: string, value: any) {
    const rules = JSON.parse(JSON.stringify(props.mapConfig.format_rules || []));
    if (!rules[index].style) rules[index].style = {};
    rules[index].style[key] = value;
    emit('update', 'format_rules', rules);
}

function updateRuleCondition(index: number, value: string, partIndex: number) {
    const rules = JSON.parse(JSON.stringify(props.mapConfig.format_rules || []));
    const currentCondition = rules[index].condition || 'row.id === ""';
    
    // Simple parser for "row.field OP 'value'" or "row.field.includes('value')"
    let field = getRulePart(currentCondition, 0) || 'row.id';
    let op = getRulePart(currentCondition, 1) || '===';
    let val = getRulePart(currentCondition, 2) || '';

    if (partIndex === 0) field = value;
    if (partIndex === 1) op = value;
    if (partIndex === 2) val = value;

    // Rebuild condition
    if (op === 'includes') {
        rules[index].condition = `${field}.includes('${val}')`;
    } else {
        const formattedVal = isNaN(Number(val)) || val === '' ? `'${val}'` : val;
        rules[index].condition = `${field} ${op} ${formattedVal}`;
    }
    
    emit('update', 'format_rules', rules);
}

function getRulePart(condition: string, partIndex: number): string {
    if (!condition) return '';
    if (condition.includes('.includes(')) {
        if (partIndex === 0) return condition.split('.includes(')[0];
        if (partIndex === 1) return 'includes';
        if (partIndex === 2) return condition.split("'")[1] || '';
    }
    const parts = condition.split(' ');
    if (partIndex === 0) return parts[0] || '';
    if (partIndex === 1) return parts[1] || '';
    if (partIndex === 2) return parts[2]?.replace(/'/g, '') || '';
    return '';
}

// ============================================================================
// Logic Helpers
// ============================================================================

const searchQuery = ref('');

const filteredFields = computed(() => {
    if (!props.fields) return [];
    if (!searchQuery.value) return props.fields;

    const query = searchQuery.value.toLowerCase();
    return props.fields.filter(f => 
        f.name.toLowerCase().includes(query) || 
        f.label.toLowerCase().includes(query)
    );
});

function getSyntaxError(code: string | undefined): string | null {
    if (!code || !code.trim()) return null;
    try {
        // eslint-disable-next-line
        new Function('data', 'item', code);
        return null;
    } catch (e: any) {
        return e.message;
    }
}

import { f7 } from 'framework7-vue';

function copyToClipboard(text: string) {
    // 1. Try Modern API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            if (f7) f7.toast.show({ text: 'Copied!', position: 'center', closeTimeout: 1000 });
        }).catch(err => {
            console.error('Clipboard API failed', err);
            fallbackCopy(text);
        });
    } else {
        // 2. Fallback
        fallbackCopy(text);
    }
}

function fallbackCopy(text: string) {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Ensure it's not visible but part of DOM
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);

    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            if (f7) f7.toast.show({ text: 'Copied!', position: 'center', closeTimeout: 1000 });
        } else {
            console.error('Fallback copy failed.');
            if (f7) f7.toast.show({ text: 'Copy failed', position: 'center', closeTimeout: 1000 });
            // Last resort: prompt
            // window.prompt("Copy to clipboard: Ctrl+C, Enter", text);
        }
    } catch (err) {
        console.error('Fallback copy error', err);
        if (f7) f7.toast.show({ text: 'Copy error', position: 'center', closeTimeout: 1000 });
    }

    document.body.removeChild(textArea);
}

function getFieldIcon(type: string) {
    // Basic mapping, can be improved or imported from constants
    const icons: Record<string, string> = {
        text: 'textformat',
        number: 'number',
        date: 'calendar',
        image: 'photo',
        gps: 'location',
        select: 'list_bullet'
    };
    return icons[type] || 'question';
}
</script>

<style scoped>
.hover\:bg-gray-50:hover {
    background-color: #f9fafb;
}
.schema-search {
    border: 1px solid #e5e7eb;
}

.rule-item {
    background: #fafafa;
}

.rule-select, .rule-input {
    height: 28px;
    padding: 0 4px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 11px;
    background: white;
    outline: none;
}

.rule-select:focus, .rule-input:focus {
    border-color: var(--f7-theme-color);
}

.gap-half {
    gap: 8px;
}
</style>
