<template>
  <div class="field-box">
    <label class="field-label">
      {{ field.label }}
      <span v-if="field.required" class="text-color-red">*</span>
    </label>

    <div class="input-wrapper image-wrapper">
      <!-- Image Preview State -->
      <div v-if="value" class="img-preview-container" @click="showFullImage">
        <img :src="displayUrl" class="img-preview" />

        <!-- Overlay Controls -->
        <div class="img-controls" v-if="!field.readonly">
          <f7-button small fill color="white" text-color="black" class="btn-control" @click.stop="captureImage">
            <f7-icon f7="camera_fill" size="16" class="margin-right-half"></f7-icon> Retake
          </f7-button>
          <f7-button small fill color="red" class="btn-control icon-only" @click.stop="clearImage">
            <f7-icon f7="trash" size="16"></f7-icon>
          </f7-button>
        </div>
        
        <!-- Size Indicator -->
        <div v-if="imageSize" class="img-size-badge">{{ imageSize }}</div>
      </div>

      <!-- Empty State -->
      <div v-else class="img-placeholder" :class="{ 'is-readonly': field.readonly }">

        <!-- Interactive Actions -->
        <div v-if="!field.readonly" class="placeholder-actions">
          <div class="action-btn camera-btn" @click.stop="captureImage">
            <f7-icon f7="camera_fill" size="24" color="blue"></f7-icon>
            <span>Camera</span>
          </div>

          <div class="action-divider"></div>

          <div class="action-btn upload-btn" @click.stop="selectFromGallery">
            <f7-icon f7="photo_fill" size="24" color="purple"></f7-icon>
            <span>Gallery</span>
          </div>
        </div>

        <!-- Readonly View -->
        <div v-else class="placeholder-content">
          <f7-icon f7="camera" size="32" class="text-color-gray"></f7-icon>
          <span class="margin-top-half text-color-gray">No image</span>
        </div>

      </div>

      <!-- Processing Indicator -->
      <div v-if="processing" class="processing-overlay">
        <f7-preloader></f7-preloader>
        <span>Processing...</span>
      </div>

      <div v-if="error" class="field-error">{{ error }}</div>
    </div>

    <!-- Hidden File Inputs -->
    <!-- Camera input for mobile browsers -->
    <input 
      type="file" 
      accept="image/*" 
      capture="environment" 
      ref="cameraInput" 
      style="display: none" 
      @change="handleFileCapture" 
    />
    <!-- Gallery input (no capture) -->
    <input 
      type="file" 
      accept="image/*" 
      ref="galleryInput" 
      style="display: none" 
      @change="handleFileCapture" 
    />
  </div>
</template>

<style scoped>
.field-box {
  margin-bottom: 24px;
  padding: 0 16px;
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
  line-height: 1.4;
}

.image-wrapper {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  background: #f8f9fa;
  position: relative;
}

.img-preview-container {
  position: relative;
  width: 100%;
  height: 220px;
  background-color: #222;
  display: flex;
  justify-content: center;
  align-items: center;
}

.img-preview {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

.img-controls {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  background: rgba(0, 0, 0, 0.5);
  padding: 6px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
}

.img-size-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
}

.btn-control {
  height: 32px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 16px;
  text-transform: none;
}

.btn-control.icon-only {
  width: 32px;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.img-placeholder {
  width: 100%;
  height: 140px;
  background: #f0f2f5;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: default;
  transition: background 0.2s;
  border: 2px dashed #d1d5db;
}

.placeholder-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  height: 100%;
  justify-content: center;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  min-width: 80px;
  transition: all 0.2s;
}

.action-btn:active,
.action-btn.active-state {
  background-color: rgba(0, 0, 0, 0.05);
  transform: scale(0.95);
}

.action-btn span {
  font-size: 12px;
  font-weight: 600;
  margin-top: 6px;
  color: #555;
}

.action-divider {
  width: 1px;
  height: 40px;
  background-color: #ddd;
}

.img-placeholder.is-readonly {
  background: #f5f5f5;
  cursor: default;
  border-style: solid;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  z-index: 10;
}

.processing-overlay span {
  font-size: 12px;
  color: #666;
}

.field-error {
  color: #ff3b30;
  font-size: 12px;
  margin-top: 8px;
  padding: 0 12px 12px 12px;
}
</style>

<script setup lang="ts">
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { f7 } from 'framework7-vue';
import { computed, ref } from 'vue';
import type { FieldDefinition } from '../../types/schema';
import {
    compressImage,
    estimateDataUrlSize,
    formatBytes,
    isCapacitorNative,
    validateImageFile
} from '../../utils/imageUtils';

// ============================================================================
// Props & Emits
// ============================================================================

const props = defineProps<{
  field: FieldDefinition;
  value?: string | null;
  error?: string | null;
  context?: Record<string, any>;
}>();

