import vue from '@vitejs/plugin-vue';
import { readFileSync } from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
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
    // Editor is a pure web app (no Capacitor), so we only need framework7.
    // No Capacitor packages are needed here.
    include: ['framework7', 'framework7-vue'],
    // Exclude any accidental WASM packages that might be transitively pulled in
    exclude: ['jeep-sqlite'],
  },
  server: {
    host: true,
    port: Number(process.env.PORT) || 9982,
  },
})
