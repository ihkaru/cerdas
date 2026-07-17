<template>
  <f7-page no-navbar no-toolbar class="join-page">
    <div class="gradient-bg"></div>
    <div class="content-wrapper">
      <div class="glass-card">
        <!-- Logo Header -->
        <div class="logo-area">
          <div class="logo-circle">
            <f7-icon f7="paperplane_fill" size="44" color="blue" />
          </div>
          <h1 class="brand-title">Cerdas</h1>
          <p class="subtitle">Platform Survey & Pengumpulan Data</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="info-section">
          <f7-preloader size="36" />
          <p class="loading-text">Memverifikasi tautan undangan...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="info-section error">
          <f7-icon f7="exclamationmark_triangle_fill" size="48" color="red" />
          <h2>Tautan Tidak Valid</h2>
          <p>{{ error }}</p>
          <f7-button fill large href="/" class="margin-top">Kembali ke Beranda</f7-button>
        </div>

        <!-- Main Content Section -->
        <div v-else-if="appData" class="info-section">
          
          <!-- STATE C: SUCCESS / ALREADY JOINED -->
          <template v-if="joinedSuccess">
            <div class="success-banner margin-bottom">
              <div class="success-icon-wrap">
                <f7-icon f7="checkmark_seal_fill" size="52" color="green" />
              </div>
              <h2 class="app-name margin-top-half">Berhasil Bergabung!</h2>
              <p class="app-desc">
                Akun <strong>{{ authStore.user?.email }}</strong> kini resmi terdaftar sebagai 
                <span class="role-highlight">{{ appData.role }}</span> di <strong>{{ appData.app_name }}</strong>.
              </p>
            </div>

            <div class="action-grid">
              <f7-button fill large class="btn-primary-launch" @click="goToDashboard">
                <f7-icon f7="globe" size="22" />
                <span>Buka Aplikasi di Web</span>
              </f7-button>

              <f7-button outline large class="btn-secondary-apk" @click="downloadApk">
                <f7-icon f7="logo_android" size="22" />
                <span>Unduh APK Android</span>
              </f7-button>
            </div>

            <p class="footer-note margin-top">
              💡 <em>Jika Anda bertugas di lapangan, unduh APK Android dan login dengan akun yang sama.</em>
            </p>
          </template>

          <!-- STATE A & B: PRE-JOIN INVITATION -->
          <template v-else>
            <div class="invite-badge">Undangan Masuk</div>
            <h2 class="app-name">{{ appData.app_name }}</h2>
            <p class="app-desc">{{ appData.app_description || 'Bergabung dengan aplikasi ini untuk memulai pendataan.' }}</p>

            <div class="role-chip margin-bottom">
              <f7-icon f7="person_crop_circle_fill" size="18" />
              <span>Peran: <strong>{{ appData.role }}</strong></span>
            </div>

            <!-- STATE B: LOGGED IN (MUST CLICK JOIN) -->
            <div v-if="isAuthenticated" class="auth-card margin-bottom">
              <div class="user-info">
                <f7-icon f7="person_circle" size="28" color="blue" />
                <div class="user-text">
                  <span class="user-label">Akun Aktif:</span>
                  <span class="user-email">{{ authStore.user?.email }}</span>
                </div>
              </div>
              <button type="button" class="btn-switch-account" @click="switchAccount">
                Ganti Akun
              </button>
            </div>

            <div class="action-grid">
              <!-- STATE B BUTTON: Explicit Join CTA -->
              <f7-button v-if="isAuthenticated" fill large class="btn-join-now" @click="joinImmediately" :loading="joining" preloader>
                <f7-icon f7="checkmark_circle_fill" size="24" />
                <span>Terima Undangan & Bergabung</span>
              </f7-button>

              <!-- STATE A BUTTON: Log in to Join CTA -->
              <f7-button v-else fill large class="btn-login-to-join" @click="openWeb">
                <f7-icon f7="lock_fill" size="22" />
                <span>Masuk / Daftar untuk Bergabung</span>
              </f7-button>
            </div>

            <!-- Helpful Guidance to Prevent Confused APK Download -->
            <div class="step-guide margin-top">
              <p class="guide-title">📋 Alur Bergabung:</p>
              <ol class="guide-list">
                <li>Klik <strong>{{ isAuthenticated ? 'Terima Undangan & Bergabung' : 'Masuk / Daftar' }}</strong> terlebih dahulu.</li>
                <li>Setelah berhasil bergabung, Anda dapat memilih membuka via Web atau mengunduh APK Android.</li>
              </ol>
            </div>
          </template>

        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { apiClient } from '@/common/api/ApiClient';
