import type { App } from 'vue';
import * as Sentry from '@sentry/vue';
import { makeBrowserOfflineTransport, makeFetchTransport } from '@sentry/vue';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { App as CapacitorApp } from '@capacitor/app';
import { logger } from '../utils/logger';

/**
 * Initialize Sentry for Cerdas Client (Offline-First Mobile PWA & Capacitor App).
 * Features:
 *  - IndexedDB offline envelope caching (survives app kill/restarts in blank spots)
 *  - Native Capacitor Network listener for automatic background flush on reconnect
 *  - Native Capacitor App lifecycle listener for flush on resume
 *  - Self-Describing SRE Telemetry Tags for zero-config Gateway routing
 */
export function initSentry(app: App): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    return;
  }

  Sentry.init({
    app,
    dsn,
    environment: import.meta.env.MODE || 'production',
    tracesSampleRate: 0.2,

    // Offline-First Transport via IndexedDB
    transport: makeBrowserOfflineTransport(makeFetchTransport),

    // Self-describing SRE Telemetry Tags (Tier 1 SSOT)
    initialScope: {
      tags: {
        app_name: 'cerdas-client',
        repository: 'https://github.com/ihkaru/cerdas',
        branch: 'main',
        platform: Capacitor.getPlatform(), // 'android' | 'ios' | 'web'
        is_native: Capacitor.isNativePlatform(),
      },
    },

    // Clean up breadcrumbs / PII
    sendDefaultPii: false,
  });

  // Setup Capacitor listeners to trigger flush on network recovery
  try {
    Network.addListener('networkStatusChange', async (status) => {
      if (status.connected) {
        logger.debug('[Sentry] Network reconnected, flushing offline envelopes...');
        await Sentry.flush(5000);
      }
    });

    CapacitorApp.addListener('appStateChange', async (state) => {
      if (state.isActive) {
        const status = await Network.getStatus();
        if (status.connected) {
          logger.debug('[Sentry] App resumed with connectivity, flushing offline envelopes...');
          await Sentry.flush(5000);
        }
      }
    });
  } catch (err) {
    logger.warn('[Sentry] Failed to attach Capacitor network/app listeners', err);
  }
}
