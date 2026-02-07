import { reactive, readonly } from 'vue';
import type { PreviewState } from '../../types/editor.types';

const previewState = reactive<PreviewState>({
  device: 'phone',
  orientation: 'portrait',
  sampleData: {},
});

export function usePreviewState() {
  function setPreviewDevice(device: 'phone' | 'tablet'): void {
    previewState.device = device;
  }

  function setPreviewOrientation(orientation: 'portrait' | 'landscape'): void {
    previewState.orientation = orientation;
  }

  function updatePreviewData(data: Record<string, unknown>): void {
    previewState.sampleData = data;
  }

  return {
    previewState: readonly(previewState),
    setPreviewDevice,
    setPreviewOrientation,
    updatePreviewData,
  };
}
