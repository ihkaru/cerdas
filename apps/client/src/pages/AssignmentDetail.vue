<template>
    <f7-page name="assignment-detail" @page:beforeout="onPageBeforeOut" @page:afterin="onPageAfterIn">
        <f7-navbar :sliding="false">
            <f7-nav-left back-link="Back"></f7-nav-left>
            <f7-nav-title>{{ pageTitle }}</f7-nav-title>
            <f7-nav-right>
                <div class="display-flex align-items-center margin-right-half">
                    <f7-preloader v-if="saving" size="20" />
                    <span v-else-if="lastSaved" class="text-color-gray size-12 fade-in">Saved</span>
                </div>
                <f7-button fill round small color="green" @click="confirmSubmit">Finish</f7-button>
            </f7-nav-right>
        </f7-navbar>

        <f7-block v-if="loading" class="text-align-center margin-top-xl">
            <f7-preloader size="42" />
            <p class="margin-top">Loading form...</p>
        </f7-block>

        <f7-block v-else-if="error" class="text-align-center margin-top-xl warning-bg padding white-text rounded">
            <f7-icon f7="exclamationmark_triangle_fill" size="48" color="white"></f7-icon>
            <p class="size-16 font-weight-bold">{{ error }}</p>
            <f7-button fill color="white" text-color="red" @click="loadData">Retry</f7-button>
        </f7-block>

        <div v-else-if="schema && assignment" class="padding-bottom-xl">
            <FormRenderer ref="formRenderer" :schema="schema" :initial-data="formData"
                :context="{ user: userContext, assignment: assignment, resolveAssetUrl: resolveAssetUrl }"
                @update:data="handleUpdate" />
        </div>

        <!-- Validation Summary FAB - Teleported to body to float above everything (including Popups) -->
        <Teleport to="body">
            <div class="global-validation-fab" v-if="fabVisible"
                style="position: fixed; right: 20px; bottom: 20px; z-index: 12000;">
                <f7-fab position="right-bottom" color="blue" @click="openValidationSummary"
                    style="margin: 0; position: static;">
                    <f7-icon f7="checkmark_shield"></f7-icon>
                    <f7-badge v-if="summaryBadgeCount > 0" color="red">{{ summaryBadgeCount }}</f7-badge>
                </f7-fab>
            </div>
        </Teleport>

        <!-- Validation Summary Sheet -->
        <f7-sheet :opened="validationSheetOpen" @sheet:closed="validationSheetOpen = false" swipe-to-close backdrop
            style="height: auto; --f7-sheet-height: auto; max-height: 70vh;">
            <div class="swipe-handler"></div>
            <div style="max-height: 60vh; overflow-y: auto; padding: 16px;">
                <h2 style="margin: 0 0 16px 0;">Ringkasan Validasi</h2>

                <!-- Errors -->
                <div v-if="validationSummary.errors.length > 0" class="validation-section">
                    <div class="validation-header bg-color-red text-color-white">
                        <f7-icon f7="xmark_circle_fill" size="16"></f7-icon>
                        <span>Errors ({{ validationSummary.errors.length }})</span>
                    </div>
                    <div class="validation-items">
                        <div v-for="item in validationSummary.errors" :key="item.fieldName" class="validation-item"
                            @click="scrollToField(item.fieldName)">
                            <span class="item-label">{{ item.label }}</span>
                            <span class="item-message text-color-red">{{ item.message }}</span>
                        </div>
                    </div>
                </div>

                <!-- Warnings -->
                <div v-if="validationSummary.warnings.length > 0" class="validation-section">
                    <div class="validation-header bg-color-orange text-color-white">
                        <f7-icon f7="exclamationmark_triangle_fill" size="16"></f7-icon>
                        <span>Warnings ({{ validationSummary.warnings.length }})</span>
                    </div>
                    <div class="validation-items">
                        <div v-for="item in validationSummary.warnings" :key="item.fieldName" class="validation-item"
                            @click="scrollToField(item.fieldName)">
                            <span class="item-label">{{ item.label }}</span>
                            <span class="item-message text-color-orange">{{ item.message }}</span>
                        </div>
                    </div>
                </div>

                <!-- Blanks -->
                <div v-if="validationSummary.blanks.length > 0" class="validation-section">
                    <div class="validation-header blank-header">
                        <f7-icon f7="pencil_slash" size="16"></f7-icon>
                        <span>Belum Diisi ({{ validationSummary.blanks.length }})</span>
                    </div>
                    <div class="validation-items">
                        <div v-for="item in validationSummary.blanks" :key="item.fieldName" class="validation-item"
                            @click="scrollToField(item.fieldName)">
                            <span class="item-label">{{ item.label }}</span>
                            <span class="item-message text-color-gray">{{ item.message }}</span>
                        </div>
                    </div>
                </div>

                <!-- All Good -->
                <div v-if="summaryBadgeCount === 0" class="text-align-center padding-xl">
                    <f7-icon f7="checkmark_seal_fill" size="64" color="green"></f7-icon>
                    <p class="text-color-green font-weight-bold">Semua field terisi dengan benar!</p>
                </div>
            </div>
        </f7-sheet>
    </f7-page>
