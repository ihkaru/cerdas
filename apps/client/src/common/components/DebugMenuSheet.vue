<template>
  <f7-sheet
    v-model:opened="isOpened"
    class="debug-menu-sheet"
    style="height: auto; --f7-sheet-bg-color: #fff"
    swipe-to-close
    backdrop
  >
    <f7-toolbar>
      <div class="left"></div>
      <div class="right">
        <f7-link sheet-close>Close</f7-link>
      </div>
    </f7-toolbar>
    <f7-page-content>
      <f7-block-title medium>Debug Info (Production)</f7-block-title>
      <f7-block>
        <p class="text-color-gray">Triple-tap version to open this menu.</p>
        
        <f7-list simple-list>
          <f7-list-item title="App Version">
            <template #after>
              <span class="badge color-blue">{{ appVersion }}</span>
            </template>
          </f7-list-item>
          
          <f7-list-item title="API Connection">
             <template #after>
              <f7-icon :f7="apiStatus ? 'checkmark_circle_fill' : 'xmark_circle_fill'" 
                :class="apiStatus ? 'text-color-green' : 'text-color-red'" />
            </template>
          </f7-list-item>

          <f7-list-item title="Reverb (Realtime)">
             <template #after>
              <span v-if="reverbStatus === null" class="badge color-gray">N/A</span>
              <f7-icon v-else :f7="reverbStatus ? 'checkmark_circle_fill' : 'xmark_circle_fill'" 
                :class="reverbStatus ? 'text-color-green' : 'text-color-red'" />
            </template>
          </f7-list-item>
        </f7-list>

        <f7-block-title>Environment Variables</f7-block-title>
        <f7-list>
            <f7-list-item title="API URL" :footer="apiUrl"></f7-list-item>
            <f7-list-item title="Reverb Host" :footer="reverbHost"></f7-list-item>
            <f7-list-item title="Reverb Key" :footer="reverbKey"></f7-list-item>
        </f7-list>

        <f7-button fill color="gray" @click="copyInfo">Copy Debug Info</f7-button>
        <br/>
        <f7-button outline color="red" @click="runChecks">Re-run Checks</f7-button>
      </f7-block>
    </f7-page-content>
  </f7-sheet>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import { onMounted, ref } from 'vue';
import { healthCheck } from '../services/HealthCheckService';

const isOpened = ref(false);
const appVersion = ref(__APP_VERSION__);
const apiStatus = ref(false);
const reverbStatus = ref<boolean | null>(null);

const apiUrl = import.meta.env.VITE_API_BASE_URL;
const reverbHost = import.meta.env.VITE_REVERB_HOST;
const reverbKey = import.meta.env.VITE_REVERB_APP_KEY ? '******' + import.meta.env.VITE_REVERB_APP_KEY.slice(-4) : 'MISSING';

// Expose open method globally or via event bus if needed, 
// but preferred way is to use v-model from parent. 
// For now, we listen to a window event for simplicity in integration.
onMounted(() => {
    window.addEventListener('open-debug-menu', () => {
        isOpened.value = true;
        runChecks();
    });
});

const runChecks = async () => {
    f7.preloader.show();
    const result = await healthCheck.runStartupChecks(true);
    apiStatus.value = result.api;
    reverbStatus.value = result.reverb;
    f7.preloader.hide();
};

const copyInfo = () => {
    const info = {
        version: appVersion.value,
        api: apiUrl,
        reverb: reverbHost,
        statuses: { api: apiStatus.value, reverb: reverbStatus.value }
    };
    navigator.clipboard.writeText(JSON.stringify(info, null, 2));
    f7.toast.show({ text: 'Copied to clipboard', closeTimeout: 2000 });
};
</script>
