<template>
  <f7-popup class="api-docs-popup" :opened="opened" @popup:closed="onClose">
    <f7-page>
      <f7-navbar title="Dokumentasi &amp; Standar REST API Cerdas">
        <f7-nav-right>
          <f7-link @click="onClose">Tutup</f7-link>
        </f7-nav-right>
      </f7-navbar>

      <div class="api-docs-container">
        <!-- Overview Header -->
        <header class="docs-hero">
          <div class="hero-badge">Standar Industri Modern (September 2026)</div>
          <h1>Cerdas Open REST API Documentation</h1>
          <p>
            Gunakan API Key untuk mengintegrasikan data survei, sinkronisasi skema, dan otomatisasi alur kerja Anda ke platform eksternal seperti PowerBI, Zapier, Python scripts, atau backend internal.
          </p>
          <div class="base-url-card">
            <span class="base-label">Base URL:</span>
            <code class="base-value">{{ apiBaseUrl }}</code>
          </div>
        </header>

        <!-- Authentication Section -->
        <section class="docs-section">
          <h2>1. Autentikasi (Bearer Token)</h2>
          <p>
            Kirimkan API Key Anda di setiap permintaan HTTP melalui header <code>Authorization</code> menggunakan skema <code>Bearer</code>.
          </p>
          <div class="code-block-container">
            <div class="code-header">
              <span>Header Format</span>
              <button class="copy-snippet-btn" @click="copySnippet('Authorization: Bearer crd_live_YOUR_API_KEY')">
                <f7-icon f7="doc_on_doc" size="13" />
                Salin
              </button>
            </div>
            <pre><code>Authorization: Bearer crd_live_YOUR_API_KEY</code></pre>
          </div>
          <div class="callout callout-info">
            <strong>Prefix Konvensi:</strong> Kunci produksi menggunakan awalan <code>crd_live_</code> dan sandbox menggunakan <code>crd_test_</code>. Format ini kompatibel dengan automated secret scanning (GitHub, TruffleHog).
          </div>
        </section>

        <!-- Rate Limits & Standard Headers -->
        <section class="docs-section">
          <h2>2. Rate Limits &amp; Standar Respon</h2>
          <p>
            Sistem menerapkan batas laju permintaan per API Key dengan header standar IETF:
          </p>
          <div class="specs-table-wrapper">
            <table class="specs-table">
              <thead>
                <tr>
                  <th>Header HTTP</th>
                  <th>Keterangan</th>
                  <th>Contoh Nilai</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>RateLimit-Limit</code></td>
                  <td>Batas kuota kuantitas request per menit</td>
                  <td><code>1200</code></td>
                </tr>
                <tr>
                  <td><code>RateLimit-Remaining</code></td>
                  <td>Sisa kuota panggilan pada jendela waktu aktif</td>
                  <td><code>1185</code></td>
                </tr>
                <tr>
                  <td><code>RateLimit-Reset</code></td>
                  <td>Detik tersisa hingga kuota jendela waktu di-reset</td>
                  <td><code>42</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Interactive Endpoints -->
        <section class="docs-section">
          <h2>3. Katalog Endpoint API</h2>

          <!-- Language Selector -->
          <div class="snippet-lang-bar">
            <span class="lang-label">Pilih Bahasa Pemrograman:</span>
            <div class="lang-pills">
              <button
                type="button"
                class="lang-pill"
                :class="{ active: selectedLang === 'curl' }"
                @click="selectedLang = 'curl'"
              >
                cURL
              </button>
              <button
                type="button"
                class="lang-pill"
                :class="{ active: selectedLang === 'ts' }"
                @click="selectedLang = 'ts'"
              >
                TypeScript / Fetch
              </button>
              <button
                type="button"
                class="lang-pill"
                :class="{ active: selectedLang === 'python' }"
                @click="selectedLang = 'python'"
              >
                Python (requests)
              </button>
            </div>
          </div>

          <div class="endpoints-list">
            <!-- Endpoint 1: List Apps -->
            <div class="endpoint-card">
              <div class="endpoint-top">
                <span class="http-badge get">GET</span>
                <span class="endpoint-path">/api/v1/apps</span>
                <span class="scope-required">Scope: <code>apps:read</code></span>
              </div>
              <div class="endpoint-desc">Mendapatkan seluruh daftar aplikasi dan metadata ringkasnya.</div>
              <div class="code-block-container">
                <div class="code-header">
                  <span>{{ formatTitle('apps') }}</span>
                  <button class="copy-snippet-btn" @click="copySnippet(formatSnippet('apps'))">
                    <f7-icon f7="doc_on_doc" size="13" />
                    Salin
                  </button>
                </div>
                <pre><code>{{ formatSnippet('apps') }}</code></pre>
              </div>
            </div>

            <!-- Endpoint 2: Get Table Records -->
            <div class="endpoint-card">
              <div class="endpoint-top">
                <span class="http-badge get">GET</span>
                <span class="endpoint-path">/api/v1/tables/{tableId}/records</span>
                <span class="scope-required">Scope: <code>records:read</code></span>
              </div>
              <div class="endpoint-desc">Mengambil baris data kuesioner/survei lapangan dengan paginasi dan filter status.</div>
              <div class="code-block-container">
                <div class="code-header">
                  <span>{{ formatTitle('records') }}</span>
                  <button class="copy-snippet-btn" @click="copySnippet(formatSnippet('records'))">
                    <f7-icon f7="doc_on_doc" size="13" />
                    Salin
                  </button>
                </div>
                <pre><code>{{ formatSnippet('records') }}</code></pre>
              </div>
            </div>

            <!-- Endpoint 3: Submit New Record -->
            <div class="endpoint-card">
              <div class="endpoint-top">
                <span class="http-badge post">POST</span>
                <span class="endpoint-path">/api/v1/tables/{tableId}/records</span>
                <span class="scope-required">Scope: <code>records:write</code></span>
              </div>
              <div class="endpoint-desc">Mengirimkan entri survei baru atau data baris ke tabel kuesioner.</div>
              <div class="code-block-container">
                <div class="code-header">
                  <span>{{ formatTitle('createRecord') }}</span>
                  <button class="copy-snippet-btn" @click="copySnippet(formatSnippet('createRecord'))">
                    <f7-icon f7="doc_on_doc" size="13" />
                    Salin
                  </button>
                </div>
                <pre><code>{{ formatSnippet('createRecord') }}</code></pre>
              </div>
            </div>

            <!-- Endpoint 4: Trigger 2-Way Sync -->
            <div class="endpoint-card">
              <div class="endpoint-top">
                <span class="http-badge post">POST</span>
                <span class="endpoint-path">/api/v1/tables/{tableId}/sync</span>
                <span class="scope-required">Scope: <code>sync:trigger</code></span>
              </div>
              <div class="endpoint-desc">Memicu sinkronisasi dua arah instan dengan Google Sheets secara asinkron.</div>
              <div class="code-block-container">
                <div class="code-header">
                  <span>{{ formatTitle('sync') }}</span>
                  <button class="copy-snippet-btn" @click="copySnippet(formatSnippet('sync'))">
                    <f7-icon f7="doc_on_doc" size="13" />
                    Salin
                  </button>
                </div>
                <pre><code>{{ formatSnippet('sync') }}</code></pre>
              </div>
            </div>
          </div>
        </section>

        <!-- Error Handling Spec -->
        <section class="docs-section">
          <h2>4. Standar Penanganan Error (RFC 7807)</h2>
          <p>
            Semua respon error menggunakan format <code>application/problem+json</code> standar industri:
          </p>
          <div class="code-block-container">
            <pre><code>{
  "type": "https://cerdas.com/errors/forbidden-scope",
  "title": "Forbidden Scope",
  "status": 403,
  "detail": "Kunci API tidak memiliki hak akses 'records:write' yang disyaratkan untuk endpoint ini.",
  "instance": "/api/v1/tables/tbl_01/records"
}</code></pre>
          </div>
        </section>
      </div>
    </f7-page>
  </f7-popup>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { f7 } from 'framework7-vue';
