/**
 * Image Utilities for Form Engine
 * Industry-standard image handling for PWA and Capacitor
 */

// ============================================================================
// Platform Detection
// ============================================================================

export const isCapacitorNative = (): boolean => {
  return typeof (window as any).Capacitor !== 'undefined' 
    && (window as any).Capacitor.isNativePlatform?.() === true;
};

export const isMobileBrowser = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// ============================================================================
// Image Compression
// ============================================================================

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 to 1.0
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.7,
  mimeType: 'image/jpeg'
};

/**
 * Compress an image file or blob to a data URL
 * Uses canvas for resizing and quality reduction
 */
export const compressImage = async (
  source: File | Blob | string,
  options: CompressionOptions = {}
): Promise<string> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Create image element
  const img = await loadImage(source);
  
  // Calculate new dimensions
  const { width, height } = calculateDimensions(
    img.width, 
    img.height, 
    opts.maxWidth!, 
    opts.maxHeight!
  );
  
  // Use OffscreenCanvas if available (better performance)
  const canvas = typeof OffscreenCanvas !== 'undefined' 
    ? new OffscreenCanvas(width, height)
    : document.createElement('canvas');
  
  if (!(canvas instanceof OffscreenCanvas)) {
    canvas.width = width;
    canvas.height = height;
  }
  
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  if (!ctx) throw new Error('Canvas context not available');
  
  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw image
  ctx.drawImage(img, 0, 0, width, height);
  
  // Convert to blob/dataUrl
  if (canvas instanceof OffscreenCanvas) {
    const blob = await canvas.convertToBlob({ 
      type: opts.mimeType, 
      quality: opts.quality 
    });
    return blobToDataUrl(blob);
  } else {
    return canvas.toDataURL(opts.mimeType, opts.quality);
  }
};

/**
 * Load an image from various sources
 */
const loadImage = (source: File | Blob | string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    
    if (typeof source === 'string') {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
};

/**
 * Calculate new dimensions maintaining aspect ratio
 */
const calculateDimensions = (
  origWidth: number,
  origHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  let width = origWidth;
  let height = origHeight;
  
  // Only resize if larger than max
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  
  return { width, height };
};

/**
 * Convert Blob to Data URL
 */
const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
};

// ============================================================================
// File Size Utilities
// ============================================================================

/**
 * Estimate data URL size in bytes
 */
export const estimateDataUrlSize = (dataUrl: string): number => {
  // Base64 encoded data is ~33% larger than original
  const base64Part = dataUrl.split(',')[1];
  if (!base64Part) return 0;
  return Math.round(base64Part.length * 0.75);
};

/**
 * Format bytes to human readable
 */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ============================================================================
// Validation
// ============================================================================

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }
  
  // Check size
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: `Image too large (max ${formatBytes(MAX_IMAGE_SIZE)})` };
  }
  
  return { valid: true };
};
