import vue from '@vitejs/plugin-vue';
import { readFileSync } from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    // App version from package.json (single source of truth)
    __APP_VERSION__: JSON.stringify(pkg.version),
    // Build timestamp for version tracking
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Ensure Framework7 CSS resolves correctly
      'framework7/css/bundle': path.resolve(
        __dirname,
        'node_modules/framework7/framework7-bundle.css'
      ),
    },
  },
  optimizeDeps: {
    // Explicitly include ALL web-compatible Capacitor packages so Vite
    // pre-bundles them at startup (not lazily at runtime).
    // This prevents the "504 Outdated Optimize Dep" loop in development.
    //
    // DO NOT add: @capacitor/android, @capacitor/ios — native-only binaries,
    //             not importable as JS modules in browser.
    // DO NOT add: jeep-sqlite, @capacitor-community/sqlite — excluded below
    //             because they ship WASM and must NOT be pre-bundled.
    include: [
      'framework7',
      'framework7-vue',
      '@capacitor/core',
      '@capacitor/network',
      '@capacitor/app',
      '@capacitor/camera',
      '@capacitor/geolocation',
      '@ionic/pwa-elements',
    ],
    exclude: ['jeep-sqlite', '@capacitor-community/sqlite']
  },
  server: {
    host: true,  // Listen on all interfaces (0.0.0.0)
    port: Number(process.env.PORT) || 9981,  // Fixed port for Android to connect (fallback: 9981)
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      // 'credentialless' allows loading external images without CORP headers
      // while still enabling SharedArrayBuffer for SQLite WASM
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  esbuild: {
    // Drop all console.* and debugger statements in production builds.
    // Development builds are unaffected — logs remain fully visible during dev.
    drop: ['console', 'debugger'],
  },
})
