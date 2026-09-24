<template>
  <f7-popup class="edit-api-key-popup" :opened="opened" @popup:closed="onClose">
    <f7-page>
      <f7-navbar title="Ubah Konfigurasi API Key">
        <f7-nav-right>
          <f7-link @click="onClose">Tutup</f7-link>
        </f7-nav-right>
      </f7-navbar>

      <form v-if="apiKey" @submit.prevent="handleSubmit" class="edit-key-form">
        <!-- Key Identification Header -->
        <div class="key-summary-header">
          <div class="key-identity">
            <span class="key-prefix">{{ apiKey.maskedKey }}</span>
            <span
              class="badge"
              :class="apiKey.environment === 'live' ? 'color-green' : 'color-purple'"
            >
              {{ apiKey.environment.toUpperCase() }}
            </span>
          </div>
          <div class="key-dates">
            <span>Dibuat: {{ formatDate(apiKey.createdAt) }}</span>
            <span v-if="apiKey.lastUsedAt">• Terakhir digunakan: {{ formatDate(apiKey.lastUsedAt) }}</span>
          </div>
        </div>

        <!-- Name Input -->
        <div class="form-section">
          <label class="section-label">Nama API Key <span class="required">*</span></label>
          <input
            type="text"
            v-model="form.name"
            class="form-text-input"
            required
          />
        </div>

        <!-- Status Toggle -->
        <div class="form-section">
          <label class="section-label">Status Kunci</label>
          <div class="status-options">
            <label class="status-radio-label" :class="{ selected: form.status === 'active' }">
              <input type="radio" value="active" v-model="form.status" />
              <span class="status-indicator active"></span>
              <span>Aktif (Active)</span>
            </label>
            <label class="status-radio-label" :class="{ selected: form.status === 'revoked' }">
              <input type="radio" value="revoked" v-model="form.status" />
              <span class="status-indicator revoked"></span>
              <span>Dicabut (Revoked)</span>
            </label>
          </div>
        </div>

        <!-- Scopes -->
        <div class="form-section">
          <div class="scopes-header">
            <label class="section-label" style="margin-bottom: 0;">Hak Akses (Scopes)</label>
            <div class="scope-quick-actions">
              <button type="button" class="text-btn" @click="selectAllScopes">Pilih Semua</button>
              <span class="sep">|</span>
              <button type="button" class="text-btn" @click="clearAllScopes">Kosongkan</button>
            </div>
          </div>

          <div class="scopes-container">
            <div
              v-for="scope in STANDARD_API_SCOPES"
              :key="scope.id"
              class="scope-row"
              :class="{ selected: form.scopes.includes(scope.id) }"
              @click="toggleScope(scope.id)"
            >
              <input
                type="checkbox"
                :checked="form.scopes.includes(scope.id)"
                @click.stop
                @change="toggleScope(scope.id)"
                class="scope-checkbox"
              />
              <div class="scope-info">
                <div class="scope-top">
                  <span class="scope-name">{{ scope.name }}</span>
                  <code class="scope-id">{{ scope.id }}</code>
                </div>
                <div class="scope-desc">{{ scope.description }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- IP Whitelist -->
        <div class="form-section">
          <label class="section-label">IP Whitelist / Batasan Jaringan</label>
          <input
            type="text"
            v-model="ipWhitelistText"
            class="form-text-input"
            placeholder="Contoh: 192.168.1.100, 10.0.0.0/24"
          />
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <f7-button outline @click="onClose" class="cancel-btn">Batal</f7-button>
          <f7-button
            fill
            type="submit"
            :loading="submitting"
            :disabled="submitting || !canSubmit"
            class="submit-btn"
          >
            Simpan Perubahan
          </f7-button>
        </div>
      </form>
    </f7-page>
  </f7-popup>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  STANDARD_API_SCOPES,
  type ApiKey,
  type ApiKeyStatus,
  type UpdateApiKeyInput,
} from '../domain/models/ApiKey';

