<template>
    <f7-page name="organizations" class="organizations-page">
        <!-- Page Header -->
        <div class="page-header">
            <div class="header-info">
                <h1 class="page-title">Organizations</h1>
                <p class="page-subtitle">Kelola grup pengguna, hak akses tim, dan instansi data survei</p>
            </div>
            <div class="header-actions">
                <div class="search-input-wrap">
                    <f7-icon f7="search" size="14" class="search-icon" />
                    <input
                        type="search"
                        class="org-search-input"
                        placeholder="Cari organisasi..."
                        v-model="searchQuery"
                    />
                    <button
                        v-if="searchQuery"
                        class="clear-search-btn"
                        @click="searchQuery = ''"
                        title="Hapus pencarian"
                    >
                        <f7-icon f7="xmark_circle_fill" size="14" />
                    </button>
                </div>
                <button class="btn-create-org" @click="showCreateDialog">
                    <f7-icon f7="plus" size="14" />
                    <span>New Organization</span>
                </button>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading && organizations.length === 0" class="loading-grid">
            <div v-for="i in 3" :key="'skel-' + i" class="org-skeleton-card">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-lines">
                    <div class="skel-line skel-title"></div>
                    <div class="skel-line skel-sub"></div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div v-else class="org-content-container">
            <!-- Section: My Organizations -->
            <section class="org-section">
                <div class="section-title-row">
                    <div class="section-heading">
                        <f7-icon f7="person_crop_circle_badge_checkmark" size="18" color="blue" />
                        <h2>Organisasi Saya (Owner)</h2>
                        <span class="count-pill">{{ filteredMyOrgs.length }}</span>
                    </div>
                </div>

                <div v-if="filteredMyOrgs.length > 0" class="orgs-grid">
                    <OrgCard
                        v-for="org in filteredMyOrgs"
                        :key="org.id"
                        :org="org"
                        :current-user-id="authStore.user?.id"
                        @select="editOrg"
                        @delete="confirmDeleteOrg"
                    />
                </div>

                <div v-else-if="!searchQuery" class="empty-state-banner">
                    <div class="empty-banner-icon">
                        <f7-icon f7="building_2_fill" size="28" />
                    </div>
                    <div class="empty-banner-text">
                        <h4>Belum ada organisasi yang Anda kelola</h4>
                        <p>Buat organisasi untuk mengelompokkan enumerator, membagikan akses survei, dan mengelola izin tim.</p>
                    </div>
                    <button class="empty-banner-btn" @click="showCreateDialog">
                        <f7-icon f7="plus" size="13" />
                        Buat Organisasi
                    </button>
                </div>

                <div v-else class="empty-search-hint">
                    Tidak ada organisasi Anda yang sesuai kata kunci "{{ searchQuery }}".
                </div>
            </section>

            <!-- Section: Public / Team Organizations -->
            <section class="org-section" v-if="filteredPublicOrgs.length > 0 || (publicOrgs.length > 0 && searchQuery)">
                <div class="section-title-row">
                    <div class="section-heading">
                        <f7-icon f7="globe" size="18" color="teal" />
                        <h2>Organisasi Publik &amp; Tim Lain</h2>
                        <span class="count-pill">{{ filteredPublicOrgs.length }}</span>
                    </div>
                </div>

                <div v-if="filteredPublicOrgs.length > 0" class="orgs-grid">
                    <OrgCard
                        v-for="org in filteredPublicOrgs"
                        :key="org.id"
                        :org="org"
                        :current-user-id="authStore.user?.id"
                        @select="editOrg"
                        @delete="confirmDeleteOrg"
                    />
                </div>
            </section>
        </div>

        <!-- Create Organization Popup -->
        <f7-popup class="create-org-popup" :opened="createOpened" @popup:closed="createOpened = false">
            <f7-page>
                <f7-navbar title="Create Organization">
                    <f7-nav-right>
                        <f7-link popup-close>Batal</f7-link>
                    </f7-nav-right>
                </f7-navbar>
                <f7-block style="margin-bottom: 72px;">
                    <p class="create-hint">Masukkan rincian identitas organisasi atau unit kerja survei Anda.</p>
                    <f7-list strong-ios dividers-ios inset-ios>
                        <f7-list-input
                            label="Nama Organisasi"
                            type="text"
                            placeholder="Contoh: BPS Provinsi Jawa Barat"
                            :value="newOrg.name"
                            @input="newOrg.name = ($event.target as HTMLInputElement).value"
                            clear-button
                            required
                        />
                        <f7-list-input
                            label="Kode Organisasi (Unik)"
                            type="text"
                            placeholder="Contoh: BPS-3200"
                            :value="newOrg.code"
                            @input="newOrg.code = ($event.target as HTMLInputElement).value.toUpperCase()"
                            clear-button
                            required
                        />
                    </f7-list>
                </f7-block>
                <f7-toolbar bottom class="popup-bottom-toolbar">
                    <f7-button
                        fill
                        large
                        @click="saveOrg"
                        :loading="saving"
                        :disabled="!newOrg.name.trim() || !newOrg.code.trim()"
                        class="submit-org-btn"
                    >
                        Create Organization
                    </f7-button>
                </f7-toolbar>
            </f7-page>
        </f7-popup>

        <!-- Detail/Members Dialog -->
        <OrganizationDetailDialog v-model:opened="detailOpened" :organization="selectedOrg" @refresh="fetchOrgs" />
    </f7-page>
