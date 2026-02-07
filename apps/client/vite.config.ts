import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
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
    include: ['framework7', 'framework7-vue'],
    exclude: ['jeep-sqlite']
  },
  server: {
    host: true,  // Listen on all interfaces (0.0.0.0)
    port: 9981,  // Fixed port for Android to connect
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      // 'credentialless' allows loading external images without CORP headers
      // while still enabling SharedArrayBuffer for SQLite WASM
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
})
