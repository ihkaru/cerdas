<template>
  <f7-page login-screen class="login-page">
    <div class="login-container display-flex justify-content-center align-items-center height-100">
      <div class="login-card card card-outline margin-horizontal">
        <div class="card-content card-content-padding">
          <div class="text-align-center margin-bottom" @click="handleLogoTap">
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

            <!-- Divider -->
            <div class="display-flex justify-content-center align-items-center margin-vertical">
              <span class="text-color-gray uppercase size-12">OR</span>
            </div>

            <!-- Native Google Button -->
            <f7-button v-if="isNative" fill large round color="white" text-color="black" class="google-btn"
              @click="signInWithGoogleNative" :disabled="isLoading">
              <f7-icon f7="logo_google" size="20" class="margin-right-half"></f7-icon>
              <span>Sign in with Google</span>
            </f7-button>

            <!-- Web Google Button (Wrapper) -->
            <div v-else class="display-flex justify-content-center">
              <GoogleSignInButton @success="handleGoogleLoginWeb" @error="handleGoogleErrorWeb" />
            </div>
          </div>

          <div class="margin-top text-align-center">
            <f7-link small href="#" class="text-color-gray">Forgot Password?</f7-link>
          </div>

          <!-- Version (also debug trigger) -->
          <div class="margin-top text-align-center" @click="handleLogoTap" style="cursor: default;">
            <small style="opacity: 0.35; font-size: 10px;">v{{ clientVersion }}</small>
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
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { f7 } from 'framework7-vue';
import { onMounted, ref } from 'vue';

import { GoogleSignInButton } from 'vue3-google-signin';

const email = ref('user@example.com');
const password = ref('password');
const authStore = useAuthStore();
const isLoading = ref(false);

const isNative = Capacitor.isNativePlatform();
const clientVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

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
      f7.view.main.router.navigate('/', { reloadCurrent: true, clearPreviousHistory: true });
    } else {
      f7.dialog.alert('Login failed. Please check your credentials.', 'Authentication Error');
    }
  } catch (e: any) {
    isLoading.value = false;
    f7.dialog.alert(e.message || 'Login failed. Please check your credentials.', 'Authentication Error');
  }
}

// Web Handler (vue3-google-signin)
const handleGoogleErrorWeb = () => {
  f7.dialog.alert('Google Login Failed', 'Error');
}

const handleGoogleLoginWeb = async (response: any) => {
  if (response.credential) {
    try {
      isLoading.value = true;
      const success = await authStore.loginWithGoogle(response.credential);
      if (success) {
        f7.view.main.router.navigate('/', { reloadCurrent: true, clearPreviousHistory: true });
      }
    } catch (e) {
      f7.dialog.alert('Google Login Failed', 'Error');
    } finally {
      isLoading.value = false;
    }
  }
};

// Native Handler
const signInWithGoogleNative = async () => {
  try {
    isLoading.value = true;
    const googleUser = await GoogleAuth.signIn();
    // Native returns { authentication: { idToken: ... } }
    const idToken = googleUser.authentication.idToken;

    if (idToken) {
      const success = await authStore.loginWithGoogle(idToken);
      if (success) {
        f7.view.main.router.navigate('/', { reloadCurrent: true, clearPreviousHistory: true });
      }
    } else {
      throw new Error('No ID Token from Google');
    }
  } catch (e: any) {
    console.error(e);
    // f7.dialog.alert('Google Sign-In Cancelled or Failed', 'Error');
  } finally {
    isLoading.value = false;
  }
};

// Debug menu trigger (5 taps on logo/version)
let debugTapCount = 0;
let debugTapTimer: ReturnType<typeof setTimeout> | null = null;

const handleLogoTap = () => {
  debugTapCount++;
  if (debugTapTimer) clearTimeout(debugTapTimer);
  debugTapTimer = setTimeout(() => { debugTapCount = 0; }, 2000);

  if (debugTapCount >= 5) {
    window.dispatchEvent(new CustomEvent('open-debug-menu'));
    debugTapCount = 0;
    if (debugTapTimer) clearTimeout(debugTapTimer);
  }
};

onMounted(() => {
  if (isNative) {
    GoogleAuth.initialize({
      clientId: '133588067257-0huo4ja0kaavpg704si2htphl0kvgobt.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
  }
});
</script>