const emit = defineEmits(['update:value']);

// ============================================================================
// Refs
// ============================================================================

const cameraInput = ref<HTMLInputElement | null>(null);
const galleryInput = ref<HTMLInputElement | null>(null);
const processing = ref(false);

// ============================================================================
// Computed
// ============================================================================

const displayUrl = computed(() => {
  if (!props.value) return null;
  
  // If it's already a full URL or data URI, return as is
  if (props.value.startsWith('data:') || props.value.startsWith('http') || props.value.startsWith('blob:')) {
    return props.value;
  }
  
  // Try to resolve via context if provided (e.g. prepend API base URL)
  if (props.context?.resolveAssetUrl) {
    return props.context.resolveAssetUrl(props.value);
  }
  
  return props.value;
});

const imageSize = computed(() => {
  if (!props.value || !props.value.startsWith('data:')) return null;
  const bytes = estimateDataUrlSize(props.value);
  return formatBytes(bytes);
});

// ============================================================================
// Compression Settings (can be overridden via field config)
// ============================================================================

const getCompressionOptions = () => ({
  maxWidth: props.field.config?.maxWidth || 1200,
  maxHeight: props.field.config?.maxHeight || 1200,
  quality: props.field.config?.quality || 0.7,
  mimeType: 'image/jpeg' as const
});

// ============================================================================
// Image Capture Methods
// ============================================================================

/**
 * Main camera capture - routes to Capacitor or PWA method
 */
const captureImage = async () => {
  if (props.field.readonly) return;
  
  if (isCapacitorNative()) {
    await captureWithCapacitor(CameraSource.Camera);
  } else {
    // PWA: Use file input with capture attribute
    cameraInput.value?.click();
  }
};

/**
 * Gallery selection - routes to Capacitor or PWA method
 */
const selectFromGallery = async () => {
  if (props.field.readonly) return;
  
  if (isCapacitorNative()) {
    await captureWithCapacitor(CameraSource.Photos);
  } else {
    // PWA: Use file input without capture
    galleryInput.value?.click();
  }
};

/**
 * Capacitor Camera capture
 */
const captureWithCapacitor = async (source: CameraSource) => {
  processing.value = true;
  
  try {
    const image = await Camera.getPhoto({
      quality: 80, // Higher initial quality, we'll compress after
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source,
      correctOrientation: true,
      // Capacitor handles resizing better on device
      width: 1600,
      height: 1600
    });
    
    if (image.dataUrl) {
      // Compress to reduce storage size
      const compressed = await compressImage(image.dataUrl, getCompressionOptions());
      emit('update:value', compressed);
    }
  } catch (e: any) {
    handleCameraError(e);
  } finally {
    processing.value = false;
  }
};

/**
 * Handle file input change (PWA path)
 */
const handleFileCapture = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  
  // Reset input for re-selection of same file
  (event.target as HTMLInputElement).value = '';
  
  // Validate
  const validation = validateImageFile(file);
  if (!validation.valid) {
    f7.dialog.alert(validation.error!, 'Error');
    return;
  }
  
  processing.value = true;
  
  try {
    // Compress image
    const compressed = await compressImage(file, getCompressionOptions());
    emit('update:value', compressed);
    
    console.log('[ImageField] Compressed image:', {
      original: formatBytes(file.size),
      compressed: formatBytes(estimateDataUrlSize(compressed))
    });
  } catch (e: any) {
    console.error('[ImageField] Compression failed:', e);
    f7.toast.show({ text: 'Failed to process image', closeTimeout: 2000 });
  } finally {
    processing.value = false;
  }
};

/**
 * Handle camera errors with appropriate fallbacks
 */
const handleCameraError = (e: any) => {
  // User cancelled - silently ignore
  if (e.message?.includes('cancelled') || e.message?.includes('User cancelled')) {
    return;
  }
  
  console.warn('[ImageField] Camera error:', e);
  
  // Permission or availability issues - fallback to file picker
  if (
    e.message?.includes('Permission') || 
    e.message?.includes('not allowed') || 
    e.message?.includes('Not implemented') || 
    e.message?.includes('Unavailable')
  ) {
    f7.toast.show({ text: 'Camera unavailable, using file picker...', closeTimeout: 2000 });
    galleryInput.value?.click();
    return;
  }
  
  f7.toast.show({ text: 'Failed to capture image', closeTimeout: 2000 });
};

// ============================================================================
// Actions
// ============================================================================

const clearImage = () => {
  emit('update:value', null);
};

const showFullImage = () => {
  if (!displayUrl.value) return;

  const pb = f7.photoBrowser.create({
    photos: [displayUrl.value],
    theme: 'dark',
    type: 'popup',
    toolbar: false,
    navbar: true
  });
  pb.open();
};
</script>
