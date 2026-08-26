<template>
    <f7-popup class="trash-modal" :opened="opened" @popup:closed="emit('update:opened', false)">
        <f7-page>
            <f7-navbar>
                <f7-nav-left>
                    <f7-link popup-close>Close</f7-link>
                </f7-nav-left>
                <f7-nav-title>Trash / Deleted Data Sources</f7-nav-title>
                <f7-nav-right>
                    <!-- Refresh btn -->
                    <f7-link icon-f7="arrow_2_circlepath" @click="fetchTrashed"
                        :class="{ 'anim-spin': store.loading }" />
                </f7-nav-right>
            </f7-navbar>

            <f7-block class="text-color-gray text-align-center" v-if="!store.trashedTables?.length && !store.loading">
                <f7-icon f7="trash" size="48" class="margin-bottom-half text-color-lightgray" /><br>
                Trash is empty.<br>
                Soft-deleted data sources will appear here for 30 days before being permanently removed.
            </f7-block>

            <f7-list v-else media-list inset strong>
                <f7-list-item v-for="table in store.trashedTables" :key="table.id" :title="table.name"
                    :subtitle="`Deleted: ${formatDate(table.deleted_at)}`"
                    :text="table.description || 'No description'">
                    <template #media>
                        <f7-icon f7="doc_text_fill" color="red" />
                    </template>
                    <template #root>
                        <f7-swipeout-actions left>
                            <f7-swipeout-button color="green" overswipe
                                @click="restore(table)">Restore</f7-swipeout-button>
                        </f7-swipeout-actions>
                        <f7-swipeout-actions right>
                            <f7-swipeout-button color="red" @click="forceDelete(table.id)">Permanently
                                Delete</f7-swipeout-button>
                        </f7-swipeout-actions>
                    </template>
                </f7-list-item>
            </f7-list>

            <div class="block-footer text-align-center" v-if="store.trashedTables?.length">
                <small>Swipe left to <b>Restore</b>. Swipe right to <b>Permanently Delete</b>.</small>
            </div>
        </f7-page>
    </f7-popup>
</template>

<script setup lang="ts">
import { useTableStore } from '@/stores/table.store';
import { f7 } from 'framework7-vue';
import { watch } from 'vue';

const props = defineProps<{
    opened: boolean;
    appId?: string | number;
}>();

const emit = defineEmits<{
    (e: 'update:opened', value: boolean): void;
}>();

const store = useTableStore();

function fetchTrashed() {
    if (props.appId) {
        store.fetchTrashedTables(props.appId);
    }
}

watch(() => props.opened, (newVal) => {
    if (newVal) {
        fetchTrashed();
    }
});

function formatDate(dateStr?: string) {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

async function restore(table: any) {
    f7.preloader.show();
    try {
        await store.restoreTable(table.id, props.appId!);
        f7.toast.show({ text: 'Data Source Restored', position: 'center', closeTimeout: 2000 });
    } catch (e: any) {
        f7.dialog.alert(e.message || 'Failed to restore data source');
    } finally {
        f7.preloader.hide();
    }
}

function forceDelete(id: string | number) {
    f7.dialog.prompt(
        'This action is IRREVERSIBLE. It will permanently delete this Data Source and all its records and assignments. Type "DELETE" to confirm:',
        'Permanently Delete Data Source?',
        async (val) => {
            const normalized = val?.trim().toUpperCase();
            if (normalized !== 'DELETE' && normalized !== 'EXACTLY DELETE') {
                f7.dialog.alert('Confirmation text did not match. Permanent deletion cancelled.');
                return;
            }
            f7.preloader.show();
            try {
                await store.forceDeleteTable(id, props.appId!);
                f7.toast.show({ text: 'Data Source Permanently Deleted', position: 'center', closeTimeout: 2000 });
            } catch (e: any) {
                f7.dialog.alert(e.message || 'Failed to permanently delete');
            } finally {
                f7.preloader.hide();
            }
        }
    );
}
</script>

<style scoped>
.anim-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    100% {
        transform: rotate(360deg);
    }
}
</style>
