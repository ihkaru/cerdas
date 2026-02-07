<template>
    <f7-page name="organizations" class="organizations-page">
        <!-- Page Header -->
        <f7-navbar title="Organizations" back-link="Back">
            <f7-nav-right>
                <f7-link icon-f7="plus" @click="showCreateDialog">Add</f7-link>
            </f7-nav-right>
        </f7-navbar>

        <f7-searchbar search-container=".search-list" search-in=".item-title" :disable-button="false"
            placeholder="Search organizations..." :clear-button="true"></f7-searchbar>

        <div class="search-list list-block">
            <f7-block-title>My Organizations</f7-block-title>
            <f7-list class="searchbar-found" strong inset dividers-ios>
                <f7-list-item v-for="org in myOrgs" :key="org.id" :title="org.name" :subtitle="org.code" link="#"
                    @click="editOrg(org)" swipeout @swipeout:deleted="deleteOrg(org)">
                    <template #after>
                        <f7-badge color="blue">Owner</f7-badge>
                    </template>
                    <f7-swipeout-actions right>
                        <f7-swipeout-button color="red" delete confirm-text="Are you sure?">Delete</f7-swipeout-button>
                    </f7-swipeout-actions>
                </f7-list-item>
                <f7-list-item v-if="myOrgs.length === 0" title="No organizations created (as Owner)"></f7-list-item>
            </f7-list>

            <f7-block-title>Public Organizations</f7-block-title>
            <f7-list class="searchbar-found" strong inset dividers-ios>
                <f7-list-item v-for="org in publicOrgs" :key="org.id" :title="org.name" :subtitle="org.code">
                    <template #after>
                        <f7-badge color="gray">Public</f7-badge>
                    </template>
                </f7-list-item>
                 <f7-list-item v-if="publicOrgs.length === 0" title="No public organizations"></f7-list-item>
            </f7-list>
        </div>

        <f7-block class="searchbar-not-found">
            <div class="empty-state">No organizations found.</div>
        </f7-block>

        <f7-block class="searchbar-not-found">
            <div class="empty-state">No organizations found.</div>
        </f7-block>

        <!-- Create Dialog -->
        <f7-popup class="create-org-popup" :opened="createOpened" @popup:closed="createOpened = false">
             <f7-page>
                <f7-navbar title="Create Organization">
                    <f7-nav-right>
                        <f7-link popup-close>Close</f7-link>
                    </f7-nav-right>
                </f7-navbar>
                <f7-block-title>Organization Details</f7-block-title>
                <f7-list strong-ios dividers-ios inset-ios>
                    <f7-list-input label="Name" type="text" placeholder="e.g. My Team"
                        :value="newOrg.name" @input="newOrg.name = $event.target.value" clear-button required validate />
                    <f7-list-input label="Code" type="text" placeholder="e.g. TEAM-A"
                        :value="newOrg.code" @input="newOrg.code = $event.target.value" clear-button required validate />
                </f7-list>
                <f7-block>
                    <f7-button fill large @click="saveOrg" :loading="saving">Create Organization</f7-button>
                </f7-block>
             </f7-page>
        </f7-popup>
        
        <!-- Detail/Members Dialog -->
        <OrganizationDetailDialog 
            v-model:opened="detailOpened" 
            :organization="selectedOrg" 
            @refresh="fetchOrgs" 
        />

    </f7-page>
</template>

<script setup lang="ts">
import { ApiClient } from '@/common/api/ApiClient';
import { useAuthStore } from '@/stores/auth.store';
import { f7Badge, f7Block, f7BlockTitle, f7Button, f7Link, f7List, f7ListInput, f7ListItem, f7Navbar, f7NavRight, f7Page, f7Popup, f7Searchbar, f7SwipeoutActions, f7SwipeoutButton } from 'framework7-vue';
import { computed, onMounted, reactive, ref } from 'vue';
import OrganizationDetailDialog from './components/OrganizationDetailDialog.vue';

const authStore = useAuthStore();
const organizations = ref<any[]>([]);
const loading = ref(false);
const createOpened = ref(false);
const detailOpened = ref(false);
const saving = ref(false);
const selectedOrg = ref<any>(null);

const newOrg = reactive({
    name: '',
    code: ''
});

const myOrgs = computed(() => organizations.value.filter(o => o.creator_id === authStore.user?.id));
const publicOrgs = computed(() => organizations.value.filter(o => o.creator_id !== authStore.user?.id));

function isOwner(org: any) {
    return org.creator_id === authStore.user?.id;
}

async function fetchOrgs() {
    loading.value = true;
    try {
        const res = await ApiClient.get('/organizations');
        if (res.data.success) {
            organizations.value = res.data.data;
            console.log('[OrgsPage] Fetched organizations:', organizations.value);
            console.log('[OrgsPage] Current User:', authStore.user);
            console.log('[OrgsPage] User ID:', authStore.user?.id);
            if (organizations.value.length > 0) {
                 console.log('[OrgsPage] First Org Creator ID:', organizations.value[0].creator_id);
                 console.log('[OrgsPage] Is Owner?', organizations.value[0].creator_id === authStore.user?.id);
            }
        }
    } catch (e) {
        console.error('Failed to fetch orgs', e);
    } finally {
        loading.value = false;
    }
}

function showCreateDialog() {
    newOrg.name = '';
    newOrg.code = '';
    createOpened.value = true;
}

function editOrg(org: any) {
    selectedOrg.value = org;
    detailOpened.value = true;
}

async function saveOrg() {
    if (!newOrg.name || !newOrg.code) return;
    
    saving.value = true;
    try {
        await ApiClient.post('/organizations', newOrg);
        createOpened.value = false;
        fetchOrgs();
    } catch (e) {
        console.error('Failed to save org', e);
    } finally {
        saving.value = false;
    }
}

async function deleteOrg(org: any) {
    try {
        await ApiClient.delete(`/organizations/${org.id}`);
        const idx = organizations.value.findIndex(o => o.id === org.id);
        if (idx !== -1) organizations.value.splice(idx, 1);
    } catch (e) {
        console.error('Failed to delete org', e);
        fetchOrgs(); // Revert
    }
}

onMounted(() => {
    fetchOrgs();
});
</script>
