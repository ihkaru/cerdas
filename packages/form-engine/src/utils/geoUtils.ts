/**
 * Geolocation Utilities for Form Engine
 * Industry-standard GPS handling for PWA and Capacitor
 */

import { Geolocation } from '@capacitor/geolocation';
import { isCapacitorNative } from './imageUtils';

// ============================================================================
// Types
// ============================================================================

export interface GeoPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
  };
  timestamp: number;
}

export interface GeoOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

// ============================================================================
// Default Options
// ============================================================================

const HIGH_ACCURACY_OPTIONS: GeoOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0
};

const LOW_ACCURACY_OPTIONS: GeoOptions = {
  enableHighAccuracy: false,
  timeout: 15000,
  maximumAge: 30000
};

// ============================================================================
// Main Function
// ============================================================================

/**
 * Get current position with automatic platform detection and fallbacks
 * Tries high accuracy first, then falls back to low accuracy
 */
export const getCurrentPosition = async (
  options: GeoOptions = {}
): Promise<GeoPosition> => {
  const isNative = isCapacitorNative();
  
  if (isNative) {
    return getPositionCapacitor(options);
  } else {
    return getPositionWeb(options);
  }
};

// ============================================================================
// Capacitor Implementation
// ============================================================================

const getPositionCapacitor = async (options: GeoOptions = {}): Promise<GeoPosition> => {
  // Check permissions first
  const permStatus = await Geolocation.checkPermissions();
  
  if (permStatus.location !== 'granted') {
    const request = await Geolocation.requestPermissions();
    if (request.location !== 'granted') {
      throw new GeoError('PERMISSION_DENIED', 'Location permission denied');
    }
  }
  
  // Try high accuracy first
  try {
    const position = await Geolocation.getCurrentPosition({
      ...HIGH_ACCURACY_OPTIONS,
      ...options
    });
    return normalizePosition(position);
  } catch (err) {
    console.warn('[Geo] High accuracy failed, trying low accuracy...', err);
  }
  
  // Fallback to low accuracy
  const position = await Geolocation.getCurrentPosition({
    ...LOW_ACCURACY_OPTIONS,
    ...options
  });
  return normalizePosition(position);
};

// ============================================================================
// Web Implementation (PWA)
// ============================================================================

const getPositionWeb = (options: GeoOptions = {}): Promise<GeoPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new GeoError('NOT_SUPPORTED', 'Geolocation is not supported'));
      return;
    }
    
    const attemptGetPosition = (opts: GeoOptions, isRetry = false) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve(normalizePosition(position));
        },
        (error) => {
          if (!isRetry && opts.enableHighAccuracy) {
            // Retry with low accuracy
            console.warn('[Geo] High accuracy failed, trying low accuracy...');
            attemptGetPosition({ ...LOW_ACCURACY_OPTIONS, ...options }, true);
          } else {
            reject(mapWebError(error));
          }
        },
        {
          enableHighAccuracy: opts.enableHighAccuracy ?? true,
          timeout: opts.timeout ?? 10000,
          maximumAge: opts.maximumAge ?? 0
        }
      );
    };
    
    attemptGetPosition({ ...HIGH_ACCURACY_OPTIONS, ...options });
  });
};

// ============================================================================
// Helpers
// ============================================================================

const normalizePosition = (position: any): GeoPosition => ({
  coords: {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    altitude: position.coords.altitude,
    altitudeAccuracy: position.coords.altitudeAccuracy,
    heading: position.coords.heading,
    speed: position.coords.speed
  },
  timestamp: position.timestamp || Date.now()
});

// ============================================================================
// Error Handling
// ============================================================================

export class GeoError extends Error {
  code: string;
  
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'GeoError';
  }
}

const mapWebError = (error: GeolocationPositionError): GeoError => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return new GeoError('PERMISSION_DENIED', 'Location permission denied');
    case error.POSITION_UNAVAILABLE:
      return new GeoError('POSITION_UNAVAILABLE', 'Location unavailable');
    case error.TIMEOUT:
      return new GeoError('TIMEOUT', 'Location request timed out');
    default:
      return new GeoError('UNKNOWN', error.message);
  }
};

/**
 * Get user-friendly error message
 */
export const getGeoErrorMessage = (error: any): string => {
  if (error instanceof GeoError) {
    switch (error.code) {
      case 'PERMISSION_DENIED':
        return 'Permission denied. Please enable Location in settings.';
      case 'POSITION_UNAVAILABLE':
        return 'Location unavailable. Please try again.';
      case 'TIMEOUT':
        return 'GPS timeout. Try moving outdoors.';
      case 'NOT_SUPPORTED':
        return 'GPS not supported on this device.';
      default:
        return 'Failed to get location.';
    }
  }
  
  // Handle Capacitor-specific errors
  const msg = error.message || String(error);
  if (msg.includes('permission')) return 'Permission denied. Please enable Location.';
  if (msg.includes('timeout')) return 'GPS timeout. Try moving outdoors.';
  
  return 'Failed to get location.';
};

// ============================================================================
// Utilities
// ============================================================================

/**
 * Check if GPS is available
 */
export const isGeoAvailable = async (): Promise<boolean> => {
  if (isCapacitorNative()) {
    try {
      const perm = await Geolocation.checkPermissions();
      return perm.location !== 'denied';
    } catch {
      return false;
    }
  }
  return !!navigator.geolocation;
};

/**
 * Format coordinates for display
 */
export const formatCoordinate = (value: number, decimals = 6): string => {
  return value.toFixed(decimals);
};

/**
 * Get Google Maps directions URL
 */
export const getGoogleMapsUrl = (lat: number, lng: number): string => {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
};

/**
 * Get static map image URL (for offline fallback display)
 */
export const getStaticMapUrl = (lat: number, lng: number, zoom = 15): string => {
  // Using OpenStreetMap static tile
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=400x200&maptype=osmarenderer&markers=${lat},${lng},red`;
};
