<template>
  <f7-page name="api-keys" class="api-keys-page" @page:afterin="onPageAfterIn">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-info">
        <div class="header-breadcrumbs">
          <span class="crumb-link" @click="navigate('/')">Dashboard</span>
          <span class="crumb-sep">/</span>
          <span class="crumb-current">API Keys &amp; Integrasi</span>
        </div>
        <h1>Developer &amp; API Keys</h1>
        <p>Kelola token terprogram untuk integrasi eksternal, otomatisasi, dan sinkronisasi data lapangan.</p>
      </div>

      <div class="header-actions">
        <!-- Revert / Undo State Button -->
        <f7-button
          v-if="canUndo"
          outline
          color="orange"
          class="action-btn undo-btn"
          @click="handleRollback"
          title="Kembalikan perubahan ke state sebelumnya"
        >
          <f7-icon f7="arrow_uturn_backward" size="14" class="margin-right-half" />
          <span>Kembalikan State (Undo)</span>
        </f7-button>

        <!-- API Docs Button -->
        <f7-button
          outline
          class="action-btn docs-btn"
          @click="showDocsModal = true"
        >
          <f7-icon f7="book" size="14" class="margin-right-half" />
          <span>Dokumentasi API</span>
        </f7-button>

        <!-- Create Key Primary Button -->
        <f7-button
          fill
          class="action-btn create-btn"
          @click="showCreateModal = true"
        >
          <f7-icon f7="plus" size="14" class="margin-right-half" />
          <span>Buat API Key</span>
        </f7-button>
      </div>
    </div>

    <!-- Stats Grid Component -->
    <ApiKeyStatsGrid :stats="stats" />

    <!-- Toolbar: Search & Filters -->
    <div class="content-card toolbar-card">
      <div class="search-input-wrap">
        <f7-icon f7="search" size="16" class="search-icon" />
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Cari berdasarkan nama, masked token, atau scope..."
          class="search-input"
        />
        <button v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''">
          <f7-icon f7="xmark" size="12" />
        </button>
      </div>

      <div class="filter-group">
        <!-- Status Filter -->
        <div class="filter-pills">
          <button
            type="button"
            class="filter-pill"
            :class="{ active: statusFilter === 'all' }"
            @click="statusFilter = 'all'"
          >
            Semua ({{ stats.total }})
          </button>
          <button
            type="button"
            class="filter-pill"
            :class="{ active: statusFilter === 'active' }"
            @click="statusFilter = 'active'"
          >
            Aktif ({{ stats.active }})
          </button>
          <button
            type="button"
            class="filter-pill"
            :class="{ active: statusFilter === 'revoked' }"
            @click="statusFilter = 'revoked'"
          >
            Dicabut ({{ stats.revoked }})
          </button>
        </div>

        <!-- Env Filter -->
        <div class="filter-pills">
          <button
            type="button"
            class="filter-pill"
            :class="{ active: envFilter === 'all' }"
            @click="envFilter = 'all'"
          >
            Semua Env
          </button>
          <button
            type="button"
            class="filter-pill"
            :class="{ active: envFilter === 'live' }"
            @click="envFilter = 'live'"
          >
            Live
          </button>
          <button
            type="button"
            class="filter-pill"
            :class="{ active: envFilter === 'test' }"
            @click="envFilter = 'test'"
          >
            Test
          </button>
        </div>
      </div>
    </div>

    <!-- API Keys List -->
    <div v-if="loading && keys.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>Memuat daftar API Keys...</p>
    </div>

    <div v-else-if="filteredKeys.length > 0" class="keys-list">
      <ApiKeyCard
        v-for="key in filteredKeys"
        :key="key.id"
        :api-key="key"
        @edit="openEditModal"
        @revoke="handleRevoke"
        @delete="handleDelete"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state-card">
      <div class="empty-icon-wrap">
        <f7-icon f7="key" size="48" color="gray" />
      </div>
      <h3>Tidak Ada API Key Ditemukan</h3>
      <p v-if="searchQuery || statusFilter !== 'all' || envFilter !== 'all'">
        Tidak ada kunci yang cocok dengan kriteria filter Anda. Coba reset pencarian atau filter.
      </p>
      <p v-else>
        Buat API Key pertama Anda untuk mulai mengintegrasikan sistem survei dengan aplikasi eksternal.
      </p>
      <f7-button fill @click="showCreateModal = true" class="create-btn empty-create-btn">
        <f7-icon f7="plus" size="14" class="margin-right-half" />
        Buat API Key
      </f7-button>
    </div>

    <!-- Modals -->
    <CreateApiKeyModal
      v-model:opened="showCreateModal"
      :submitting="loading"
      @submit="handleCreateKeySubmit"
    />

    <ApiKeySecretModal
      v-model:opened="showSecretModal"
      :api-key="newlyCreatedKey"
      :secret-token="newlyCreatedSecret || ''"
      @closed="onSecretModalClosed"
    />

    <EditApiKeyModal
      v-model:opened="showEditModal"
      :api-key="keyToEdit"
      :submitting="loading"
      @submit="handleEditKeySubmit"
    />

    <ApiDocsModal
      v-model:opened="showDocsModal"
    />
  </f7-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { f7 } from 'framework7-vue';