import { getApiBaseUrl } from '@/common/api/ApiClient';
import {
  type SnippetLang,
  getSnippet,
  getSnippetTitle,
} from '../domain/models/ApiDocsSnippets';

defineProps<{
  opened: boolean;
}>();

const emit = defineEmits<{
  'update:opened': [value: boolean];
}>();

const selectedLang = ref<SnippetLang>('curl');

const apiBaseUrl = computed(() => {
  return getApiBaseUrl();
});

function formatTitle(endpointKey: string): string {
  return getSnippetTitle(selectedLang.value, endpointKey);
}

function formatSnippet(endpointKey: string): string {
  return getSnippet(selectedLang.value, apiBaseUrl.value, endpointKey);
}

async function copySnippet(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    f7.toast
      .create({
        text: 'Cuplikan kode disalin!',
        position: 'center',
        closeTimeout: 1500,
        cssClass: 'color-green',
      })
      .open();
  } catch (err) {
    f7.dialog.alert(`Gagal menyalin: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function onClose() {
  emit('update:opened', false);
}
</script>

<style scoped>
.api-docs-container {
  max-width: 820px;
  margin: 0 auto;
  padding: 32px 24px 64px 24px;
}

.docs-hero {
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 24px;
  margin-bottom: 32px;
}

.hero-badge {
  display: inline-block;
  background: #eff6ff;
  color: #2563eb;
  font-size: 11.5px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.docs-hero h1 {
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 10px 0;
}

.docs-hero p {
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.base-url-card {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px 14px;
}

.base-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.base-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  color: #0284c7;
}

.docs-section {
  margin-bottom: 40px;
}

.docs-section h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.docs-section p {
  font-size: 13.5px;
  color: #475569;
  line-height: 1.6;
  margin: 0 0 14px 0;
}

.callout {
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 12.5px;
  line-height: 1.5;
  margin-top: 14px;
}

.callout-info {
  background: #f0fdf4;
  border-left: 3px solid #16a34a;
  color: #166534;
}

.specs-table-wrapper {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.specs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.specs-table th {
  background: #f8fafc;
  text-align: left;
  padding: 10px 14px;
  color: #475569;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
}

.specs-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}

.snippet-lang-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.lang-label {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

.lang-pills {
  display: flex;
  gap: 6px;
}

.lang-pill {
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 12px;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}

.lang-pill:hover {
  border-color: #94a3b8;
}

.lang-pill.active {
  background: #0f172a;
  border-color: #0f172a;
  color: white;
}

.endpoints-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.endpoint-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 18px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.endpoint-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.http-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.http-badge.get {
  background: #dbeafe;
  color: #1d4ed8;
}

.http-badge.post {
  background: #dcfce7;
  color: #15803d;
}

.endpoint-path {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.scope-required {
  margin-left: auto;
  font-size: 11.5px;
  color: #64748b;
}

.scope-required code {
  background: #f1f5f9;
  padding: 2px 5px;
  border-radius: 4px;
  color: #0f172a;
}

.endpoint-desc {
  font-size: 13px;
  color: #475569;
  margin-bottom: 12px;
}

.code-block-container {
  background: #0f172a;
  border-radius: 8px;
  overflow: hidden;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: #1e293b;
  font-size: 11.5px;
  color: #94a3b8;
}

.copy-snippet-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: 1px solid #334155;
  color: #cbd5e1;
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.15s;
}

.copy-snippet-btn:hover {
  background: #334155;
  color: white;
}

.code-block-container pre {
  margin: 0;
  padding: 14px;
  overflow-x: auto;
}

.code-block-container code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  color: #38bdf8;
  line-height: 1.5;
}
</style>
