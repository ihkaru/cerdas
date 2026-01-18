<template>
    <div class="form-view">
        <div v-if="loading" class="text-align-center padding-top">
            <f7-preloader />
        </div>
        <div v-else-if="error" class="block block-strong bg-color-red text-color-white">
            {{ error }}
        </div>

        <FormRenderer v-else-if="schema" :schema="schema" :initial-data="formData" :context="formContext"
            @update:data="handleUpdate" class="padding-bottom" />

        <f7-block v-if="!loading && schema">
            <f7-button fill large @click="saveResponse(false)">Save & Finish</f7-button>
        </f7-block>
    </div>
</template>

<script setup lang="ts">
import { FormRenderer, type AppSchema } from '@cerdas/form-engine';
import { f7 } from 'framework7-vue';
import { computed, onMounted, ref } from 'vue';
import { useDatabase } from '../../common/composables/useDatabase';
import { useAuthStore } from '../../common/stores/authStore';

const props = defineProps<{
    config: any;
    data: any[]; // Expecting single item logic
    schemaId: string;
}>();

const emit = defineEmits(['action']);

const db = useDatabase();
const authStore = useAuthStore();
const loading = ref(true);
const error = ref<string | null>(null);
const schema = ref<AppSchema | null>(null);
const formData = ref<Record<string, any>>({});
const record = ref<any>(null);

const formContext = computed(() => ({
    user: authStore.user || {},
    // assignments/responses might need more context like 'assignment' object itself
    assignment: record.value,
    schemaId: props.schemaId
}));

// Initialize
onMounted(async () => {
    if (props.data && props.data.length > 0) {
        record.value = props.data[0];

        // Parse data if it's string (likely if from responses)
        if (typeof record.value.data === 'string') {
            try { formData.value = JSON.parse(record.value.data); } catch { }
        } else if (record.value.data) {
            formData.value = record.value.data;
        } else {
            // Maybe it is an assignment (prelist only)
            // We can initialize form data with prelist if needed?
            // usually prelist is separate
        }
    }

    await loadSchema();
});

const loadSchema = async () => {
    try {
        loading.value = true;
        const conn = await db.getDB();

        // Get Schema by Context ID
        const schemaRes = await conn.query(`SELECT * FROM app_schemas WHERE id = ?`, [props.schemaId]);
        if (schemaRes.values && schemaRes.values.length > 0) {
            const row = schemaRes.values[0];
            schema.value = typeof row.schema === 'string' ? JSON.parse(row.schema) : row.schema;
        } else {
            throw new Error("Schema not found");
        }
    } catch (e: any) {
        error.value = e.message;
    } finally {
        loading.value = false;
    }
};

const handleUpdate = (data: any) => {
    formData.value = data;
    // Auto-save logic could go here
};

const saveResponse = async (isDraft: boolean) => {
    if (!record.value) return;

    try {
        const conn = await db.getDB();
        const now = new Date().toISOString();
        const dataStr = JSON.stringify(formData.value);

        // Check if we are editing an assignment or a response
        // If 'assignment_id' exists, it's linked
        // In dynamic view, we might care about 'id' or 'local_id'

        const assignmentId = record.value.assignment_id || record.value.id; // Heuristic
        if (!assignmentId) throw new Error("No Context ID found");

        // Upsert Response
        // Check if response exists with this assignment_id
        const checkRes = await conn.query(`SELECT * FROM responses WHERE assignment_id = ?`, [assignmentId]);
        const exists = checkRes.values && checkRes.values.length > 0;

        if (exists) {
            await conn.run(`UPDATE responses SET data = ?, updated_at = ?, is_synced = 0 WHERE assignment_id = ?`,
                [dataStr, now, assignmentId]);
            await db.save();
        } else {
            const localId = crypto.randomUUID();
            await conn.run(`INSERT INTO responses (local_id, assignment_id, data, is_synced, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)`,
                [localId, assignmentId, dataStr, now, now]);
            await db.save();
        }

        f7.toast.show({ text: 'Saved', closeTimeout: 2000 });

        if (!isDraft) {
            f7.view.main.router.back();
        }

    } catch (e: any) {
        console.error(e);
        f7.dialog.alert('Save failed: ' + e.message, 'Error');
    }
};
</script>
