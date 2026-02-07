<template>
    <f7-page name="dynamic-view-page">
        <f7-navbar :title="viewTitle" back-link="Back">
        </f7-navbar>

        <div v-if="loading" class="text-align-center padding">
            <f7-preloader></f7-preloader>
        </div>

        <div v-else-if="error" class="block block-strong bg-color-red text-color-white">
            {{ error }}
        </div>

        <ViewRenderer v-else-if="viewConfig && recordData" :config="viewConfig" :data="[recordData]"
            :contextId="contextId" />

        <f7-block v-else class="text-align-center">
            Item not found or Invalid View configuration.
        </f7-block>

    </f7-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useDatabase } from '../common/composables/useDatabase';
import ViewRenderer from '../components/views/ViewRenderer.vue';

const props = defineProps<{
    contextId: string;
    viewName: string;
    recordId: string;
}>();

const db = useDatabase();
const loading = ref(true);
const error = ref('');
const viewConfig = ref<any>(null);
const recordData = ref<any>(null);

const viewTitle = computed(() => viewConfig.value?.title || 'Detail');

onMounted(async () => {
    try {
        loading.value = true;
        const conn = await db.getDB();

        // 1. Get Schema (Table)
        const schemaRes = await conn.query(`SELECT * FROM tables WHERE id = ?`, [props.contextId]);
        let schemaRow = null;
        if (schemaRes.values && schemaRes.values.length > 0) {
            schemaRow = schemaRes.values[0];
        } else {
            throw new Error("Table not found");
        }

        if (!schemaRow) {
            throw new Error("Table not found");
        }

        const layout = typeof schemaRow.layout === 'string' ? JSON.parse(schemaRow.layout) : schemaRow.layout;
        if (!layout) throw new Error("Layout not found in table");

        // 2. Get View Config
        viewConfig.value = layout.views?.[props.viewName];
        if (!viewConfig.value) {
            throw new Error(`View '${props.viewName}' not found in layout`);
        }

        // 3. Get Data (Generic)
        const source = viewConfig.value.source;

        if (source === 'assignments') {
            // In real app, recordId might be uuid or int.
            const assignmentsRes = await conn.query(`SELECT * FROM assignments`);
            const assignments = assignmentsRes.values || [];
            recordData.value = assignments.find((a: any) => a.id == props.recordId || a.local_id == props.recordId);

            // Parse prelist if needed
            if (recordData.value && typeof recordData.value.prelist_data === 'string') {
                try { recordData.value.prelist_data = JSON.parse(recordData.value.prelist_data); } catch { }
            }

        } else if (source === 'responses') {
            // Fetch all responses for now
            const responsesRes = await conn.query(`SELECT * FROM responses`);
            const responses = responsesRes.values || [];
            recordData.value = responses.find((r: any) => r.local_id == props.recordId);

            if (recordData.value && typeof recordData.value.data === 'string') {
                try { recordData.value.data = JSON.parse(recordData.value.data); } catch { }
            }
        }

        if (!recordData.value) {
            console.warn(`Record ${props.recordId} not found in ${source}`);
        }

    } catch (e: any) {
        error.value = e.message;
    } finally {
        loading.value = false;
    }
});
</script>