</template>

<script setup lang="ts">
import { ApiClient } from '@/common/api/ApiClient';
import { useAuthStore } from '@/stores/auth.store';
import { f7 } from 'framework7-vue';
import { computed, onMounted, reactive, ref } from 'vue';
import OrgCard from './components/organizations/OrgCard.vue';
import type { OrganizationItem } from './components/organizations/organizations.types';
import OrganizationDetailDialog from './components/OrganizationDetailDialog.vue';
import './OrganizationsPage.css';

const authStore = useAuthStore();
const organizations = ref<OrganizationItem[]>([]);
const loading = ref(false);
const createOpened = ref(false);
const detailOpened = ref(false);
const saving = ref(false);
const selectedOrg = ref<OrganizationItem | null>(null);
const searchQuery = ref('');

const newOrg = reactive({
    name: '',
    code: ''
});

const myOrgs = computed(() => organizations.value.filter(o => o.creator_id === authStore.user?.id));
const publicOrgs = computed(() => organizations.value.filter(o => o.creator_id !== authStore.user?.id));

const filteredMyOrgs = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    if (!q) return myOrgs.value;
    return myOrgs.value.filter(o => o.name?.toLowerCase().includes(q) || o.code?.toLowerCase().includes(q));
});

const filteredPublicOrgs = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    if (!q) return publicOrgs.value;
    return publicOrgs.value.filter(o => o.name?.toLowerCase().includes(q) || o.code?.toLowerCase().includes(q));
});

async function fetchOrgs() {
    loading.value = true;
    try {
        const res = await ApiClient.get('/organizations');
        if (res.data?.success) {
            organizations.value = res.data.data || [];
        }
    } catch (e: unknown) {
        console.error('Failed to fetch orgs', e);
        f7.toast.show({ text: 'Gagal memuat daftar organisasi', position: 'bottom', closeTimeout: 2000, cssClass: 'color-red' });
    } finally {
        loading.value = false;
    }
}

function showCreateDialog() {
    newOrg.name = '';
    newOrg.code = '';
    createOpened.value = true;
}

function editOrg(org: OrganizationItem) {
    selectedOrg.value = org;
    detailOpened.value = true;
}

async function saveOrg() {
    if (!newOrg.name.trim() || !newOrg.code.trim()) return;

    saving.value = true;
    try {
        await ApiClient.post('/organizations', {
            name: newOrg.name.trim(),
            code: newOrg.code.trim(),
        });
        f7.toast.show({ text: 'Organisasi berhasil dibuat', position: 'center', closeTimeout: 2000 });
        createOpened.value = false;
        await fetchOrgs();
    } catch (err: unknown) {
        console.error('Failed to save org', err);
        const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menyimpan organisasi';
        f7.dialog.alert(errMsg);
    } finally {
        saving.value = false;
    }
}

function confirmDeleteOrg(org: OrganizationItem) {
    f7.dialog.confirm(
        `Hapus organisasi "${org.name}" (${org.code})? Seluruh relasi anggota di organisasi ini akan dilepaskan.`,
        'Hapus Organisasi',
        async () => {
            try {
                await ApiClient.delete(`/organizations/${org.id}`);
                const idx = organizations.value.findIndex(o => o.id === org.id);
                if (idx !== -1) organizations.value.splice(idx, 1);
                f7.toast.show({ text: 'Organisasi berhasil dihapus', position: 'bottom', closeTimeout: 2000 });
            } catch (err: unknown) {
                console.error('Failed to delete org', err);
                const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menghapus organisasi';
                f7.dialog.alert(errMsg);
                fetchOrgs();
            }
        }
    );
}

onMounted(() => {
    fetchOrgs();
});
</script>