import { useApiKeyManagement } from '../app/api-keys/adapters/primary/useApiKeyManagement';
import type { ApiKey, CreateApiKeyInput, UpdateApiKeyInput } from '../app/api-keys/domain/models/ApiKey';

import ApiKeyStatsGrid from '../app/api-keys/components/ApiKeyStatsGrid.vue';
import ApiKeyCard from '../app/api-keys/components/ApiKeyCard.vue';
import CreateApiKeyModal from '../app/api-keys/components/CreateApiKeyModal.vue';
import ApiKeySecretModal from '../app/api-keys/components/ApiKeySecretModal.vue';
import EditApiKeyModal from '../app/api-keys/components/EditApiKeyModal.vue';
import ApiDocsModal from '../app/api-keys/components/ApiDocsModal.vue';

const {
  keys,
  filteredKeys,
  loading,
  searchQuery,
  statusFilter,
  envFilter,
  newlyCreatedSecret,
  newlyCreatedKey,
  canUndo,
  stats,
  fetchKeys,
  createKey,
  updateKey,
  revokeKey,
  deleteKey,
  undoLastAction,
} = useApiKeyManagement();

// Modal State
const showCreateModal = ref(false);
const showSecretModal = ref(false);
const showEditModal = ref(false);
const showDocsModal = ref(false);
const keyToEdit = ref<ApiKey | null>(null);

function navigate(path: string) {
  const f7Instance = f7 || (window as any).f7;
  if (f7Instance?.view?.main) {
    f7Instance.view.main.router.navigate(path);
  } else {
    window.location.href = path;
  }
}

function onPageAfterIn() {
  fetchKeys();
}

onMounted(() => {
  fetchKeys();
});

async function handleCreateKeySubmit(payload: CreateApiKeyInput) {
  try {
    await createKey(payload);
    showCreateModal.value = false;
    showSecretModal.value = true;
  } catch {
    // Error is handled inside composable
  }
}

function onSecretModalClosed() {
  fetchKeys();
}

function openEditModal(key: ApiKey) {
  keyToEdit.value = key;
  showEditModal.value = true;
}

async function handleEditKeySubmit(id: string, payload: UpdateApiKeyInput) {
  try {
    await updateKey(id, payload);
    showEditModal.value = false;
  } catch {
    // Error is handled inside composable
  }
}

function handleRevoke(key: ApiKey) {
  f7.dialog.confirm(
    `Apakah Anda yakin ingin mencabut API Key "${key.name}"? Kunci ini tidak dapat lagi digunakan untuk mengakses data.`,
    'Cabut API Key',
    async () => {
      await revokeKey(key.id);
    }
  );
}

function handleDelete(key: ApiKey) {
  f7.dialog.confirm(
    `Hapus API Key "${key.name}" secara permanen? Anda dapat menggunakan tombol Undo setelahnya jika tidak sengaja.`,
    'Hapus API Key',
    async () => {
      await deleteKey(key.id);
    }
  );
}

async function handleRollback() {
  await undoLastAction();
}
</script>

<style scoped>
.api-keys-page {
  background: #f8fafc;
  padding: 24px 32px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.header-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  margin-bottom: 6px;
}

.crumb-link {
  color: #64748b;
  cursor: pointer;
  transition: color 0.15s;
}

.crumb-link:hover {
  color: #2563eb;
}

.crumb-sep {
  color: #cbd5e1;
}

.crumb-current {
  color: #1e293b;
  font-weight: 500;
}

.header-info h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.header-info p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.action-btn {
  border-radius: 8px;
  font-weight: 500;
  height: 38px;
}

.undo-btn {
  --f7-button-text-color: #ea580c;
  --f7-button-border-color: #fdba74;
  background: #fff7ed;
}

.undo-btn:hover {
  background: #ffedd5;
}

.docs-btn {
  --f7-button-text-color: #475569;
  --f7-button-border-color: #cbd5e1;
}

.docs-btn:hover {
  background: #f1f5f9;
}

.create-btn {
  --f7-button-bg-color: #2563eb;
  --f7-button-hover-bg-color: #1d4ed8;
}

.empty-create-btn {
  max-width: 200px;
  margin: 16px auto 0;
}

/* Toolbar Card */
.toolbar-card {
  background: white;
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 260px;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 36px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13.5px;
  color: #1e293b;
  background: #f8fafc;
  outline: none;
  transition: all 0.15s;
}

.search-input:focus {
  background: white;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.filter-pills {
  display: flex;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}

.filter-pill {
  border: none;
  background: transparent;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.filter-pill:hover {
  color: #1e293b;
}

.filter-pill.active {
  background: white;
  color: #2563eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

/* Keys List */
.keys-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Loading & Empty States */
.loading-state,
.empty-state-card {
  text-align: center;
  padding: 64px 24px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.empty-icon-wrap {
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-state-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.empty-state-card p {
  font-size: 14px;
  color: #64748b;
  max-width: 440px;
  margin: 0 auto;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .api-keys-page {
    padding: 16px;
  }
}
</style>