const props = defineProps<{
  opened: boolean;
  apiKey: ApiKey | null;
  submitting?: boolean;
}>();

const emit = defineEmits<{
  'update:opened': [value: boolean];
  'submit': [id: string, payload: UpdateApiKeyInput];
}>();

const form = reactive<{
  name: string;
  status: ApiKeyStatus;
  scopes: string[];
}>({
  name: '',
  status: 'active',
  scopes: [],
});

const ipWhitelistText = ref('');

const canSubmit = computed(() => {
  return form.name.trim().length > 0 && form.scopes.length > 0;
});

watch(
  () => props.apiKey,
  (k) => {
    if (k) {
      form.name = k.name;
      form.status = k.status;
      form.scopes = [...k.scopes];
      ipWhitelistText.value = (k.ipWhitelist || []).join(', ');
    }
  },
  { immediate: true }
);

function toggleScope(scopeId: string) {
  const index = form.scopes.indexOf(scopeId);
  if (index >= 0) {
    form.scopes.splice(index, 1);
  } else {
    form.scopes.push(scopeId);
  }
}

function selectAllScopes() {
  form.scopes = STANDARD_API_SCOPES.map((s) => s.id);
}

function clearAllScopes() {
  form.scopes = [];
}

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function handleSubmit() {
  if (!props.apiKey || !canSubmit.value) return;

  const ipWhitelist = ipWhitelistText.value
    ? ipWhitelistText.value.split(',').map((s) => s.trim()).filter(Boolean)
    : undefined;

  emit('submit', props.apiKey.id, {
    name: form.name.trim(),
    status: form.status,
    scopes: [...form.scopes],
    ipWhitelist,
  });
}

function onClose() {
  emit('update:opened', false);
}
</script>

<style scoped>
.edit-key-form {
  padding: 24px;
  max-width: 680px;
  margin: 0 auto;
}

.key-summary-header {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 24px;
}

.key-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.key-prefix {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.key-dates {
  font-size: 12px;
  color: #64748b;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.form-section {
  margin-bottom: 24px;
}

.section-label {
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.required {
  color: #ef4444;
}

.form-text-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  color: #0f172a;
  background: white;
  outline: none;
  box-sizing: border-box;
}

.form-text-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.status-options {
  display: flex;
  gap: 16px;
}

.status-radio-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 13.5px;
  color: #334155;
  transition: all 0.15s;
}

.status-radio-label:hover {
  border-color: #cbd5e1;
}

.status-radio-label.selected {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1e40af;
  font-weight: 500;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.active {
  background: #16a34a;
}

.status-indicator.revoked {
  background: #ef4444;
}

/* Scopes Container */
.scopes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.scope-quick-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.text-btn {
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
}

.text-btn:hover {
  text-decoration: underline;
}

.sep {
  color: #cbd5e1;
}

.scopes-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px;
  background: #fafafa;
}

.scope-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 6px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.scope-row:hover {
  border-color: #cbd5e1;
}

.scope-row.selected {
  border-color: #93c5fd;
  background: #eff6ff;
}

.scope-checkbox {
  margin-top: 3px;
  cursor: pointer;
}

.scope-info {
  flex: 1;
}

.scope-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.scope-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.scope-id {
  font-size: 11px;
  background: #f1f5f9;
  color: #475569;
  padding: 1px 5px;
  border-radius: 4px;
}

.scope-desc {
  font-size: 11.5px;
  color: #64748b;
  line-height: 1.35;
}

/* Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.cancel-btn {
  --f7-button-text-color: #64748b;
  --f7-button-border-color: #cbd5e1;
  border-radius: 8px;
  padding: 0 20px;
  height: 40px;
}

.submit-btn {
  --f7-button-bg-color: #2563eb;
  --f7-button-hover-bg-color: #1d4ed8;
  border-radius: 8px;
  padding: 0 24px;
  height: 40px;
  font-weight: 600;
}
</style>
