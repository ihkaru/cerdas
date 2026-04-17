import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { logger } from '../utils/logger';

export interface AppVersionMetadata {
  version: string;
  build_id: string;
  timestamp: string;
  min_native_version?: string;
  changelog?: string[];
  force_update?: boolean;
}

export type UpdateState = 'idle' | 'checking' | 'available' | 'required' | 'error';

class UpdateService {
  private static instance: UpdateService;
  private intervalId: any = null;
  private state: UpdateState = 'idle';
  private metadata: AppVersionMetadata | null = null;
  private dismissedVersion: string | null = null;

  private constructor() {
    this.dismissedVersion = sessionStorage.getItem('app_update_dismissed');
  }

  public static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService();
    }
    return UpdateService.instance;
  }

  /**
   * Initialize and start polling
   */
  public init(pollIntervalMs: number = 15 * 60 * 1000) {
    this.checkForUpdates();
    
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.checkForUpdates(), pollIntervalMs);
  }

  public async checkForUpdates(): Promise<AppVersionMetadata | null> {
    this.state = 'checking';
    logger.debug('[UpdateService] Checking for updates...');

    try {
      // 1. Fetch Remote Metadata (Cache Busted)
      const response = await fetch(`/version.json?t=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to fetch version metadata');
      
      const remote: AppVersionMetadata = await response.json();
      this.metadata = remote;

      // 2. Local State
      // Vite replaces __APP_VERSION__ at build time with the string from package.json
      const currentVersion = __APP_VERSION__;
      
      logger.debug(`[UpdateService] Local: ${currentVersion}, Remote: ${remote.version}`);
      logger.debug(`[UpdateService] Build Info: ${__BUILD_TIMESTAMP__}`);

      // If versions match, we're already up to date - stop here
      if (remote.version === currentVersion) {
        logger.debug('[UpdateService] App is already at the latest version.');
        this.state = 'idle';
        return remote;
      }
      
      // 3. Logic: Binary (Native) Version Check for Capacitor
      if (Capacitor.isNativePlatform()) {
        const info = await App.getInfo();
        const nativeVersion = info.version;
        
        if (remote.min_native_version && this.isOlder(nativeVersion, remote.min_native_version)) {
          this.state = 'required'; // Force native update
          this.dispatchUpdateEvent();
          return remote;
        }
      }

      // 4. Logic: Web Asset check
      if (this.isOlder(currentVersion, remote.version)) {
        // Only show if not dismissed in this session (unless forced)
        if (remote.version === this.dismissedVersion && !remote.force_update) {
          this.state = 'idle';
          return null;
        }

        this.state = remote.force_update ? 'required' : 'available';
        this.dispatchUpdateEvent();
        return remote;
      }

      this.state = 'idle';
      return null;
    } catch (e) {
      logger.error('[UpdateService] Update check failed', e);
      this.state = 'error';
      return null;
    }
  }

  private isOlder(current: string, proposed: string): boolean {
    // Simple semver comparison
    const c = current.split('.').map(Number);
    const p = proposed.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
        if ((p[i] || 0) > (c[i] || 0)) return true;
        if ((p[i] || 0) < (c[i] || 0)) return false;
    }
    return false;
  }

  private dispatchUpdateEvent() {
    window.dispatchEvent(new CustomEvent('app-update-available', {
      detail: {
        state: this.state,
        metadata: this.metadata
      }
    }));
  }

  public getState() { return this.state; }
  public getMetadata() { return this.metadata; }

  public performUpdate() {
    logger.info(`[UpdateService] Executing update from ${__APP_VERSION__} to ${this.metadata?.version}`);

    if (Capacitor.isNativePlatform()) {
      // Modern 2026 Redirect: GitHub Releases
      const githubUrl = 'https://github.com/ihkaru/cerdas/releases/latest';
      window.open(githubUrl, '_system', 'noopener');
    } else {
      // PWA Refresh with cache-busting
      logger.info('[UpdateService] Reloading PWA with cache buster...');
      const url = new URL(window.location.href);
      url.searchParams.set('reload_v', Date.now().toString());
      window.location.href = url.toString();
    }
  }

  public dismiss() {
    if (this.metadata) {
      this.dismissedVersion = this.metadata.version;
      sessionStorage.setItem('app_update_dismissed', this.metadata.version);
    }
    this.state = 'idle';
  }
}

export const updateService = UpdateService.getInstance();
