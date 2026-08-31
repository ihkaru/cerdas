import { ref } from 'vue';
import { f7 } from 'framework7-vue';
import { GoogleSheetApi } from '@/common/api/GoogleSheetApi';

interface OAuthPayload {
  type?: string;
  code?: string;
  state?: string;
  error?: string;
  message?: string;
}

/**
 * useGoogleOAuthPopup
 *
 * Encapsulates the Google OAuth 2.0 popup window lifecycle:
 * - Fetches authorization URL from backend
 * - Opens and monitors the centered popup window
 * - Listens for window postMessage, BroadcastChannel, and storage events
 * - Auto-cleans event listeners and intervals on completion or window close
 */
export function useGoogleOAuthPopup() {
  const isAuthenticating = ref(false);
  const hasAuthenticated = ref(false);
  const authError = ref<string | null>(null);

  /**
   * Open the Google OAuth popup and wait for the authorization flow to complete.
   *
   * @param appId App UUID (or temporary ID) to bind the token context to
   */
  async function triggerOAuthPopup(appId: string): Promise<boolean> {
    isAuthenticating.value = true;
    authError.value = null;

    try {
      const { url } = await GoogleSheetApi.getAuthUrl(appId);

      const popupWidth = 520;
      const popupHeight = 680;
      const left = window.screenX + (window.outerWidth - popupWidth) / 2;
      const top = window.screenY + (window.outerHeight - popupHeight) / 2;

      const popup = window.open(
        url,
        'google-oauth',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      if (!popup) {
        throw new Error('Popup diblokir oleh browser. Izinkan popup untuk domain ini dan coba lagi.');
      }

      await waitForOAuthResult(popup);

      hasAuthenticated.value = true;
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghubungkan Google Account.';
      authError.value = msg;
      f7.dialog.alert(msg);
      return false;
    } finally {
      isAuthenticating.value = false;
    }
  }

  return {
    isAuthenticating,
    hasAuthenticated,
    authError,
    triggerOAuthPopup,
  };
}

function waitForOAuthResult(popup: Window): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let resolved = false;
    let checkClosedTimer: ReturnType<typeof setInterval> | null = null;
    let bc: BroadcastChannel | null = null;

    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
      if (bc) {
        bc.close();
        bc = null;
      }
      if (checkClosedTimer) {
        clearInterval(checkClosedTimer);
        checkClosedTimer = null;
      }
      try {
        localStorage.removeItem('google_oauth_event');
      } catch {
        // ignore
      }
    };

    const processAuthResult = async (data: OAuthPayload | null) => {
      if (resolved || !data) return;
      if (data.type === 'GOOGLE_OAUTH_SUCCESS') {
        resolved = true;
        try {
          if (data.code && data.state) {
            await GoogleSheetApi.handleCallback(data.code, data.state);
          }
          cleanup();
          resolve();
        } catch (err: unknown) {
          cleanup();
          reject(err instanceof Error ? err : new Error('Gagal memproses token Google OAuth.'));
        }
      } else if (data.type === 'GOOGLE_OAUTH_ERROR') {
        resolved = true;
        cleanup();
        reject(new Error(data.message || data.error || 'Otorisasi Google gagal.'));
      }
    };

    // 1. BroadcastChannel listener (immune to COOP / window.opener stripping)
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('google_oauth_channel');
        bc.onmessage = (event: MessageEvent<OAuthPayload>) => {
          void processAuthResult(event.data);
        };
      }
    } catch {
      // ignore
    }

    // 2. Storage event listener fallback
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'google_oauth_event' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as OAuthPayload;
          void processAuthResult(parsed);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. PostMessage listener fallback
    const handleMessage = (event: MessageEvent<OAuthPayload>) => {
      if (event.origin !== window.location.origin) return;
      void processAuthResult(event.data);
    };
    window.addEventListener('message', handleMessage);

    const onPopupClosed = () => {
      if (!resolved) {
        cleanup();
        resolve();
      }
    };

    checkClosedTimer = setInterval(() => {
      try {
        if (popup.closed) {
          setTimeout(onPopupClosed, 1200);
        }
      } catch {
        // ignore cross-origin error
      }
    }, 800);
  });
}
