<template>
    <div class="code-editor-wrapper" :style="{ height: height }">
        <div class="toolbar">
            <div class="lang-badge">{{ language }}</div>
            <div class="toolbar-actions">
                <button class="format-btn" @click="formatCode" title="Format Code">
                    <f7-icon f7="text_align_left" size="14" />
                    Format
                </button>
                <button class="expand-btn" @click="expandEditor" title="Expand">
                    <f7-icon f7="arrow_up_left_arrow_down_right" size="14" />
                </button>
            </div>
        </div>
        <codemirror v-model="code" :placeholder="placeholder" :style="{ height: 'calc(100% - 30px)' }"
            :autofocus="autofocus" :indent-with-tab="true" :tab-size="2" :extensions="extensions"
            @ready="handleReady" />

        <!-- Expanded Editor Popup -->
        <f7-popup v-model:opened="isExpanded" class="code-editor-popup" push @popup:opened="onPopupOpened"
            @popup:closed="onPopupClosed">
            <f7-page>
                <f7-navbar :title="label || 'Code Editor'">
                    <f7-nav-right>
                        <f7-link popup-close>Done</f7-link>
                    </f7-nav-right>
                </f7-navbar>
                <div class="expanded-editor-container">
                    <codemirror v-if="renderExpanded" v-model="code" :placeholder="placeholder"
                        :style="{ height: '100%', fontSize: '14px' }" :indent-with-tab="true" :tab-size="2"
                        :extensions="extensions" />
                </div>
            </f7-page>
        </f7-popup>
    </div>
</template>

<script setup lang="ts">
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import {
    f7Icon,
    f7Link,
    f7Navbar,
    f7NavRight,
    f7Page,
    f7Popup
} from 'framework7-vue';
import { computed, ref, shallowRef, watch } from 'vue';
import { Codemirror } from 'vue-codemirror';

const props = defineProps<{
    modelValue?: string;
    language?: 'javascript' | 'html' | 'json';
    placeholder?: string;
    height?: string;
    autofocus?: boolean;
    dark?: boolean;
    label?: string;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
    (e: 'ready', payload: { view: EditorView }): void;
}>();

const code = ref(props.modelValue || '');
const isExpanded = ref(false);
const renderExpanded = ref(false);

watch(() => props.modelValue, (newVal) => {
    if (newVal !== code.value) {
        code.value = newVal || '';
    }
});

watch(code, (newVal) => {
    emit('update:modelValue', newVal);
});

function expandEditor() {
    isExpanded.value = true;
    // We delay rendering strictly to @popup:opened
}

function onPopupOpened() {
    console.log('[CodeEditor] Popup opened. Model value length:', code.value?.length);
    renderExpanded.value = true;
}

function onPopupClosed() {
    renderExpanded.value = false;
}

const extensions = computed(() => {
    const exts = [];

    // Language support
    if (props.language === 'html') {
        exts.push(html());
    } else {
        // Default to JS/JSON
        exts.push(javascript());
    }

    // Theme
    if (props.dark) {
        exts.push(oneDark);
    }

    // Additional editor tweaks could go here (line numbers are on by default in basicSetup of vue-codemirror usually)
    return exts;
});

// Store view instance if needed
const view = shallowRef<EditorView>();
const handleReady = (payload: { view: EditorView }) => {
    view.value = payload.view;
    emit('ready', payload);
};

// Formatting logic
async function formatCode() {
    if (!code.value.trim()) return;

    try {
        const prettier = await import('prettier/standalone');
        const parserBabel = await import('prettier/plugins/babel');
        const parserHtml = await import('prettier/plugins/html');
        const parserEstree = await import('prettier/plugins/estree');

        let formatted = '';

        if (props.language === 'html') {
            formatted = await prettier.format(code.value, {
                parser: 'html',
                plugins: [parserHtml.default],
                printWidth: 80,
                tabWidth: 2,
            });
        } else {
            // Logic snippet handling
            // We wrap it in a function to ensure 'return' statements are valid
            const wrapperStart = 'async function _editor_wrapper() {\n';
            const wrapperEnd = '\n}';

            // Check if it looks like an object/expression or statements
            const wrappedCode = wrapperStart + code.value + wrapperEnd;

            const rawFormatted = await prettier.format(wrappedCode, {
                parser: 'babel',
                plugins: [parserBabel.default, parserEstree.default],
                printWidth: 80,
                tabWidth: 2,
                semi: true,
            });

            // Unwrap
            // Remove the function wrapper lines
            const lines = rawFormatted.split('\n');
            // Remove first line (function decl) and last line (closing brace)
            // Adjust indentation
            if (lines.length > 2) {
                formatted = lines.slice(1, -2).join('\n')
                    // Simple unindent (remove 2 spaces)
                    .replace(/^  /gm, '');
            } else {
                formatted = rawFormatted; // Fallback
            }
        }

        code.value = formatted.trim();
    } catch (e) {
        console.error('Formatting failed', e);
        // Fallback or alert user? For now just silent fail or console
    }
}
</script>

<style scoped>
.code-editor-wrapper {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
    font-size: 13px;
    background: white;
    display: flex;
    flex-direction: column;
}

.toolbar {
    height: 30px;
    background: #f1f5f9;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
}

.toolbar-actions {
    display: flex;
    gap: 8px;
}

.lang-badge {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
}

.format-btn,
.expand-btn {
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 6px;
    border-radius: 4px;
    transition: background 0.2s;
}

.format-btn:hover,
.expand-btn:hover {
    background: #e2e8f0;
    color: #2563eb;
}

/* Ensure codemirror takes full height */
:deep(.cm-editor) {
    height: 100%;
}

:deep(.cm-scroller) {
    font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
}

.expanded-editor-container {
    position: absolute;
    top: 56px;
    /* standard navbar height, or use calc(var(--f7-navbar-height) + safe-area) */
    left: 0;
    right: 0;
    bottom: 0;
    background: white;
    z-index: 10;
}
</style>
