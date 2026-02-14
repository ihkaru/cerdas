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

const loadSchema = async (conn: any) => {
    const schemaRes = await conn.query(`SELECT * FROM tables WHERE id = ?`, [props.contextId]);
    if (!schemaRes.values || schemaRes.values.length === 0) {
        throw new Error("Table not found");
    }
    return schemaRes.values[0];
};

const getLayout = (schemaRow: any) => {
    const layout = typeof schemaRow.layout === 'string' ? JSON.parse(schemaRow.layout) : schemaRow.layout;
    if (!layout) throw new Error("Layout not found in table");
    return layout;
};

const fetchData = async (conn: any, source: string) => {
    if (source === 'assignments') {
        const assignmentsRes = await conn.query(`SELECT * FROM assignments`);
        const assignments = assignmentsRes.values || [];
        const record = assignments.find((a: any) => String(a.id) === String(props.recordId) || String(a.local_id) === String(props.recordId));

        if (record && typeof record.prelist_data === 'string') {
            try { record.prelist_data = JSON.parse(record.prelist_data); } catch { /* ignore */ }
        }
        return record;
    }

    if (source === 'responses') {
        const responsesRes = await conn.query(`SELECT * FROM responses`);
        const responses = responsesRes.values || [];
        const record = responses.find((r: any) => String(r.local_id) === String(props.recordId));

        if (record && typeof record.data === 'string') {
            try { record.data = JSON.parse(record.data); } catch { /* ignore */ }
        }
        return record;
    }

    return null;
};

onMounted(async () => {
    try {
        loading.value = true;
        const conn = await db.getDB();

        // 1. Get Schema & layout
        const schemaRow = await loadSchema(conn);
        const layout = getLayout(schemaRow);

        // 2. Get View Config
        viewConfig.value = layout.views?.[props.viewName];
        if (!viewConfig.value) {
            throw new Error(`View '${props.viewName}' not found in layout`);
        }

        // 3. Get Data
        const source = viewConfig.value.source;
        recordData.value = await fetchData(conn, source);

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