</template>

<style scoped>
.warning-bg {
    background-color: #f44336;
    color: white;
    border-radius: 8px;
}

.rounded {
    border-radius: 12px;
}

.fade-in {
    animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

/* Validation Summary Styles */
.validation-section {
    margin-bottom: 16px;
    border-radius: 8px;
    overflow: hidden;
}

.validation-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    font-weight: 600;
    font-size: 14px;
}

.validation-items {
    background: #f5f5f5;
}

.validation-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #e0e0e0;
    cursor: pointer;
}

.validation-item:last-child {
    border-bottom: none;
}

.validation-item:active {
    background: #e8e8e8;
}

.item-label {
    font-weight: 500;
    font-size: 14px;
}

.item-message {
    font-size: 12px;
    max-width: 50%;
    text-align: right;
}

.blank-header {
    background-color: #555;
    color: white;
}
</style>

<script setup lang="ts">
import { FormRenderer, type AppSchema } from '@cerdas/form-engine';
import { f7 } from 'framework7-vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { DashboardRepository } from '../app/dashboard/repositories/DashboardRepository';
import type { Assignment } from '../app/dashboard/types';
import { apiClient } from '../common/api/ApiClient';
import { useDatabase } from '../common/composables/useDatabase';
import { useAuthStore } from '../common/stores/authStore';
import { useLogger } from '../common/utils/logger';

const log = useLogger('AssignmentDetail');
const authStore = useAuthStore();
const resolveAssetUrl = (val: any) => apiClient.getAssetUrl(val);

// Slim user context for closures (minimal, no heavy objects)
const userContext = computed(() => ({
    id: authStore.user?.id ?? 0,
    email: authStore.user?.email ?? '',
    name: authStore.user?.name ?? '',
    role: authStore.user?.role ?? 'enumerator',
    organizationId: authStore.user?.organizationId ?? null,
}));

const props = defineProps<{
    assignmentId: string;
}>();

const db = useDatabase();
const loading = ref(true);
const saving = ref(false);
const lastSaved = ref(false);
const fabVisible = ref(false); // Controls teleported FAB visibility
const error = ref<string | null>(null);
const assignment = ref<Assignment | null>(null);
const schema = ref<AppSchema | null>(null);
const formData = ref<Record<string, any>>({});
const formRenderer = ref<any>(null); // Ref to FormRenderer component

// Validation Summary State
const validationSheetOpen = ref(false);
const validationSummary = ref<{ errors: any[]; warnings: any[]; blanks: any[] }>({
    errors: [],
    warnings: [],
    blanks: []
});
const summaryBadgeCount = computed(() => {
    return validationSummary.value.errors.length +
        validationSummary.value.warnings.length +
        validationSummary.value.blanks.length;
});

// Since repo parses prelist_data, access directly
const pageTitle = computed(() => {
    if (!assignment.value) return 'Loading...';
    // prelist_data is already parsed by repo
    const pd = assignment.value.prelist_data || {};
    return pd.name || 'Assignment';
});

// Validation Summary Functions
const openValidationSummary = () => {
    if (formRenderer.value?.getValidationSummary) {
        validationSummary.value = formRenderer.value.getValidationSummary();
    }
    validationSheetOpen.value = true;
};

