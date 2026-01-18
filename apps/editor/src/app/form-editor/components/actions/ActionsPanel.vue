<template>
    <div class="actions-panel">
        <f7-block-title>Header Actions (App Level)</f7-block-title>
        <f7-list inset strong sortable @sortable:sort="onSortHeaderActions">
            <f7-list-item v-for="action in headerActions" :key="action.id" :title="action.label" :footer="action.type"
                link="#" @click="editAction('header', action)">
                <f7-icon slot="media" :f7="action.icon" :color="action.color" />
                <f7-link slot="after" icon-f7="trash" color="red" @click.stop="removeAction('header', action.id)" />
            </f7-list-item>
            <f7-list-button @click="addAction('header')">
                <f7-icon f7="plus" />
                Add Header Action
            </f7-list-button>
        </f7-list>

        <f7-block-title>Row Actions (Per-Item)</f7-block-title>
        <f7-list inset strong sortable @sortable:sort="onSortRowActions">
            <f7-list-item v-for="action in rowActions" :key="action.id" :title="action.label"
                :footer="action.type + (action.primary ? ' (primary)' : '')" link="#"
                @click="editAction('row', action)">
                <f7-icon slot="media" :f7="action.icon" :color="action.color" />
                <f7-link slot="after" icon-f7="trash" color="red" @click.stop="removeAction('row', action.id)" />
            </f7-list-item>
            <f7-list-button @click="addAction('row')">
                <f7-icon f7="plus" />
                Add Row Action
            </f7-list-button>
        </f7-list>

        <f7-block-title>Swipe Actions</f7-block-title>
        <f7-list inset strong>
            <f7-list-item title="Swipe Left" smart-select :smart-select-params="{ openIn: 'popover' }">
                <select name="swipeLeft" :value="swipeActions.left[0] || ''" @change="updateSwipeLeft">
                    <option value="">None</option>
                    <option v-for="action in rowActions" :key="action.id" :value="action.id">
                        {{ action.label }}
                    </option>
                </select>
            </f7-list-item>
            <f7-list-item title="Swipe Right" smart-select :smart-select-params="{ openIn: 'popover' }">
                <select name="swipeRight" :value="swipeActions.right[0] || ''" @change="updateSwipeRight">
                    <option value="">None</option>
                    <option v-for="action in rowActions" :key="action.id" :value="action.id">
                        {{ action.label }}
                    </option>
                </select>
            </f7-list-item>
        </f7-list>

        <!-- Action Types Reference -->
        <f7-block-title>Available Action Types</f7-block-title>
        <f7-block class="action-types-info">
            <div class="action-type">
                <f7-chip text="create" color="blue" />
                <span>Create new item</span>
            </div>
            <div class="action-type">
                <f7-chip text="sync" color="teal" />
                <span>Sync with server</span>
            </div>
            <div class="action-type">
                <f7-chip text="open" color="gray" />
                <span>Open/view item</span>
            </div>
            <div class="action-type">
                <f7-chip text="edit" color="orange" />
                <span>Edit item</span>
            </div>
            <div class="action-type">
                <f7-chip text="delete" color="red" />
                <span>Delete item</span>
            </div>
            <div class="action-type">
                <f7-chip text="complete" color="green" />
                <span>Mark as complete</span>
            </div>
            <div class="action-type">
                <f7-chip text="export" color="purple" />
                <span>Export data</span>
            </div>
        </f7-block>
    </div>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import { computed } from 'vue';
import { useSchemaEditor } from '../../composables/useSchemaEditor';
import type { ActionDefinition } from '../../types/editor.types';

// ============================================================================
// State from Composable
// ============================================================================

const { settings, updateSettings } = useSchemaEditor();

const headerActions = computed(() => settings.value.actions.header);
const rowActions = computed(() => settings.value.actions.row);
const swipeActions = computed(() => settings.value.actions.swipe);

// ============================================================================
// Methods
// ============================================================================

function addAction(category: 'header' | 'row') {
    f7.dialog.prompt('Enter action label', 'New Action', (label) => {
        if (!label || !label.trim()) return;

        const id = `action_${Date.now()}`;
        const newAction: ActionDefinition = {
            id,
            label: label.trim(),
            icon: 'bolt',
            type: 'custom',
        };

        const currentActions = category === 'header' ? [...headerActions.value] : [...rowActions.value];
        currentActions.push(newAction);

        updateSettings({
            actions: {
                ...settings.value.actions,
                [category]: currentActions
            }
        });
    });
}

function editAction(_category: 'header' | 'row', action: ActionDefinition) {
    f7.toast.show({
        text: `Editing action: ${action.label} (coming soon)`,
        position: 'center',
        closeTimeout: 2000
    });
}

function removeAction(category: 'header' | 'row', actionId: string) {
    f7.dialog.confirm(
        'Are you sure you want to remove this action?',
        'Remove Action',
        () => {
            const currentActions = category === 'header' ? [...headerActions.value] : [...rowActions.value];
            const filtered = currentActions.filter(a => a.id !== actionId);

            updateSettings({
                actions: {
                    ...settings.value.actions,
                    [category]: filtered
                }
            });
        }
    );
}

function onSortHeaderActions(event: any) {
    const { from, to } = event; // F7 sort event detail
    const current = [...headerActions.value];
    const item = current.splice(from, 1)[0];
    if (item) {
        current.splice(to, 0, item);
        updateSettings({
            actions: {
                ...settings.value.actions,
                header: current
            }
        });
    }
}

function onSortRowActions(event: any) {
    const { from, to } = event;
    const current = [...rowActions.value];
    const item = current.splice(from, 1)[0];
    if (item) {
        current.splice(to, 0, item);
        updateSettings({
            actions: {
                ...settings.value.actions,
                row: current
            }
        });
    }
}

function updateSwipeLeft(event: Event) {
    const select = event.target as HTMLSelectElement;
    updateSettings({
        actions: {
            ...settings.value.actions,
            swipe: {
                ...settings.value.actions.swipe,
                left: select.value ? [select.value] : []
            }
        }
    });
}

function updateSwipeRight(event: Event) {
    const select = event.target as HTMLSelectElement;
    updateSettings({
        actions: {
            ...settings.value.actions,
            swipe: {
                ...settings.value.actions.swipe,
                right: select.value ? [select.value] : []
            }
        }
    });
}
</script>

<style scoped>
.actions-panel {
    padding-bottom: 24px;
}

.action-types-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.action-type {
    display: flex;
    align-items: center;
    gap: 12px;
}

.action-type span {
    font-size: 13px;
    color: var(--f7-list-item-subtitle-text-color);
}
</style>
