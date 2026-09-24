<template>
  <div class="key-card">
    <div class="key-card-main">
      <!-- Top Row: Name, Env & Status Badges -->
      <div class="key-card-top">
        <div class="key-name-block">
          <div class="key-avatar" :class="apiKey.environment">
            <f7-icon f7="key_fill" size="16" />
          </div>
          <div class="key-titles">
            <h3 class="key-name">{{ apiKey.name }}</h3>
            <div class="key-masked-row">
              <code class="masked-code">{{ apiKey.maskedKey }}</code>
              <button class="icon-inline-btn" @click="copyMaskedKey(apiKey.maskedKey)" title="Salin format masked">
                <f7-icon f7="doc_on_doc" size="12" />
              </button>
            </div>
          </div>
        </div>

        <div class="key-badges">
          <span class="badge" :class="apiKey.environment === 'live' ? 'color-green' : 'color-purple'">
            {{ apiKey.environment.toUpperCase() }}
          </span>
          <span class="badge" :class="getStatusBadgeClass(apiKey.status)">
            {{ apiKey.status.toUpperCase() }}
          </span>
        </div>
      </div>

      <!-- Middle Row: Scopes -->
      <div class="key-scopes-row">
        <span class="scopes-label">Scopes:</span>
        <div class="scopes-chips">
          <span v-for="scope in apiKey.scopes" :key="scope" class="scope-chip">
            {{ scope }}
          </span>
        </div>
      </div>

      <!-- Bottom Row: Meta Info -->
      <div class="key-meta-row">
        <div class="meta-item">
          <span class="meta-label">Masa Berlaku:</span>
          <span class="meta-value">{{ formatExpiry(apiKey.expiresAt) }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Terakhir Digunakan:</span>
          <span class="meta-value">{{ formatRelative(apiKey.lastUsedAt) }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Total Permintaan:</span>
          <span class="meta-value font-mono">{{ apiKey.totalRequests.toLocaleString() }}</span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="key-card-actions">
      <button class="card-action-btn edit-btn" @click="emit('edit', apiKey)" title="Ubah Konfigurasi">
        <f7-icon f7="pencil" size="14" />
        <span>Ubah</span>
      </button>

      <button
        v-if="apiKey.status === 'active'"
        class="card-action-btn revoke-btn"
        @click="emit('revoke', apiKey)"
        title="Cabut Akses Kunci"
      >
        <f7-icon f7="lock_slash" size="14" />
        <span>Cabut</span>
      </button>

      <button class="card-action-btn delete-btn" @click="emit('delete', apiKey)" title="Hapus Kunci">
        <f7-icon f7="trash" size="14" />
        <span>Hapus</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import type { ApiKey } from '../domain/models/ApiKey';

defineProps<{
  apiKey: ApiKey;
}>();

const emit = defineEmits<{
  edit: [key: ApiKey];
  revoke: [key: ApiKey];
  delete: [key: ApiKey];
}>();

async function copyMaskedKey(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    f7.toast
      .create({
        text: 'Masked key disalin!',
        position: 'center',
        closeTimeout: 1500,
        cssClass: 'color-green',
      })
      .open();
  } catch {
    // ignore
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'active':
      return 'color-green';
    case 'revoked':
      return 'color-red';
    case 'expired':
      return 'color-orange';
    default:
      return 'color-gray';
  }
}

function formatExpiry(iso: string | null): string {
  if (!iso) return 'Tidak pernah';
  const target = new Date(iso);
  const now = new Date();
  if (target < now) return 'Kedaluwarsa';
  return target.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'Belum pernah';
  const diffHours = Math.round((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60));
  if (diffHours < 1) return 'Baru saja';
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} hari yang lalu`;
}
</script>

<style scoped>
.key-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  transition: all 0.2s ease;
}

.key-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.key-card-main {
  flex: 1;
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.key-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.key-name-block {
  display: flex;
  align-items: center;
  gap: 14px;
}

.key-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.key-avatar.live {
  background: #f0fdf4;
  color: #16a34a;
}

.key-avatar.test {
  background: #faf5ff;
  color: #9333ea;
}

.key-titles {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.key-name {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
}

.key-masked-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.masked-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.icon-inline-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  padding: 2px;
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
}

.icon-inline-btn:hover {
  color: #2563eb;
  background: #eff6ff;
}

.key-badges {
  display: flex;
  align-items: center;
  gap: 6px;
}

.key-scopes-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.scopes-label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.scopes-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.scope-chip {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #334155;
  font-size: 11.5px;
  padding: 2px 8px;
  border-radius: 12px;
}

.key-meta-row {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  border-top: 1px solid #f1f5f9;
  padding-top: 10px;
  font-size: 12px;
}

.meta-item {
  display: flex;
  gap: 5px;
}

.meta-label {
  color: #94a3b8;
}

.meta-value {
  color: #475569;
  font-weight: 500;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.key-card-actions {
  display: flex;
  flex-direction: column;
  border-left: 1px solid #f1f5f9;
  background: #fbfcfd;
  width: 90px;
}

.card-action-btn {
  flex: 1;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
  color: #64748b;
  transition: all 0.15s;
  padding: 8px 4px;
}

.card-action-btn:not(:last-child) {
  border-bottom: 1px solid #f1f5f9;
}

.card-action-btn.edit-btn:hover {
  background: #eff6ff;
  color: #2563eb;
}

.card-action-btn.revoke-btn:hover {
  background: #fef2f2;
  color: #dc2626;
}

.card-action-btn.delete-btn:hover {
  background: #fef2f2;
  color: #b91c1c;
}
</style>
