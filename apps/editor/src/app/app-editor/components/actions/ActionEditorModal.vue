<template>
    <f7-popup class="action-editor-modal" :opened="opened" @popup:closed="emit('close')">
        <f7-page>
            <f7-navbar>
                <f7-nav-left>
                    <f7-link popup-close>Cancel</f7-link>
                </f7-nav-left>
                <f7-nav-title>{{ isEditing ? 'Edit Action' : 'New Action' }}</f7-nav-title>
                <f7-nav-right>
                    <f7-link @click="save" :disabled="!isValid">Save</f7-link>
                </f7-nav-right>
            </f7-navbar>

            <f7-block-title>Basic Info</f7-block-title>
            <f7-list inset strong>
                <f7-list-input label="Label" type="text" placeholder="e.g. Approve, Reject" :value="formData.label"
                    @input="formData.label = $event.target.value" clear-button required validate />

                <f7-list-item title="Action Type" smart-select :smart-select-params="{ openIn: 'popover' }">
                    <select :value="formData.type" @change="formData.type = $event.target.value">
                        <option value="custom">Custom (Trigger Workflow)</option>
                        <option value="create">Create Item</option>
                        <option value="edit">Edit Item</option>
                        <option value="delete">Delete Item</option>
                        <option value="open">Open Detail View</option>
                        <option value="sync">Sync Data</option>
                        <option value="export">Export Data</option>
                        <option value="complete">Mark Complete</option>
                    </select>
                </f7-list-item>
            </f7-list>

            <f7-block-title>Appearance</f7-block-title>
            <f7-block strong inset class="no-padding">
                <div class="grid-picker-container">
                    <div class="picker-label">Icon</div>
                    <div class="icon-grid">
                        <button v-for="icon in AVAILABLE_ICONS" :key="icon" type="button" class="icon-btn"
                            :class="{ active: formData.icon === icon }" @click="formData.icon = icon">
                            <f7-icon :f7="icon" />
                        </button>
                    </div>
                </div>

                <div class="grid-picker-container border-top">
                    <div class="picker-label">Color</div>
                    <div class="color-grid">
                        <button v-for="color in AVAILABLE_COLORS" :key="color" type="button" class="color-btn"
                            :class="{ active: formData.color === color }"
                            :style="{ backgroundColor: getColorValue(color) }" @click="formData.color = color">
                            <f7-icon v-if="formData.color === color" f7="checkmark" color="white" size="14" />
                        </button>
                    </div>
                </div>
            </f7-block>

            <f7-block-title>Options</f7-block-title>
            <f7-list inset strong>
                <f7-list-item title="Primary Action" footer="Show as main button (for row actions)">
                    <f7-toggle :checked="formData.primary" @change="formData.primary = $event.target.checked" />
                </f7-list-item>
            </f7-list>
        </f7-page>
    </f7-popup>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ACTION_COLORS, type ActionDefinition } from '../../types/editor.types';

// ============================================================================
// Props & Emits
// ============================================================================

const props = defineProps<{
    opened: boolean;
    action: ActionDefinition | null; // If null, creating new
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'save', action: ActionDefinition): void;
}>();

// ============================================================================
// Constants
// ============================================================================

const AVAILABLE_ICONS = [
    'bolt', 'play', 'stop', 'pause',
    'pencil', 'trash', 'plus', 'minus',
    'checkmark', 'xmark', 'arrow_right', 'arrow_left',
    'arrow_up', 'arrow_down', 'search', 'share',
    'cloud_upload', 'cloud_download', 'envelope', 'phone',
    'camera', 'photo', 'location', 'calendar'
];

const AVAILABLE_COLORS = Object.keys(ACTION_COLORS);

// ============================================================================
// State
// ============================================================================

const defaultAction: ActionDefinition = {
    id: '',
    label: '',
    type: 'custom',
    icon: 'bolt',
    color: 'blue',
    primary: false
};

const formData = ref<ActionDefinition>({ ...defaultAction });

// ============================================================================
// Computed
// ============================================================================

const isEditing = computed(() => !!props.action);

const isValid = computed(() => {
    return formData.value.label && formData.value.label.trim().length > 0;
});

// ============================================================================
// Watchers
// ============================================================================

watch(() => props.opened, (newVal) => {
    if (newVal) {
        if (props.action) {
            formData.value = JSON.parse(JSON.stringify(props.action));
        } else {
            formData.value = { ...defaultAction, id: `action_${Date.now()}` };
        }
    }
});

// ============================================================================
// Methods
// ============================================================================

function getColorValue(colorName: string): string {
    return ACTION_COLORS[colorName] || colorName;
}

function save() {
    if (!isValid.value) return;
    emit('save', { ...formData.value });
    emit('close');
}

</script>

<style scoped>
.grid-picker-container {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.picker-label {
    font-size: 13px;
    color: var(--f7-list-item-footer-text-color);
    font-weight: 500;
}

.icon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 8px;
}

.icon-btn {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
    color: #64748b;
}

.icon-btn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
}

.icon-btn.active {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #3b82f6;
}

.color-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.color-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s;
    position: relative;
}

.color-btn:hover {
    transform: scale(1.1);
}

.color-btn.active {
    border-color: #1e293b;
    transform: scale(1.1);
}

.border-top {
    border-top: 1px solid #e2e8f0;
    padding-top: 16px;
}

.no-padding {
    padding: 0;
}
</style>
