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

const {
  formatCoordinate,
  getDirectionsUrl,
  getGoogleMapsUrl,
  isAndroidDevice,
  isIOSDevice,
  isMobileDevice,
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

    it('generates Chrome Android Intent URL targeting Google Maps app with fallback', () => {
      const lat = -6.2088;
      const lng = 106.8456;
      const url = getDirectionsUrl(lat, lng);

      expect(url.startsWith('intent://maps.google.com/maps?daddr=-6.2088,106.8456')).toBe(true);
      expect(url).toContain('package=com.google.android.apps.maps');
      expect(url).toContain('scheme=https');
      expect(url).toContain('S.browser_fallback_url=');
      expect(url.endsWith(';end')).toBe(true);

      // Verify the fallback URL inside the intent is properly URL encoded
      const expectedFallback = encodeURIComponent(getGoogleMapsUrl(lat, lng));
      expect(url).toContain(`S.browser_fallback_url=${expectedFallback}`);
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

    it('generates Apple Maps URL for iOS', () => {
      const url = getDirectionsUrl(-6.2088, 106.8456);
      expect(url).toBe('https://maps.apple.com/?daddr=-6.2088,106.8456');
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

    it('generates universal Google Maps web directions URL on Desktop', () => {
      const url = getDirectionsUrl(-6.2088, 106.8456);
      expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=-6.2088,106.8456');
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
