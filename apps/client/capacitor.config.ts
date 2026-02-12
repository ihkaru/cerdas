import type { CapacitorConfig } from '@capacitor/cli';

// Set to true for development with Live Reload, false for production build
const useLiveReload = true; // CHANGE THIS TO FALSE FOR PRODUCTION APK

const config: CapacitorConfig = {
  appId: 'com.cerdas.client',
  appName: 'Cerdas Client',
  webDir: 'dist',
  
  // Android specific settings
  android: {
    minWebViewVersion: 60,
    // Allow mixed content (HTTP in HTTPS context) for development
    allowMixedContent: true,
  },

  // Server config for Live Reload (development only)
  ...(useLiveReload && {
    server: {
      // 10.0.2.2 is the special IP that Android Emulator uses to reach host machine
      url: 'http://10.0.2.2:9981',
      cleartext: true,
    },
  }),

  plugins: {
    // SQLite plugin configuration
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      androidIsEncryption: false,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '133588067257-0huo4ja0kaavpg704si2htphl0kvgobt.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
