<template>
    <f7-page class="login-page">
        <div class="login-container">
            <!-- Logo & Branding -->
            <div class="login-header">
                <div class="logo-icon">
                    <f7-icon f7="cube_fill" />
                </div>
                <h1 class="app-title">Cerdas Editor</h1>
                <p class="app-subtitle">Data Collection Management Platform</p>
            </div>

            <!-- Login Card -->
            <div class="login-card">
                <h2 class="card-title">Welcome back</h2>
                <p class="card-subtitle">Sign in to your account to continue</p>

                <!-- Error Message -->
                <div v-if="authStore.error" class="error-banner">
                    <f7-icon f7="exclamationmark_triangle_fill" />
                    <span>{{ authStore.error }}</span>
                </div>

                <!-- Login Form -->
                <form @submit.prevent="handleLogin" class="login-form">
                    <div class="form-group">
                        <label for="email">Email Address</label>
                        <div class="input-wrapper">
                            <f7-icon f7="envelope" class="input-icon" />
                            <input id="email" type="email" v-model="email" placeholder="admin@cerdas.com"
                                autocomplete="email" required />
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="password">Password</label>
                        <div class="input-wrapper">
                            <f7-icon f7="lock" class="input-icon" />
                            <input id="password" type="password" v-model="password" placeholder="Enter your password"
                                autocomplete="current-password" required />
                        </div>
                    </div>

                    <button type="submit" class="login-button" :class="{ loading: authStore.loading }"
                        :disabled="authStore.loading">
                        <span v-if="!authStore.loading">Sign In</span>
                        <span v-else class="loading-spinner"></span>
                    </button>
                </form>
            </div>

            <!-- Footer -->
            <div class="login-footer">
                <p>© 2026 Cerdas Platform. Built for data excellence.</p>
            </div>
        </div>
    </f7-page>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store';
import { f7 } from 'framework7-vue';
import { ref } from 'vue';

const authStore = useAuthStore();

const email = ref('');
const password = ref('');

async function handleLogin() {
    if (!email.value || !password.value) {
        f7.dialog.alert('Please enter email and password');
        return;
    }

    const success = await authStore.login({
        email: email.value,
        password: password.value
    });

    if (success) {
        // Force full page reload to ensure clean state and correct layout rendering
        window.location.href = '/';
    }
}
</script>

<style scoped>
/* ============================================================================
   Login Page - Modern Design Matching Dashboard Aesthetics
   ============================================================================ */

.login-page {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    min-height: 100vh;
}

.login-page :deep(.page-content) {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
}

.login-container {
    width: 100%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

/* Header & Branding */
.login-header {
    text-align: center;
    margin-bottom: 32px;
}

.logo-icon {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
}

.logo-icon :deep(.icon) {
    font-size: 32px;
    color: white;
}

.app-title {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.app-subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
}

/* Login Card */
.login-card {
    width: 100%;
    background: white;
    border-radius: 16px;
    padding: 32px;
    box-shadow:
        0 1px 3px rgba(0, 0, 0, 0.04),
        0 4px 16px rgba(0, 0, 0, 0.06);
}

.card-title {
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px 0;
}

.card-subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0 0 24px 0;
}

/* Error Banner */
.error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    margin-bottom: 20px;
    color: #dc2626;
    font-size: 14px;
}

.error-banner :deep(.icon) {
    font-size: 16px;
}

/* Form Styles */
.login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-group label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.input-icon {
    position: absolute;
    left: 14px;
    color: #94a3b8;
    pointer-events: none;
}

.input-icon :deep(.icon) {
    font-size: 18px;
}

.input-wrapper input {
    width: 100%;
    height: 48px;
    padding: 0 16px 0 44px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 15px;
    color: #1e293b;
    background: #f8fafc;
    transition: all 0.2s;
    outline: none;
}

.input-wrapper input::placeholder {
    color: #94a3b8;
}

.input-wrapper input:focus {
    border-color: #2563eb;
    background: white;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Login Button */
.login-button {
    height: 48px;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.login-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.login-button:active:not(:disabled) {
    transform: translateY(0);
}

.login-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.login-button.loading {
    pointer-events: none;
}

.loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Footer */
.login-footer {
    margin-top: 32px;
    text-align: center;
}

.login-footer p {
    font-size: 12px;
    color: #94a3b8;
    margin: 0;
}
</style>
