/**
 * Lightweight Logger Utility for Cerdas Editor
 *
 * All console.* calls in production are automatically stripped by Vite's
 * esbuild.drop: ['console'] setting in vite.config.ts — so there is
 * zero overhead in production bundles.
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.debug('[MyComponent] loaded');
 *   logger.warn('[Auth] token expiring soon');
 *   logger.error('[API] request failed', error);
 */

const isDev = import.meta.env.DEV;

const noop = () => {};

function makeLogger(context: string) {
  if (!isDev) {
    return {
      debug: noop,
      info: noop,
      warn: noop,
      error: noop,
    };
  }

  const prefix = `[${context}]`;
  return {
    debug: (message: string, ...args: unknown[]) =>
      console.log(`${prefix} ${message}`, ...args),
    info: (message: string, ...args: unknown[]) =>
      console.info(`${prefix} ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) =>
      console.warn(`${prefix} ${message}`, ...args),
    error: (message: string, ...args: unknown[]) =>
      console.error(`${prefix} ${message}`, ...args),
  };
}

/** Global logger (no specific context) */
export const logger = makeLogger('Editor');

/** Component/service scoped logger */
export function useLogger(context: string) {
  return makeLogger(context);
}

export default logger;
