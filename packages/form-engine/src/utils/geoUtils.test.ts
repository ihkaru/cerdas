import { mock, describe, expect, it, beforeEach, afterEach } from 'bun:test';

mock.module('@capacitor/geolocation', () => ({
  Geolocation: {
    checkPermissions: mock(() => Promise.resolve({ location: 'granted' })),
    requestPermissions: mock(() => Promise.resolve({ location: 'granted' })),
    getCurrentPosition: mock(() => Promise.resolve({
      coords: { latitude: 0, longitude: 0, accuracy: 10 },
      timestamp: Date.now()
    }))
  }
}));

// Provide window polyfill if running in node/bun CLI environment
if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    location: { href: '' },
    open: () => null
  };
}

const {
  formatCoordinate,
  getDirectionsUrl,
  getGeoUri,
  getGoogleMapsUrl,
  isAndroidDevice,
  isIOSDevice,
  isMobileDevice,
  openMapDirections,
  parseCoordsString
} = await import('./geoUtils');

describe('geoUtils Directions and Deep Linking', () => {
  const originalUserAgent = navigator.userAgent;

  const setUserAgent = (ua: string) => {
    Object.defineProperty(navigator, 'userAgent', {
      value: ua,
      writable: true,
      configurable: true
    });
  };

  afterEach(() => {
    setUserAgent(originalUserAgent);
  });

  it('getGoogleMapsUrl generates standard universal web URL', () => {
    const url = getGoogleMapsUrl(-6.2088, 106.8456);
    expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=-6.2088,106.8456');
  });

  it('getGeoUri generates native Android geo: scheme', () => {
    const uri = getGeoUri(-6.2088, 106.8456);
    expect(uri).toBe('geo:-6.2088,106.8456?q=-6.2088,106.8456');
  });

  it('getDirectionsUrl returns clean, shareable Google Maps URL', () => {
    const url = getDirectionsUrl(-6.2088, 106.8456);
    expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=-6.2088,106.8456');
  });

  describe('Android Environment', () => {
    const androidUA = 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36';

    beforeEach(() => {
      setUserAgent(androidUA);
    });

    it('identifies Android device correctly', () => {
      expect(isAndroidDevice()).toBe(true);
      expect(isIOSDevice()).toBe(false);
      expect(isMobileDevice()).toBe(true);
    });

    it('openMapDirections dispatches geo: URI on Android to open native app', () => {
      let navigatedTo = '';
      (globalThis as any).window.location = {
        set href(val: string) {
          navigatedTo = val;
        },
        get href() {
          return navigatedTo;
        }
      };

      openMapDirections(-6.2088, 106.8456);
      expect(navigatedTo).toBe('geo:-6.2088,106.8456?q=-6.2088,106.8456');
    });
  });

  describe('iOS Environment', () => {
    const iPhoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

    beforeEach(() => {
      setUserAgent(iPhoneUA);
    });

    it('identifies iOS device correctly', () => {
      expect(isAndroidDevice()).toBe(false);
      expect(isIOSDevice()).toBe(true);
      expect(isMobileDevice()).toBe(true);
    });

    it('openMapDirections dispatches Apple Maps URL on iOS', () => {
      let navigatedTo = '';
      (globalThis as any).window.location = {
        set href(val: string) {
          navigatedTo = val;
        },
        get href() {
          return navigatedTo;
        }
      };

      openMapDirections(-6.2088, 106.8456);
      expect(navigatedTo).toBe('https://maps.apple.com/?daddr=-6.2088,106.8456');
    });
  });

  describe('Desktop Environment (Windows / Mac / Linux Chrome)', () => {
    const windowsChromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

    beforeEach(() => {
      setUserAgent(windowsChromeUA);
    });

    it('identifies Desktop environment correctly', () => {
      expect(isAndroidDevice()).toBe(false);
      expect(isIOSDevice()).toBe(false);
      expect(isMobileDevice()).toBe(false);
    });

    it('openMapDirections opens Google Maps web in new tab on Desktop', () => {
      let openedUrl = '';
      let openedTarget = '';
      (globalThis as any).window.open = (url?: string | URL, target?: string) => {
        openedUrl = String(url);
        openedTarget = String(target);
        return null;
      };

      openMapDirections(-6.2088, 106.8456);
      expect(openedUrl).toBe('https://www.google.com/maps/dir/?api=1&destination=-6.2088,106.8456');
      expect(openedTarget).toBe('_blank');
    });
  });

  describe('Coordinate parsing and formatting', () => {
    it('formats coordinates to specified decimal places', () => {
      expect(formatCoordinate(-6.2087654321, 4)).toBe('-6.2088');
      expect(formatCoordinate(106.8456123, 6)).toBe('106.845612');
    });

    it('parses comma-separated coordinates', () => {
      const parsed = parseCoordsString('-6.2088, 106.8456');
      expect(parsed).not.toBeNull();
      expect(parsed?.coords.latitude).toBeCloseTo(-6.2088);
      expect(parsed?.coords.longitude).toBeCloseTo(106.8456);
    });

    it('parses space-separated coordinates', () => {
      const parsed = parseCoordsString('-6.2088 106.8456');
      expect(parsed).not.toBeNull();
      expect(parsed?.coords.latitude).toBeCloseTo(-6.2088);
      expect(parsed?.coords.longitude).toBeCloseTo(106.8456);
    });
  });
});
