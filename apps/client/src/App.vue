<template>
  <!-- Main Framework7 App component where we pass Framework7 params -->
  <f7-app v-bind="f7params">
    <!-- Main View - browserHistory disabled for mobile app -->
    <f7-view main url="/">
    </f7-view>
    <DebugMenuSheet />
  </f7-app>
</template>

<script setup lang="ts">
import type { Framework7Parameters } from 'framework7/types';
import { ref } from 'vue';
import DebugMenuSheet from './common/components/DebugMenuSheet.vue';
import { useLogger } from './common/utils/logger';
import routes from './routes';



const log = useLogger('App');

// Note: Android Back Button handling is now done globally in main.ts
// to ensure it's registered before the app fully mounts.

// Framework7 parameters
const f7params = ref<Framework7Parameters>({
  name: 'Cerdas Client',
  theme: 'auto',
  routes,
  // Disable browser history for mobile app - eliminates router warning
  // Mobile apps don't need URL-based navigation
  view: {
    browserHistory: false,
  },
  // Global Event Logging
  on: {
    routeChange: (newRoute: any, previousRoute: any) => {
      log.info('Navigating:', {
        from: previousRoute?.path || 'initial',
        to: newRoute?.path,
        params: newRoute?.params,
        query: newRoute?.query
      });
    },
    pageInit: (page: { name: string }) => {
      log.debug('Page Init:', { name: page.name });
    }
  },
  touch: {
    // COMPLETELY disable touch ripple to fix CSS selector error on older Android WebView
    // The error: "Failed to execute 'closest' on 'Element': ... is not a valid selector"
    // Occurs because Framework7's complex selectors like ".actions-group:not(.actions-grid .actions-group)"
    // are not supported by older WebView CSS parsers
    touchRipple: false,
    touchRippleElements: '',
    // Disable activeState entirely to prevent selector errors
    activeState: false,
    activeStateElements: '',
    // Disable iOS-style tap hold
    tapHold: false,
    // Disable context menu interception
    disableContextMenu: false,
  },
});
</script>

<style>
/* Custom CSS variables and overrides */
:root {
  --f7-theme-color: #007aff;
}
</style>