const scrollToField = (fieldName: string) => {
    validationSheetOpen.value = false;
    setTimeout(() => {
        if (formRenderer.value?.scrollToField) {
            formRenderer.value.scrollToField(fieldName);
        }
    }, 300); // Wait for sheet to close
};

let saveTimeout: any = null;

const handleUpdate = (data: any) => {
    formData.value = data;

    // Debounce Auto-save - don't trigger saving state immediately to reduce re-renders
    if (saveTimeout) clearTimeout(saveTimeout);
    lastSaved.value = false;

    saveTimeout = setTimeout(() => {
        saving.value = true;
        saveResponse(true);
    }, 1500); // Increased to 1.5s to batch more changes
};

const loadData = async () => {
    try {
        loading.value = true;
        error.value = null;
        const conn = await db.getDB();

        log.debug('Loading assignment data', { assignmentId: props.assignmentId });

        // 1. Get Assignment via Repo
        const fetchedAssign = await DashboardRepository.getAssignmentById(conn, props.assignmentId);
        if (!fetchedAssign) {
            throw new Error('Assignment not found');
        }
        assignment.value = fetchedAssign;
        log.debug('Assignment loaded', {
            id: fetchedAssign.id,
            table_id: fetchedAssign.table_id,
            status: fetchedAssign.status
        });

        // 2. Get Schema (Support Preview Override)
        log.debug('Schema loading for table:', {
            table_id: assignment.value.table_id,
            hasOverride: !!(window as any).__SCHEMA_OVERRIDE?.[assignment.value.table_id]
        });
        const override = (window as any).__SCHEMA_OVERRIDE?.[assignment.value.table_id];
        if (override) {
            log.info('[PreviewMode] Using Schema Override for Form Detail');
            log.debug('[PreviewMode] Override structure:', {
                hasSchema: !!override.schema,
                schemaKeys: override.schema ? Object.keys(override.schema) : [],
                fieldsType: typeof override.schema?.fields,
                fieldsIsArray: Array.isArray(override.schema?.fields),
                fieldsLength: Array.isArray(override.schema?.fields) ? override.schema.fields.length : 'N/A',
                firstField: override.schema?.fields?.[0]
            });

            // Normalize: Ensure fields is always an array
            let overrideFields = override.schema?.fields;
            if (overrideFields && !Array.isArray(overrideFields)) {
                // Convert object to array if needed (shouldn't happen but safety check)
                log.warn('[PreviewMode] Fields is not array, attempting conversion:', typeof overrideFields);
                overrideFields = Object.values(overrideFields);
            }

            schema.value = {
                ...override.schema,
                fields: overrideFields || []
            };

            log.debug('[PreviewMode] Schema loaded:', {
                hasFields: !!schema.value?.fields,
                fieldsIsArray: Array.isArray(schema.value?.fields),
                fieldCount: schema.value?.fields?.length || 0
            });
        } else if (assignment.value.table_id) {
            const fetchedTable = await DashboardRepository.getTable(conn, assignment.value.table_id);
            log.debug('Schema from DB', {
                hasTable: !!fetchedTable,
                hasFields: !!(fetchedTable?.fields as any)?.length,
                fieldCount: (fetchedTable?.fields as any)?.length || 0
            });

            if (!fetchedTable) {
                throw new Error('Table Schema not found locally. Please Sync.');
            }

            // Repository already handles parsing
            const fieldsObj = fetchedTable.fields;
            if (!fieldsObj || (Array.isArray(fieldsObj) && fieldsObj.length === 0)) {
                log.error('Invalid schema structure or empty fields', fieldsObj);
                // Fallback for nested 'schema' key from legacy
                if ((fetchedTable as any).schema?.fields) {
                    schema.value = (fetchedTable as any).schema;
                } else {
                    throw new Error('Table Schema is empty. Please re-sync.');
                }
            } else {
                // If fields is just an array, wrap it
                if (Array.isArray(fieldsObj)) {
                    schema.value = { fields: fieldsObj } as unknown as AppSchema;
                } else {
                    schema.value = fieldsObj as unknown as AppSchema;
                }
            }

        } else {
            throw new Error('Assignment has no table ID');
        }

        // 3. Merge prelist_data (pre-fill) with existing response
        const prelistData = assignment.value?.prelist_data || {};
        const existingData = await DashboardRepository.getResponse(conn, props.assignmentId);

        log.info('Assignment Data Check', {
            requestedId: props.assignmentId,
            loadedAssignmentId: assignment.value?.id,
            prelistDataKeys: Object.keys(prelistData),
            existingResponseFound: !!existingData,
            existingResponseKeys: existingData ? Object.keys(existingData) : []
        });

        // Pre-fill values come first, then user's saved data overrides
        formData.value = {
            ...prelistData,      // Base: pre-filled values from assignment
            ...(existingData || {})  // Override: user's saved response
        };

        log.info('[AssignmentDetail][Final-Form-Data] Final Form Data initialized:', formData.value);

        // Removed noisy debug log 'Form data initialized' in favor of specific check above

    } catch (e: any) {
        error.value = e.message;
        log.error('Failed to load data', e);
    } finally {
        loading.value = false;
    }
};

