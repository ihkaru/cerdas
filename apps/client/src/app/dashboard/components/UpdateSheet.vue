<template>
  <f7-sheet
    v-model:opened="isOpened"
    class="update-sheet"
    style="height: auto"
    swipe-to-close
    backdrop
  >
    <div class="sheet-modal-inner">
      <div class="page-content">
        <div class="block-title block-title-large margin-top">
          <div class="display-flex align-items-center">
            <f7-icon f7="cloud_download_fill" class="margin-right-half color-primary" size="28" />
            Update Tersedia
          </div>
        </div>
        
        <div class="block no-margin-top">
          <p class="no-margin-bottom text-color-secondary">
            Versi baru <b>v{{ metadata?.version }}</b> telah dirilis. 
            Mungkin diperlukan waktu beberapa saat untuk memperbarui aplikasi.
          </p>
          
          <div v-if="metadata?.changelog?.length" class="changelog-box margin-top">
            <div class="changelog-title">Apa yang baru:</div>
            <ul>
              <li v-for="(item, index) in metadata.changelog" :key="index">{{ item }}</li>
            </ul>
          </div>

          <!-- SMART WARNING AREA -->
          <div v-if="unsyncedCount > 0" class="warning-card margin-top">
            <div class="warning-header">
              <f7-icon f7="exclamationmark_triangle_fill" size="20" color="orange" />
              <span>Penting: Data Belum Terkirim</span>
            </div>
            <div class="warning-body">
              Ada <b>{{ unsyncedCount }}</b> data yang belum disinkronisasi ke server. 
              Melakukan update sekarang dapat berisiko menghapus data lokal jika proses gagal atau cache dibersihkan.
            </div>
            <f7-button 
              large 
              fill 
              color="orange" 
              class="margin-top-half"
              @click="goToSync"
            >
              Kirim Data Sekarang
            </f7-button>
          </div>

          <div v-else class="success-card margin-top">
            <div class="success-header">
              <f7-icon f7="checkmark_seal_fill" size="20" color="green" />
              <span>Semua data sudah aman</span>
            </div>
            <div class="success-body">
              Aman untuk melakukan update sekarang.
            </div>
          </div>

          <div class="display-flex margin-top gap-half">
            <f7-button 
              large 
              outline 
              class="flex-1"
              @click="close"
              v-if="!metadata?.force_update"
            >
              Nanti Saja
            </f7-button>
            <f7-button 
              large 
              fill 
              class="flex-2"
              :color="unsyncedCount > 0 ? 'gray' : 'primary'"
              @click="handleUpdate"
            >
              {{ isNativeUpdate ? 'Download APK (GitHub)' : 'Update & Restart' }}
            </f7-button>
          </div>
          
          <div v-if="unsyncedCount > 0" class="text-align-center margin-top-half">
            <small class="text-color-secondary">Disarankan untuk Sync data terlebih dahulu.</small>
          </div>
        </div>
      </div>
    </div>
  </f7-sheet>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { f7, f7Sheet, f7Icon, f7Button } from 'framework7-vue';
import { updateService } from '@/common/services/UpdateService';
import type { AppVersionMetadata, UpdateState } from '@/common/services/UpdateService';
import { syncService } from '@/common/services/SyncService';

const isOpened = ref(false);
const metadata = ref<AppVersionMetadata | null>(null);
const updateState = ref<UpdateState>('idle');
const unsyncedCount = ref(0);

const isNativeUpdate = computed(() => updateState.value === 'required' && metadata.value?.min_native_version);

const handleUpdateDetected = async (event: any) => {
  const detail = event.detail;
  updateState.value = detail.state;
  metadata.value = detail.metadata;
  
  // Refresh unsynced count when update appears
  unsyncedCount.value = await syncService.getUnsyncedCount();
  
  isOpened.value = true;
};

const goToSync = () => {
  isOpened.value = false;
  f7.view.main.router.navigate('/sync/');
};

const handleUpdate = () => {
  updateService.performUpdate();
};

const close = () => {
  updateService.dismiss();
  isOpened.value = false;
};

onMounted(() => {
  window.addEventListener('app-update-available', handleUpdateDetected);
});

onUnmounted(() => {
  window.removeEventListener('app-update-available', handleUpdateDetected);
});
</script>

<style scoped>
.update-sheet {
  --f7-sheet-height: auto;
  border-radius: 24px 24px 0 0;
  overflow: hidden;
}

.changelog-box {
  background: rgba(var(--f7-theme-color-rgb), 0.05);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(var(--f7-theme-color-rgb), 0.1);
}

.changelog-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.changelog-box ul {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: var(--f7-theme-color);
}

.warning-card {
  background: #fff8eb;
  border: 1px solid #ffe8cc;
  padding: 16px;
  border-radius: 16px;
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e67e22;
  font-weight: 700;
  margin-bottom: 4px;
}

.warning-body {
  font-size: 13px;
  line-height: 1.4;
  color: #a66d3b;
}

.success-card {
  background: #f0fdf4;
  border: 1px solid #dcfce7;
  padding: 16px;
  border-radius: 16px;
}

.success-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #16a34a;
  font-weight: 700;
  margin-bottom: 4px;
}

.success-body {
  font-size: 13px;
  color: #15803d;
}

.gap-half {
  gap: 8px;
}
</style>
