<template>
  <f7-page login-screen class="login-page">
    <div class="login-container display-flex justify-content-center align-items-center height-100">
      <div class="login-card card card-outline margin-horizontal">
        <div class="card-content card-content-padding">
          <div class="text-align-center margin-bottom">
            <f7-icon f7="layers_alt_fill" size="64" color="primary"></f7-icon>
            <h1 class="margin-top-half no-margin-bottom text-color-primary">Cerdas</h1>
            <p class="text-color-gray no-margin-top">Field Data Collection</p>
          </div>

          <f7-list form no-hairlines-md>
            <f7-list-input label="Email" type="email" placeholder="enumerator@cerdas.com" v-model:value="email"
              clear-button floating-label>
              <template #media>
                <f7-icon f7="envelope"></f7-icon>
              </template>
            </f7-list-input>

            <f7-list-input label="Password" type="password" placeholder="Your password" v-model:value="password"
              clear-button floating-label>
              <template #media>
                <f7-icon f7="lock"></f7-icon>
              </template>
            </f7-list-input>
          </f7-list>

          <div class="margin-top">
            <f7-button fill large round @click="signIn" :loading="isLoading" preloader>
              Sign In
            </f7-button>
          </div>

          <div class="margin-top text-align-center">
            <f7-link small href="#" class="text-color-gray">Forgot Password?</f7-link>
          </div>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<style scoped>
.login-page {
  --f7-page-bg-color: #f0f4f8;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.login-container {
  min-height: 100vh;
  width: 100%;
}

.login-card {
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}
</style>

<script setup lang="ts">
import { useAuthStore } from '@/common/stores/authStore';
import { f7 } from 'framework7-vue';
import { ref } from 'vue';

const email = ref('user@example.com');
const password = ref('password');
const authStore = useAuthStore();
const isLoading = ref(false);

const signIn = async () => {
  if (!email.value || !password.value) {
    f7.toast.show({ text: 'Please enter email and password', position: 'top', closeTimeout: 2000, cssClass: 'color-red' });
    return;
  }

  try {
    isLoading.value = true;
    const success = await authStore.login(email.value, password.value);
    isLoading.value = false;

    if (success) {
      // Use reloadCurrent to force the async route resolver to re-evaluate
      // This ensures the '/' route now resolves to DashboardPage since isAuthenticated is true
      f7.view.main.router.navigate('/', { reloadCurrent: true, clearPreviousHistory: true });
    } else {
      f7.dialog.alert('Login failed. Please check your credentials.', 'Authentication Error');
    }
  } catch (e: any) {
    isLoading.value = false;
    f7.dialog.alert(e.message || 'Login failed. Please check your credentials.', 'Authentication Error');
  }
}
</script>