const saveResponse = async (isDraft: boolean) => {
    try {
        // If not draft, validate first (though logic usually handled in confirmSubmit)
        // But auto-save is always draft=true (except final?)
        // Actually saveResponse handles both.

        const conn = await db.getDB();
        await DashboardRepository.saveResponse(conn, props.assignmentId, formData.value, isDraft);
        await db.save();

        saving.value = false;
        if (isDraft) {
            lastSaved.value = true;
            setTimeout(() => lastSaved.value = false, 2000);
        }
    } catch (e) {
        log.error('Failed to save response', e);
        saving.value = false;
        if (!isDraft) f7.dialog.alert('Failed to save response', 'Error');
    }
};

const confirmSubmit = () => {
    // Clear auto-save timeout to prevent race conditions
    if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
    }
    saving.value = false;

    // Validate Form Before Submitting
    if (formRenderer.value) {
        const isValid = formRenderer.value.validate();
        if (!isValid) {
            f7.toast.show({
                text: 'Please fix the errors in the form before submitting.',
                closeTimeout: 3000,
                cssClass: 'color-red',
                position: 'bottom'
            });
            // Try to scroll to first error? (Optional improvement)
            return;
        }
    }

    f7.dialog.confirm('Are you sure you want to finish this assignment?', 'Finish Assignment', async () => {
        await saveResponse(false);
        f7.toast.show({ text: 'Assignment Completed!', closeTimeout: 2000, cssClass: 'color-green' });
        f7.view.main.router.back();
    });
}

const onPageAfterIn = () => {
    fabVisible.value = true;
};

const onPageBeforeOut = () => {
    fabVisible.value = false;

    // If there is a pending save (user was typing), force save immediately
    if (saveTimeout) {
        log.debug('Forcing draft save on page exit');
        clearTimeout(saveTimeout);
        saveTimeout = null;
        // Fire and forget - do not await here as we can't block navigation easily
        // But SQLite is fast enough to likely beat the Dashboard fetch
        saveResponse(true);
    }
}

// Live Preview: Listen for schema updates from Editor
const handleSchemaOverrideUpdate = (event: CustomEvent) => {
    const { tableId, formId, fields, layout } = event.detail;
    const targetId = tableId || formId;

    // Check if we're in preview mode (iframe)
    const isInPreviewMode = window.self !== window.top;

    log.debug('[LivePreview] Received schema update event', {
        receivedId: targetId,
        currentTableId: assignment.value?.table_id,
        isInPreviewMode,
        hasFields: !!fields,
        fieldsCount: Array.isArray(fields) ? fields.length : 0
    });

    // In preview mode (iframe), accept schema updates for live preview
    if (isInPreviewMode && fields && assignment.value) {
        // Construct schema from fields array
        const newSchema = {
            ...schema.value,
            fields: Array.isArray(fields) ? fields : []
        };

        log.info('[LivePreview] Schema updated in preview mode, re-rendering form');
        schema.value = newSchema as any;
    }
};

onMounted(() => {
    loadData();
    // In case afterin doesn't fire on initial load if not navigated to
    setTimeout(() => { fabVisible.value = true; }, 500);

    // Listen for live schema updates
    window.addEventListener('schema-override-updated', handleSchemaOverrideUpdate as EventListener);
});

onUnmounted(() => {
    // Clean up event listener
    window.removeEventListener('schema-override-updated', handleSchemaOverrideUpdate as EventListener);
});
</script>
