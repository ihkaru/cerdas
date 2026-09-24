<template>
  <f7-popup class="user-profile-popup" :opened="opened" @popup:closed="emit('close')">
    <f7-page>
      <f7-navbar title="Profil Pengguna">
        <f7-nav-right>
          <f7-link @click="emit('close')">Tutup</f7-link>
        </f7-nav-right>
      </f7-navbar>

      <div class="profile-card-container">
        <div class="profile-avatar-circle">
          {{ userInitials }}
        </div>
        <h2 class="profile-name">{{ userName }}</h2>
        <div class="profile-email">{{ userEmail }}</div>
        <div class="profile-role-badge">Super Admin / Creator</div>

        <div class="profile-meta-list">
          <div class="meta-row">
            <span class="meta-label">Status Akun:</span>
            <span class="meta-val color-green">Aktif</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Otoritas:</span>
            <span class="meta-val">Full Editor Access</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Lingkungan:</span>
            <span class="meta-val font-mono">Production</span>
          </div>
        </div>

        <div class="profile-actions">
          <f7-button fill color="red" class="signout-btn" @click="handleSignOut">
            <f7-icon f7="arrow_right_square" size="16" class="margin-right-half" />
            Keluar (Sign Out)
          </f7-button>
        </div>
      </div>
    </f7-page>
  </f7-popup>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth.store';

defineProps<{
  opened: boolean;
}>();

const emit = defineEmits<{
  close: [];
  logout: [];
}>();

const authStore = useAuthStore();

const userName = computed(() => authStore.user?.name || 'Admin User');
const userEmail = computed(() => authStore.user?.email || 'admin@cerdas.com');

const userInitials = computed(() => {
  if (!userName.value) return 'AD';
  const names = userName.value.trim().split(/\s+/);
  if (names.length >= 2) {
    return (names[0][0] + names[1][0]).toUpperCase();
  }
  return userName.value.substring(0, 2).toUpperCase();
});

function handleSignOut() {
  emit('close');
  emit('logout');
}
</script>

<style scoped>
.profile-card-container {
  max-width: 440px;
  margin: 40px auto;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.profile-avatar-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #2563eb;
  color: white;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px auto;
}

.profile-name {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.profile-email {
  font-size: 13.5px;
  color: #64748b;
  margin-bottom: 12px;
}

.profile-role-badge {
  display: inline-block;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 12px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.profile-meta-list {
  border-top: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
  padding: 16px 0;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.meta-label {
  color: #64748b;
}

.meta-val {
  color: #1e293b;
  font-weight: 500;
}

.color-green {
  color: #16a34a;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.signout-btn {
  height: 42px;
  border-radius: 8px;
  font-weight: 600;
}
</style>
