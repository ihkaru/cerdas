<template>
  <f7-page no-navbar no-toolbar class="join-page">
    <div class="gradient-bg"></div>
    <div class="content-wrapper">
      <div class="glass-card">
        <div class="logo-area">
          <div class="logo-circle">
            <f7-icon f7="paperplane_fill" size="48" color="blue" />
          </div>
          <h1>Cerdas</h1>
          <p class="subtitle">Survey & Data Collection Platform</p>
        </div>

        <div v-if="loading" class="info-section">
          <f7-preloader />
          <p>Verifying invitation...</p>
        </div>

        <div v-else-if="error" class="info-section error">
          <f7-icon f7="exclamationmark_triangle_fill" size="48" color="red" />
          <h2>Invalid Link</h2>
          <p>{{ error }}</p>
          <f7-button fill large href="/">Back to Home</f7-button>
        </div>

        <div v-else-if="appData" class="info-section">
          <div class="invite-badge">You're Invited</div>
          <h2 class="app-name">{{ appData.app_name }}</h2>
          <p class="app-desc">{{ appData.app_description || 'Join this application to start contributing data.' }}</p>

          <div class="role-chip">
            <f7-icon f7="person_crop_circle_fill" size="18" />
            <span>Join as {{ appData.role }}</span>
          </div>

          <div class="action-grid">
            <f7-button fill large class="btn-android" @click="downloadApk">
              <f7-icon f7="logo_android" size="24" />
              <div class="btn-text">
                <span class="btn-small">Download for</span>
                <span class="btn-large">Android (APK)</span>
              </div>
            </f7-button>

            <f7-button v-if="!isAuthenticated" outline large class="btn-web" @click="openWeb">
              <f7-icon f7="globe" size="24" />
              <div class="btn-text">
                <span class="btn-small">Open in</span>
                <span class="btn-large">Web Browser</span>
              </div>
            </f7-button>

            <!-- If already logged in: Join Immediately -->
            <f7-button v-else fill large class="btn-join-now" @click="joinImmediately" :loading="joining" preloader>
              <f7-icon f7="checkmark_seal_fill" size="24" />
              <div class="btn-text">
                <span class="btn-small">Authenticated as {{ authStore.user?.email }}</span>
                <span class="btn-large">Join Now</span>
              </div>
            </f7-button>
          </div>

          <p class="footer-note">
            Already have the app? Open it directly from your home screen.
          </p>

          <!-- System Debug Info (Helper for development) -->
          <div class="system-status">
             <div class="status-item">
               <span class="dot" :class="{ 'active': googleLoaded }"></span>
               Google Library: {{ googleLoaded ? 'Ready' : 'Not Loaded' }}
             </div>
             <div class="status-item">
               <span class="dot" :class="{ 'active': isAuthenticated }"></span>
               Auth Status: {{ isAuthenticated ? 'Logged In' : 'Not Logged In' }}
             </div>
          </div>
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
const googleLoaded = ref(false);

onMounted(async () => {
  // Check if Google GSI library is loaded
  // We check periodically for a few seconds because it loads async
  const checkGoogle = setInterval(() => {
    if ((window as any).google?.accounts) {
      googleLoaded.value = true;
      clearInterval(checkGoogle);
    }
  }, 500);
  setTimeout(() => clearInterval(checkGoogle), 5000);

  try {
    const res = await apiClient.get(`/join/${props.token}`);
    // The API returns { success: true, data: { ... } }
    // apiClient already returns the JSON object, so res.data is the payload
    if (res.success && res.data) {
      appData.value = res.data;
    } else {
      error.value = res.message || 'The invitation link is invalid or has expired.';
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || 'The invitation link is invalid or has expired.';
  } finally {
    loading.value = false;
  }
});

function downloadApk() {
  // TODO: Link to actual latest APK URL from Release Please artifacts
  window.open('https://github.com/ihkaru/cerdas/releases/latest', '_blank');
}

function openWeb() {
  // Store token for later use during login
  localStorage.setItem('pending_join_token', props.token);
  
  // Transition to login
  f7.views.main.router.navigate('/login', {
    reloadCurrent: true
  });
}

const joining = ref(false);
async function joinImmediately() {
  try {
    joining.value = true;
    const res = await apiClient.post('/join', {
      token: props.token
    });
    
    if (res.success) {
      f7.toast.show({
        text: `Successfully joined ${appData.value.app_name}!`,
        cssClass: 'color-theme-green',
        closeTimeout: 3000
      });
      // Go to dashboard
      f7.views.main.router.navigate('/', { reloadCurrent: true, clearPreviousHistory: true });
    }
  } catch (e: any) {
    f7.dialog.alert(e.message || 'Failed to join app', 'Error');
  } finally {
    joining.value = false;
  }
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
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  clip-path: ellipse(150% 100% at 50% -50%);
  z-index: 0;
}

.content-wrapper {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  width: 100%;
  max-width: 450px;
  padding: 40px 30px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  text-align: center;
}

.logo-area {
  margin-bottom: 30px;
}

.logo-circle {
  width: 100px;
  height: 100px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.2);
}

.logo-area h1 {
  font-size: 32px;
  font-weight: 800;
  margin: 0;
  color: #1e3a8a;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

.invite-badge {
  display: inline-block;
  background: #dcfce7;
  color: #15803d;
  font-weight: 700;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 100px;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.app-name {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 12px;
}

.app-desc {
  font-size: 16px;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 24px;
}

.role-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
  padding: 8px 16px;
  border-radius: 12px;
  color: #475569;
  font-weight: 600;
  margin-bottom: 32px;
}

.action-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 24px;
}

.btn-android {
  --f7-button-bg-color: #1e3a8a;
  --f7-button-hover-bg-color: #1e40af;
  height: auto;
  padding: 12px 24px;
}

.btn-web {
  height: auto;
  padding: 12px 24px;
}

.btn-join-now {
  --f7-button-bg-color: #15803d;
  --f7-button-hover-bg-color: #166534;
  height: auto;
  padding: 12px 24px;
}

.btn-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: 12px;
  text-align: left;
}

.btn-small {
  font-size: 10px;
  text-transform: uppercase;
  opacity: 0.8;
  font-weight: 400;
  line-height: 1;
}

.btn-large {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}

.system-status {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
  gap: 16px;
}

.status-item {
  font-size: 11px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #cbd5e1;
}

.dot.active {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
}
</style>
