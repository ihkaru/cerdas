<template>
  <div class="field-box">
    <label class="field-label">
      {{ field.label }}
      <span v-if="field.required" class="text-color-red">*</span>
    </label>

    <div class="input-wrapper image-wrapper">
      <!-- Image Preview State -->
      <div v-if="value" class="img-preview-container" @click="showFullImage">
        <img :src="imageUrl" class="img-preview" />

        <!-- Overlay Controls -->
        <div class="img-controls" v-if="!field.readonly">
          <f7-button small fill color="white" text-color="black" class="btn-control" @click.stop="takePhoto">
            <f7-icon f7="camera_fill" size="16" class="margin-right-half"></f7-icon> Retake
          </f7-button>
          <f7-button small fill color="red" class="btn-control icon-only" @click.stop="$emit('update:value', null)">
            <f7-icon f7="trash" size="16"></f7-icon>
          </f7-button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="img-placeholder" :class="{ 'is-readonly': field.readonly }">

        <!-- Interactive Actions -->
        <div v-if="!field.readonly" class="placeholder-actions">
          <div class="action-btn camera-btn" @click.stop="takePhoto">
            <f7-icon f7="camera_fill" size="24" color="blue"></f7-icon>
            <span>Camera</span>
          </div>

          <div class="action-divider"></div>

          <div class="action-btn upload-btn" @click.stop="triggerUpload">
            <f7-icon f7="photo_fill" size="24" color="purple"></f7-icon>
            <span>Upload</span>
          </div>
        </div>

        <!-- Readonly View -->
        <div v-else class="placeholder-content">
          <f7-icon f7="camera" size="32" class="text-color-gray"></f7-icon>
          <span class="margin-top-half text-color-gray">No image</span>
        </div>

      </div>

      <div v-if="error" class="field-error">{{ error }}</div>
    </div>

    <!-- Hidden File Input for Fallback -->
    <input type="file" accept="image/*" ref="fileInput" style="display: none" @change="handleFileUpload" />

    <!-- Using Framework7 Photo Browser logic for zoom (simplified here via simple binding, 
         in real app f7-photo-browser is better but complex to setup dynamically per field) -->
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
}

.img-preview-container {
  position: relative;
  width: 100%;
  height: 220px;
  /* Fixed height for consistency */
  background-color: #222;
  /* Dark bg for images */
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
  /* Ensure full image is visible */
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
  /* Changed from pointer as inner buttons assume role */
  transition: background 0.2s;
  border: 2px dashed #d1d5db;
}

/* Actions Container */
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

.img-placeholder:active {
  /* Remove global active state on placeholder */
  background: #f0f2f5;
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

const props = defineProps<{
  field: FieldDefinition;
  value?: string | null;
  error?: string | null;
  context?: Record<string, any>;
}>();

const emit = defineEmits(['update:value']);
const fileInput = ref<HTMLInputElement | null>(null);

const imageUrl = computed(() => {
  if (!props.value) return null;
  // If it's already a full URL or data URI, return as is
  if (props.value.startsWith('data:image/') || props.value.startsWith('http') || props.value.startsWith('blob:')) {
    return props.value;
  }
  // Try to resolve via context if provided (e.g. prepend API base URL)
  if (props.context?.resolveAssetUrl) {
    return props.context.resolveAssetUrl(props.value);
  }
  return props.value;
});

const triggerUpload = () => {
  fileInput.value?.click();
};

const showFullImage = () => {
  // ... (keep existing) ...
  if (!imageUrl.value) return;

  const pb = f7.photoBrowser.create({
    photos: [imageUrl.value],
    theme: 'dark',
    type: 'popup',
    toolbar: false,
    navbar: true
  });
  pb.open();
};

const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    // Validate size (e.g. max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      f7.dialog.alert('Image too large (Max 5MB)', 'Error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      // Compress logic could be added here if needed, for now raw base64
      emit('update:value', e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }
};

const showSourceOptions = () => {
  if (props.field.readonly) return;

  const buttons = [
    {
      text: 'Ambil Foto',
      icon: '<i class="icon f7-icons">camera</i>',
      onClick: () => takePhoto()
    },
    {
      text: 'Pilih File',
      icon: '<i class="icon f7-icons">photo</i>',
      onClick: () => fileInput.value?.click()
    },
    {
      text: 'Batal',
      color: 'red',
      close: true
    }
  ];

  f7.actions.create({ buttons }).open();
};

const takePhoto = async () => {
  try {
    const image = await Camera.getPhoto({
      // PERFORMANCE: Reduced quality to prevent main thread overload
      // Base64 strings at 90 quality can be huge (2-5MB) and freeze SQLite writes
      quality: 60,
      // Limit dimensions to reduce Base64 size further
      width: 800,
      height: 800,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      // Ensure JPEG for consistent compression
      correctOrientation: true,
    });
    emit('update:value', image.dataUrl);
  } catch (e: any) {
    // Ignore if user cancelled
    if (e.message?.includes('cancelled') || e.message?.includes('User cancelled')) {
      return;
    }

    console.warn('[ImageField] Camera failed, trying fallback:', e);

    // Fallback for Permission/Web errors
    if (e.message?.includes('Permission') || e.message?.includes('not allowed') || e.message?.includes('Not implemented') || e.message?.includes('Unavailable')) {
      f7.toast.show({ text: 'Camera unavailable, trying file upload...', closeTimeout: 2000 });
      fileInput.value?.click();
      return;
    }

    console.error(e);
    f7.toast.show({ text: 'Failed to take photo', closeTimeout: 2000 });
  }
};
</script>
