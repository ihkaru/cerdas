<template>
    <div class="step-pane">
        <div class="step-hero">
            <div class="hero-icon-wrap hero-google">
                <f7-icon f7="logo_google" size="36" />
            </div>
            <h3 class="hero-title">Setup Aplikasi &amp; Akun Google</h3>
            <p class="hero-subtitle">
                Beri nama aplikasi Anda dan pastikan akun Google Drive terhubung untuk sinkronisasi otomatis.
            </p>
        </div>

        <f7-list strong-ios inset-ios class="margin-bottom">
            <f7-list-input
                label="App Name"
                type="text"
                placeholder="Contoh: Survei Kepuasan Warga 2026"
                :value="name"
                @input="$emit('update:name', ($event.target as HTMLInputElement).value)"
                required
                validate
                clear-button
            />
            <f7-list-input
                type="textarea"
                label="Description (Opsional)"
                placeholder="Deskripsi singkat mengenai survei atau pengumpulan data ini..."
                :value="description"
                @input="$emit('update:description', ($event.target as HTMLInputElement).value)"
            />
        </f7-list>

        <!-- Google OAuth Card -->
        <div class="google-auth-card" :class="{ 'card-connected': hasGoogleToken }">
            <div class="auth-card-icon">
                <f7-icon :f7="hasGoogleToken ? 'checkmark_seal_fill' : 'logo_google'" size="28" :color="hasGoogleToken ? 'green' : 'blue'" />
            </div>
            <div class="auth-card-info">
                <div class="auth-card-title">
                    {{ hasGoogleToken ? 'Akun Google Terhubung' : 'Hubungkan Akun Google' }}
                </div>
                <div class="auth-card-desc">
                    {{ hasGoogleToken ? 'Siap membaca spreadsheet dan melakukan sinkronisasi data.' : 'Izin diperlukan untuk membaca lembar kerja di Google Drive Anda.' }}
                </div>
            </div>
            <div class="auth-card-action">
                <f7-button
                    v-if="!hasGoogleToken"
                    fill
                    color="blue"
                    :loading="isAuthenticating"
                    @click="$emit('connect-oauth')"
                >
                    Connect Google
                </f7-button>
                <f7-button
                    v-else
                    outline
                    small
                    color="gray"
                    @click="$emit('connect-oauth')"
                >
                    Ganti Akun
                </f7-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    name: string;
    description: string;
    hasGoogleToken: boolean;
    isAuthenticating: boolean;
}>();

defineEmits<{
    (e: 'update:name', val: string): void;
    (e: 'update:description', val: string): void;
    (e: 'connect-oauth'): void;
}>();
</script>
