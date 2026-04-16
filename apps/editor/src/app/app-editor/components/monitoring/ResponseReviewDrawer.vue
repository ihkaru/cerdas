<template>
    <f7-popup v-model:opened="isOpen" class="review-popup">
        <f7-view>
            <f7-page>
                <f7-navbar :title="`Review: ${response?.enumerator?.name || 'Assignment'}`">
                    <f7-nav-right>
                        <f7-link popup-close>Close</f7-link>
                    </f7-nav-right>
                </f7-navbar>

                <f7-block-title>Assignment Details</f7-block-title>
                <f7-list v-if="response" inset strong>
                    <f7-list-item title="Enumerator" :after="response.enumerator?.name || 'Unassigned'" />
                    <f7-list-item title="Updated At" :after="formatDate(response.updated_at)" />
                    <f7-list-item title="Current Status">
                        <f7-badge :color="getStatusColor(response.status)">
                            {{ response.status }}
                        </f7-badge>
                    </f7-list-item>
                </f7-list>

                <f7-block-title>Form Data</f7-block-title>
                <f7-list v-if="response?.responses?.[0]" inset strong class="data-list">
                    <f7-list-item 
                        v-for="(val, key) in response.responses[0].data" 
                        :key="key" 
                        :title="String(key)"
                        :after="String(val)"
                        class="data-item"
                    />
                </f7-list>
                <f7-block v-else-if="response?.prelist_data" inset strong class="data-list">
                    <p class="text-color-gray">Pre-list Data (No submission yet):</p>
                    <f7-list inset>
                         <f7-list-item 
                            v-for="(val, key) in response.prelist_data" 
                            :key="key" 
                            :title="String(key)"
                            :after="String(val)"
                        />
                    </f7-list>
                </f7-block>

                <!-- Actions (Only for Complex Mode Pending Review) -->
                <f7-block v-if="canAction" class="action-buttons">
                    <div class="row">
                        <div class="col">
                            <f7-button 
                                fill 
                                large 
                                color="green" 
                                @click="handleApprove"
                                :disabled="processing"
                            >
                                <f7-icon f7="checkmark_circle_fill" />
                                Approve
                            </f7-button>
                        </div>
                        <div class="col">
                            <f7-button 
                                outline 
                                large 
                                color="red" 
                                @click="handleReject"
                                :disabled="processing"
                            >
                                <f7-icon f7="xmark_circle" />
                                Reject
                            </f7-button>
                        </div>
                    </div>
                    <p class="action-hint">Approving will synchronize this data to external sources (Google Sheets).</p>
                </f7-block>

                <!-- Status Feedback -->
                <f7-block v-if="response?.status === 'synced'" class="text-align-center text-color-green">
                    <f7-icon f7="checkmark_seal_fill" size="44" />
                    <p class="font-bold">Already Synced</p>
                </f7-block>
            </f7-page>
        </f7-view>
    </f7-popup>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { f7 } from 'framework7-vue';
import { ApiClient } from '../../../../common/api/ApiClient';

const props = defineProps<{
    opened: boolean;
    response: any | null;
}>();

const emit = defineEmits(['update:opened', 'action-complete']);

const isOpen = computed({
    get: () => props.opened,
    set: (val) => emit('update:opened', val)
});

const processing = ref(false);

const canAction = computed(() => {
    return (props.response?.status === 'submitted' || props.response?.status === 'completed') && props.response?.responses?.[0];
});

function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString();
}

function getStatusColor(status: string): string {
    switch (status) {
        case 'submitted': return 'orange';
        case 'synced': return 'green';
        case 'rejected': return 'red';
        default: return 'gray';
    }
}

async function handleApprove() {
    if (!props.response?.responses?.[0]) return;
    
    processing.value = true;
    try {
        await ApiClient.post(`/responses/${props.response.responses[0].id}/approve`);
        f7.toast.show({ text: '✓ Submission approved', position: 'center', closeTimeout: 2000 });
        emit('action-complete');
        isOpen.value = false;
    } catch (e) {
        console.error('[ResponseReviewDrawer] Approve Error:', e);
        f7.dialog.alert('Failed to approve submission');
    } finally {
        processing.value = false;
    }
}

async function handleReject() {
    if (!props.response?.responses?.[0]) return;

    f7.dialog.prompt('Reason for rejection (sent to enumerator):', 'Reject Submission', async (reason) => {
        processing.value = true;
        try {
            await ApiClient.post(`/responses/${props.response.responses[0].id}/reject`, { reason });
            f7.toast.show({ text: 'Submission returned to enumerator', position: 'center', closeTimeout: 2000 });
            emit('action-complete');
            isOpen.value = false;
        } catch (e) {
            console.error('[ResponseReviewDrawer] Reject Error:', e);
            f7.dialog.alert('Failed to reject submission');
        } finally {
            processing.value = false;
        }
    });
}
</script>

<style scoped>
.data-list {
    margin-top: 0;
}

.data-item :deep(.item-after) {
    max-width: 60%;
    word-break: break-all;
    white-space: normal;
    text-align: right;
    font-size: 13px;
    color: var(--f7-text-color);
}

.action-buttons {
    margin-top: 32px;
}

.action-hint {
    font-size: 12px;
    color: var(--f7-label-color);
    text-align: center;
    margin-top: 16px;
}

.review-popup {
    --f7-popup-tablet-width: 500px;
}
</style>
