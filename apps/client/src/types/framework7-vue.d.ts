// Type declarations for framework7-vue/bundle
// The bundle exports registerComponents but the main .d.ts doesn't declare it

import type { App } from 'vue';

declare module 'framework7-vue/bundle' {
  export * from 'framework7-vue';
  export function registerComponents(app: App): void;
}
