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



            <!-- Schema Reference -->
            <f7-list-item accordion-item title="Available Data (Click to Copy)">
                <f7-icon slot="media" f7="briefcase" size="14" />
                <f7-accordion-content>
                    <div class="schema-list padding-horizontal padding-bottom-half">
                        <div class="schema-hint size-10 text-color-gray margin-vertical-half">
                            Context: <code>data</code> (Row Data), <code>item</code> (Full Object)
                        </div>
                        <!-- Field List -->
                        <div v-for="f in (fields || [])" :key="f.id"
                            class="schema-item display-flex align-items-center padding-vertical-half cursor-pointer"
                            @click="copyToClipboard(`data.${f.name}`)">
                            <f7-icon :f7="getFieldIcon(f.type)" size="14" class="text-color-blue margin-right-half" />
                            <div class="flex-grow-1">
                                <div class="text-color-black size-12 font-weight-bold">{{ f.name }}</div>
                                <div class="text-color-gray size-10">{{ f.label }}</div>
                            </div>
                            <f7-icon f7="doc_on_doc" size="12" class="text-color-gray opacity-50" />
                        </div>
                    </div>
                </f7-accordion-content>
            </f7-list-item>

            <f7-list-item group-title>Marker Styling (Advanced)</f7-list-item>
            <div class="padding-horizontal padding-bottom">
                <CodeEditor :model-value="mapConfig.marker_style_fn || ''" language="javascript" height="120px"
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
import type { MapConfigProps } from '../../../../types/view-config.types';
import FieldPicker from '../../../shared/FieldPicker.vue';

const props = defineProps<MapConfigProps>();

defineEmits<{
    (e: 'update', key: string, value: any): void
}>();

// ============================================================================
// Logic Helpers
// ============================================================================

function getSyntaxError(code: string | undefined): string | null {
    if (!code || !code.trim()) return null;
    try {
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
