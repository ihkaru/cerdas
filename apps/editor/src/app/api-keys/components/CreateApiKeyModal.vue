<template>
  <f7-popup class="create-api-key-popup" :opened="opened" @popup:closed="onClose">
    <f7-page>
      <f7-navbar title="Buat API Key Baru">
        <f7-nav-right>
          <f7-link @click="onClose">Tutup</f7-link>
        </f7-nav-right>
      </f7-navbar>

      <form @submit.prevent="handleSubmit" class="create-key-form">
        <!-- Name Input -->
        <div class="form-section">
          <label class="section-label">Nama API Key <span class="required">*</span></label>
          <input
            type="text"
            v-model="form.name"
            class="form-text-input"
            placeholder="Contoh: Mobile Sync Enumerator, Zapier Automation"
            required
          />
          <div class="hint-text">Beri nama deskriptif untuk memudahkan identifikasi tujuan kunci.</div>
        </div>

        <!-- Environment Selector -->
        <div class="form-section">
          <label class="section-label">Environment</label>
          <div class="env-toggle-group">
            <div
              class="env-card"
              :class="{ selected: form.environment === 'live' }"
              @click="form.environment = 'live'"
            >
              <div class="env-radio">
                <span class="radio-dot" v-if="form.environment === 'live'"></span>
              </div>
              <div class="env-info">
                <span class="env-title">Live (Production)</span>
                <span class="env-desc">Prefix <code>crd_live_</code>. Akses langsung data riil di sistem produksi.</span>
              </div>
            </div>

            <div
              class="env-card"
              :class="{ selected: form.environment === 'test' }"
              @click="form.environment = 'test'"
            >
              <div class="env-radio">
                <span class="radio-dot" v-if="form.environment === 'test'"></span>
              </div>
              <div class="env-info">
                <span class="env-title">Test (Sandbox)</span>
                <span class="env-desc">Prefix <code>crd_test_</code>. Aman untuk pengujian integrasi &amp; staging.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Expiration Presets -->
        <div class="form-section">
          <label class="section-label">Masa Berlaku (TTL / Expiration)</label>
          <div class="expiry-presets">
            <button
              type="button"
              v-for="preset in expiryPresets"
              :key="preset.label"
              class="preset-chip"
              :class="{ active: form.expiresInDays === preset.days }"
              @click="form.expiresInDays = preset.days"
            >
              {{ preset.label }}
              <span v-if="preset.recommended" class="recommended-badge">Rekomendasi</span>
            </button>
          </div>
          <div class="hint-text">
            Praktik terbaik industri menganjurkan rotasi kunci reguler setiap 30–90 hari.
          </div>
        </div>

        <!-- Scopes / Permissions -->
        <div class="form-section">
          <div class="scopes-header">
            <label class="section-label" style="margin-bottom: 0;">Hak Akses &amp; Cakupan (Scopes)</label>
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

        <!-- IP Whitelist (Optional) -->
        <div class="form-section">
          <label class="section-label">IP Whitelist / Batasan Jaringan (Opsional)</label>
          <input
            type="text"
            v-model="ipWhitelistText"
            class="form-text-input"
            placeholder="Contoh: 192.168.1.100, 10.0.0.0/24 (Pisahkan dengan koma)"
          />
          <div class="hint-text">Biarkan kosong untuk mengizinkan permintaan dari alamat IP mana pun.</div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <f7-button outline @click="onClose" class="cancel-btn">Batal</f7-button>
          <f7-button
            fill
            type="submit"
            :loading="submitting"
            :disabled="!canSubmit || submitting"
            class="submit-btn"
          >
            <f7-icon f7="key_fill" size="14" class="margin-right-half" />
            Buat API Key
          </f7-button>
        </div>
      </form>
    </f7-page>
  </f7-popup>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { f7 } from 'framework7-vue';
import {
  STANDARD_API_SCOPES,
  type ApiKeyEnvironment,
  type CreateApiKeyInput,
} from '../domain/models/ApiKey';

const props = defineProps<{
  opened: boolean;
  submitting?: boolean;
}>();

const emit = defineEmits<{
  'update:opened': [value: boolean];
  'submit': [payload: CreateApiKeyInput];
}>();

const form = reactive<{
  name: string;
  environment: ApiKeyEnvironment;
  scopes: string[];
  expiresInDays: number | null;
}>({
  name: '',
  environment: 'live',
  scopes: ['apps:read', 'tables:read', 'records:read', 'records:write'],
  expiresInDays: 30, // 2026 default best practice
});

const ipWhitelistText = ref('');

const expiryPresets = [
  { label: '30 Hari', days: 30, recommended: true },
  { label: '60 Hari', days: 60, recommended: false },
  { label: '90 Hari', days: 90, recommended: false },
  { label: '1 Tahun', days: 365, recommended: false },
  { label: 'Tanpa Batas', days: null, recommended: false },
];

const canSubmit = computed(() => {
  return form.name.trim().length > 0 && form.scopes.length > 0;
});

watch(
  () => props.opened,
  (val) => {
    if (val) {
      // Reset form
      form.name = '';
      form.environment = 'live';
      form.scopes = ['apps:read', 'tables:read', 'records:read', 'records:write'];
      form.expiresInDays = 30;
      ipWhitelistText.value = '';
    }
  }
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

function handleSubmit() {
  if (!canSubmit.value) {
    f7.dialog.alert('Harap isi nama API Key dan pilih minimal 1 cakupan (scope).');
    return;
  }

  const ipWhitelist = ipWhitelistText.value
    ? ipWhitelistText.value.split(',').map((s) => s.trim()).filter(Boolean)
    : undefined;

  emit('submit', {
    name: form.name.trim(),
    environment: form.environment,
    scopes: [...form.scopes],
    expiresInDays: form.expiresInDays,
    ipWhitelist,
  });
}

function onClose() {
  emit('update:opened', false);
}
</script>

<style scoped>
.create-key-form {
  padding: 24px;
  max-width: 680px;
  margin: 0 auto;
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
  transition: border-color 0.15s, box-shadow 0.15s;
}

.form-text-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.hint-text {
  font-size: 12px;
  color: #64748b;
  margin-top: 6px;
}

/* Env Toggle Group */
.env-toggle-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.env-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.env-card:hover {
  border-color: #94a3b8;
}

.env-card.selected {
  border-color: #2563eb;
  background: #eff6ff;
}

.env-radio {
  width: 18px;
  height: 18px;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

.env-card.selected .env-radio {
  border-color: #2563eb;
}

.radio-dot {
  width: 8px;
  height: 8px;
  background: #2563eb;
  border-radius: 50%;
}

.env-title {
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  color: #1e293b;
}

.env-desc {
  display: block;
  font-size: 11.5px;
  color: #64748b;
  margin-top: 2px;
  line-height: 1.4;
}

.env-desc code {
  background: rgba(0, 0, 0, 0.05);
  padding: 1px 4px;
  border-radius: 3px;
}

/* Expiry Presets */
.expiry-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 20px;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s;
}

.preset-chip:hover {
  border-color: #94a3b8;
}

.preset-chip.active {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
}

.recommended-badge {
  font-size: 10px;
  background: #dcfce7;
  color: #16a34a;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: 600;
}

.preset-chip.active .recommended-badge {
  background: white;
  color: #2563eb;
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
  max-height: 280px;
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