import { f7 } from 'framework7-vue';
import { useAuthStore } from '@/common/stores/authStore';

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);

const props = defineProps<{
  token: string;
}>();

const loading = ref(true);
const error = ref<string | null>(null);
const appData = ref<any>(null);
const joining = ref(false);
const joinedSuccess = ref(false);

onMounted(async () => {
  // Always store token immediately on landing so even if redirected to login, token is preserved!
  if (props.token) {
    localStorage.setItem('pending_join_token', props.token);
    localStorage.setItem('pending_join_token_at', Date.now().toString());
  }

  try {
    // Verify session validity if we think we are logged in
    if (authStore.isAuthenticated) {
      const isValid = await authStore.verifySession();
      if (!isValid) {
        authStore.clearAuth();
      }
    }

    const res = await apiClient.get(`/join/${props.token}`);
    if (res.success && res.data) {
      appData.value = res.data;
      // Check if user is already a member
      if (res.data.is_already_member && isAuthenticated.value) {
        joinedSuccess.value = true;
      }
    } else {
      error.value = res.message || 'Tautan undangan tidak valid atau sudah kedaluwarsa.';
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Tautan undangan tidak valid atau sudah kedaluwarsa.';
  } finally {
    loading.value = false;
  }
});

function downloadApk() {
  window.open('https://github.com/ihkaru/cerdas/releases/latest', '_blank', 'noopener,noreferrer');
}

function openWeb() {
  // Store token for automatic join after login
  localStorage.setItem('pending_join_token', props.token);
  localStorage.setItem('pending_join_token_at', Date.now().toString());
  
  // Navigate to login
  f7.views.main.router.navigate('/login', {
    reloadCurrent: true
  });
}

function switchAccount() {
  authStore.clearAuth();
  openWeb();
}

async function joinImmediately() {
  try {
    joining.value = true;
    const res = await apiClient.post('/join', {
      token: props.token
    });
    
    if (res.success) {
      joinedSuccess.value = true;
      localStorage.removeItem('sync_global');
      f7.toast.show({
        text: `Berhasil bergabung ke ${appData.value.app_name}!`,
        cssClass: 'color-theme-green',
        closeTimeout: 3000
      });
    }
  } catch (e: any) {
    f7.dialog.alert(e.message || 'Gagal bergabung dengan aplikasi', 'Error');
  } finally {
    joining.value = false;
  }
}

function goToDashboard() {
  f7.views.main.router.navigate('/', { reloadCurrent: true, clearPreviousHistory: true });
}
</script>

<style scoped>
.join-page {
  --f7-page-bg-color: #f0f2f5;
  background: #f0f2f5;
}

.gradient-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #3b82f6 100%);
  clip-path: ellipse(150% 100% at 50% -50%);
  z-index: 0;
}

.content-wrapper {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 24px 16px;
  box-sizing: border-box;
}

.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  border-radius: 24px;
  padding: 32px 24px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.6);
  text-align: center;
}

.logo-area {
  margin-bottom: 24px;
}

.logo-circle {
  width: 72px;
  height: 72px;
  background: #eff6ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.brand-title {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 4px 0 0;
}

.info-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.invite-badge {
  display: inline-block;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.app-name {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}

.app-desc {
  font-size: 14px;
  color: #475569;
  margin: 0 0 16px;
  line-height: 1.5;
}

.role-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  color: #334155;
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 13px;
}

.auth-card {
  width: 100%;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  overflow: hidden;
}

.user-text {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

.user-email {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-switch-account {
  background: transparent;
  border: none;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.btn-switch-account:hover {
  background: #eff6ff;
}

.action-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.btn-join-now,
.btn-login-to-join,
.btn-primary-launch {
  --f7-button-bg-color: #2563eb;
  --f7-button-pressed-bg-color: #1d4ed8;
  height: 50px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 15px;
  text-transform: none;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
}

.btn-secondary-apk {
  --f7-button-border-color: #94a3b8;
  --f7-button-text-color: #334155;
  height: 48px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 14px;
  text-transform: none;
}

.step-guide {
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px 16px;
  text-align: left;
  width: 100%;
  box-sizing: border-box;
}

.guide-title {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  margin: 0 0 6px;
}

.guide-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.6;
}

.success-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.success-icon-wrap {
  width: 72px;
  height: 72px;
  background: #f0fdf4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.role-highlight {
  color: #16a34a;
  font-weight: 700;
}

.footer-note {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}
</style>
