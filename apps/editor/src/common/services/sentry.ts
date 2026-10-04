import type { App } from 'vue';
import * as Sentry from '@sentry/vue';

/**
 * Initialize Sentry for Cerdas Editor (Web Dashboard).
 * Configured with Self-Describing SRE Telemetry Tags.
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

    // Self-describing SRE Telemetry Tags
    initialScope: {
      tags: {
        app_name: 'cerdas-editor',
        repository: 'https://github.com/ihkaru/cerdas',
        branch: 'main',
        platform: 'web',
      },
    },

    // Filter intentional control-flow exceptions (such as pre-mount redirect)
    beforeSend(event, hint) {
      const error = hint.originalException;
      if (error instanceof Error && error.message.includes('Redirecting to login')) {
        return null;
      }
      return event;
    },
  });
}
