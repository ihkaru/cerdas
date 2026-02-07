<template>
    <f7-popup class="add-org-popup" :opened="opened" @popup:closed="$emit('update:opened', false)">
        <f7-page>
            <f7-navbar :title="showCreate ? 'New Organization' : 'Add Organization'">
                <f7-nav-right>
                    <f7-link v-if="!showCreate" @click="showCreate = true">New</f7-link>
                    <f7-link v-else @click="showCreate = false">Cancel</f7-link>
                    <f7-link popup-close>Close</f7-link>
                </f7-nav-right>
            </f7-navbar>

            <div v-if="showCreate">
                <f7-block-title>Organization Details</f7-block-title>
                <f7-list strong-ios dividers-ios inset-ios>
                    <f7-list-input label="Name" type="text" placeholder="e.g. My Team" :value="newOrg.name"
                        @input="newOrg.name = $event.target.value" clear-button required validate />
                    <f7-list-input label="Code" type="text" placeholder="e.g. TEAM-A" :value="newOrg.code"
                        @input="newOrg.code = $event.target.value" clear-button required validate />
                </f7-list>
                <f7-block>
                    <f7-button fill large @click="createOrg" :loading="creating">Create & Select</f7-button>
                </f7-block>
            </div>

            <div v-else>
                <f7-searchbar class="searchbar-inline" search-container=".org-list" search-in=".item-title"
                    :disable-button="false" :backdrop="false" placeholder="Search organizations..."
                    :clear-button="true"></f7-searchbar>

                <f7-list class="org-list searchbar-found">
                    <f7-list-item v-for="org in organizations" :key="org.id" :title="org.name" :subtitle="org.code"
                        link="#" @click="selectOrg(org)">
                        <template #media>
                            <f7-icon f7="building_2_fill" />
                        </template>
                    </f7-list-item>
                </f7-list>
                <f7-block class="searchbar-not-found">
                    <div class="empty-state">No organizations found.</div>
                </f7-block>
            </div>

            <f7-block v-if="loading" class="text-align-center">
                <f7-preloader />
            </f7-block>
        </f7-page>
    </f7-popup>
</template>

<script setup lang="ts">
import { ApiClient } from '@/common/api/ApiClient';
import { f7Block, f7Icon, f7Link, f7List, f7ListItem, f7Navbar, f7NavRight, f7Page, f7Popup, f7Preloader, f7Searchbar } from 'framework7-vue';
import { onMounted, reactive, ref, watch } from 'vue';

const props = defineProps<{
    opened: boolean;
}>();

const emit = defineEmits(['update:opened', 'select']);

const organizations = ref<any[]>([]);
const loading = ref(false);
const showCreate = ref(false);
const creating = ref(false);

const newOrg = reactive({
    name: '',
    code: ''
});

async function fetchOrgs() {
    loading.value = true;
    try {
        const res = await ApiClient.get('/organizations');
        if (res.data.success) {
            organizations.value = res.data.data;
        }
    } catch (e) {
        console.error('Failed to fetch orgs', e);
    } finally {
        loading.value = false;
    }
}

function selectOrg(org: any) {
    emit('select', org.id);
    emit('update:opened', false);
}

async function createOrg() {
    if (!newOrg.name || !newOrg.code) return;
    
    creating.value = true;
    try {
        const res = await ApiClient.post('/organizations', newOrg);
        if (res.data.success) {
            // Select the new org immediately
            emit('select', res.data.data.id);
            emit('update:opened', false);
            // Reset
            showCreate.value = false;
            newOrg.name = '';
            newOrg.code = '';
            // Refresh list in background if needed
            fetchOrgs();
        }
    } catch (e) {
        console.error('Failed to create org', e);
        // Show error?
    } finally {
        creating.value = false;
    }
}

watch(() => props.opened, (val) => {
    if (val) {
        if (organizations.value.length === 0) fetchOrgs();
        showCreate.value = false; // Reset to list view
    }
});

onMounted(() => {
    // optional pre-fetch?
});
</script>

<style scoped>
.empty-state {
    text-align: center;
    color: #64748b;
    margin-top: 20px;
}
</style>
