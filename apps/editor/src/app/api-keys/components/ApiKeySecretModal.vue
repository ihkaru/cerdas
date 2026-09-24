<template>
  <f7-popup class="api-key-secret-popup" :opened="opened" @popup:closed="onClose">
    <f7-page>
      <f7-navbar title="Kunci Rahasia API Dibuat">
        <f7-nav-right>
          <f7-link @click="onClose">Selesai</f7-link>
        </f7-nav-right>
      </f7-navbar>

      <div class="secret-modal-content">
        <!-- Security Alert Banner -->
        <div class="security-warning">
          <f7-icon f7="exclamationmark_triangle_fill" size="24" color="orange" />
          <div class="warning-text">
            <strong>Peringatan Keamanan Kritis</strong>
            <p>
              Salin kunci API ini sekarang. Untuk alasan keamanan, sistem tidak menyimpan teks mentah kunci ini dan Anda <strong>tidak akan dapat melihatnya lagi</strong> setelah menutup jendela ini.
            </p>
          </div>
        </div>

        <!-- Key Meta -->
        <div class="key-summary-card" v-if="apiKey">
          <div class="summary-row">
            <span class="summary-label">Nama Kunci:</span>
            <span class="summary-val font-semibold">{{ apiKey.name }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Environment:</span>
            <span class="badge" :class="apiKey.environment === 'live' ? 'color-green' : 'color-purple'">
              {{ apiKey.environment.toUpperCase() }}
            </span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Masa Berlaku:</span>
            <span class="summary-val">{{ formatExpiry(apiKey.expiresAt) }}</span>
          </div>
        </div>

        <!-- Token Box -->
        <div class="token-display-box">
          <label class="token-label">Kunci Rahasia (API Secret Token)</label>
          <div class="token-input-group">
            <input
              type="text"
              readonly
              :value="secretToken"
              class="token-input"
              ref="tokenInputRef"
            />
            <button class="copy-btn" @click="copyToken">
              <f7-icon :f7="copied ? 'checkmark' : 'doc_on_doc'" size="16" />
              <span>{{ copied ? 'Tersalin!' : 'Salin' }}</span>
            </button>
          </div>
          <div class="token-format-hint">
            Format standar industri: <code>crd_{{ apiKey?.environment || 'live' }}_[token]</code>
          </div>
        </div>

        <!-- Quick Start Snippet -->
        <div class="snippet-box">
          <div class="snippet-header">
            <span>Contoh Header Autentikasi HTTP</span>
          </div>
          <pre class="snippet-code"><code>Authorization: Bearer {{ secretToken }}</code></pre>
        </div>

        <div class="modal-actions">
          <f7-button fill large @click="onClose" class="done-btn">
            Saya Telah Menyimpan Kunci Ini dengan Aman
          </f7-button>
        </div>
      </div>
    </f7-page>
  </f7-popup>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { f7 } from 'framework7-vue';
import type { ApiKey } from '../domain/models/ApiKey';

const props = defineProps<{
  opened: boolean;
  apiKey: ApiKey | null;
  secretToken: string;
}>();

const emit = defineEmits<{
  'update:opened': [value: boolean];
  'closed': [];
}>();

const copied = ref(false);
const tokenInputRef = ref<HTMLInputElement | null>(null);

function formatExpiry(isoDate: string | null): string {
  if (!isoDate) return 'Tidak pernah kedaluwarsa';
  return new Date(isoDate).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

async function copyToken() {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(props.secretToken);
    } else if (tokenInputRef.value) {
      tokenInputRef.value.select();
      document.execCommand('copy');
    }
    copied.value = true;
    f7.toast.create({
      text: 'Kunci API berhasil disalin ke clipboard!',
      position: 'center',
      closeTimeout: 2000,
      cssClass: 'color-green',
    }).open();
    setTimeout(() => {
      copied.value = false;
    }, 3000);
  } catch (err) {
    f7.dialog.alert(`Gagal menyalin otomatis: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function onClose() {
  emit('update:opened', false);
  emit('closed');
}
</script>

<style scoped>
.secret-modal-content {
  padding: 24px;
  max-width: 640px;
  margin: 0 auto;
}

.security-warning {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.warning-text strong {
  display: block;
  font-size: 14px;
  color: #92400e;
  margin-bottom: 4px;
}

.warning-text p {
  margin: 0;
  font-size: 13px;
  color: #b45309;
  line-height: 1.5;
}

.key-summary-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
}

.summary-row:not(:last-child) {
  border-bottom: 1px dashed #e2e8f0;
}

.summary-label {
  color: #64748b;
}

.summary-val {
  color: #1e293b;
}

.token-display-box {
  margin-bottom: 20px;
}

.token-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.token-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 4px 6px 4px 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.token-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13.5px;
  color: #0f172a;
  word-break: break-all;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.copy-btn:hover {
  background: #1d4ed8;
}

.token-format-hint {
  font-size: 11.5px;
  color: #64748b;
  margin-top: 6px;
}

.token-format-hint code {
  background: #f1f5f9;
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 11px;
}

.snippet-box {
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;
}

.snippet-header {
  font-size: 11px;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 8px;
  font-weight: 600;
}

.snippet-code {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  overflow-x: auto;
  color: #38bdf8;
}

.modal-actions {
  margin-top: 16px;
}

.done-btn {
  --f7-button-bg-color: #059669;
  --f7-button-hover-bg-color: #047857;
  border-radius: 8px;
  font-weight: 600;
}
</style>
