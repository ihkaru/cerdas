import { f7 } from 'framework7-vue';
import { computed, inject, provide, ref, type InjectionKey } from 'vue';
import { ApiKeyService } from '../../application/ApiKeyService';
import type {
  ApiKey,
  ApiKeyCreationResult,
  ApiKeyEnvironment,
  ApiKeyStatus,
  CreateApiKeyInput,
  UpdateApiKeyInput,
} from '../../domain/models/ApiKey';
import type { IApiKeyService } from '../../domain/ports/IApiKeyService';
import { HttpApiKeyRepository } from '../secondary/HttpApiKeyRepository';
import { InMemoryStateHistoryAdapter } from '../secondary/InMemoryStateHistoryAdapter';

export const API_KEY_SERVICE_KEY: InjectionKey<IApiKeyService> = Symbol('ApiKeyService');

/**
 * Dependency Injection Provider for ApiKeyService
 */
export function provideApiKeyService(customService?: IApiKeyService): IApiKeyService {
  const service =
    customService ??
    new ApiKeyService(new HttpApiKeyRepository(), new InMemoryStateHistoryAdapter<ApiKey[]>());
  provide(API_KEY_SERVICE_KEY, service);
  return service;
}

/**
 * Primary Adapter: Composable for API Key Management in Vue Components
 */
export function useApiKeyManagement() {
  const injectedService = inject(API_KEY_SERVICE_KEY, null);
  const service =
    injectedService ??
    new ApiKeyService(new HttpApiKeyRepository(), new InMemoryStateHistoryAdapter<ApiKey[]>());

  const keys = ref<ApiKey[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Filters & Search
  const searchQuery = ref('');
  const statusFilter = ref<ApiKeyStatus | 'all'>('all');
  const envFilter = ref<ApiKeyEnvironment | 'all'>('all');

  // Active Key for Detail/Edit/Secret Reveal
  const selectedKey = ref<ApiKey | null>(null);
  const newlyCreatedSecret = ref<string | null>(null);
  const newlyCreatedKey = ref<ApiKey | null>(null);

  // Undo / State rollback availability
  const canUndo = ref(false);
  const lastActionMessage = ref<string | null>(null);

  function syncUndoState() {
    canUndo.value = service.canRollback();
  }

  async function fetchKeys() {
    loading.value = true;
    error.value = null;
    try {
      keys.value = await service.listKeys();
      syncUndoState();
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat daftar API Key';
    } finally {
      loading.value = false;
    }
  }

  const filteredKeys = computed(() => {
    return keys.value.filter((key) => {
      // Status filter
      if (statusFilter.value !== 'all' && key.status !== statusFilter.value) {
        return false;
      }
      // Environment filter
      if (envFilter.value !== 'all' && key.environment !== envFilter.value) {
        return false;
      }
      // Search query
      if (searchQuery.value.trim() !== '') {
        const query = searchQuery.value.toLowerCase().trim();
        const matchesName = key.name.toLowerCase().includes(query);
        const matchesPrefix = key.maskedKey.toLowerCase().includes(query);
        const matchesScope = key.scopes.some((s) => s.toLowerCase().includes(query));
        return matchesName || matchesPrefix || matchesScope;
      }
      return true;
    });
  });

  const stats = computed(() => {
    const total = keys.value.length;
    const active = keys.value.filter((k) => k.status === 'active').length;
    const revoked = keys.value.filter((k) => k.status === 'revoked').length;
    const expired = keys.value.filter((k) => k.status === 'expired').length;
    const liveKeys = keys.value.filter((k) => k.environment === 'live').length;
    const totalRequests = keys.value.reduce((acc, k) => acc + (k.totalRequests || 0), 0);

    return { total, active, revoked, expired, liveKeys, totalRequests };
  });

  async function createKey(input: CreateApiKeyInput): Promise<ApiKeyCreationResult> {
    loading.value = true;
    try {
      const result = await service.createKey(input);
      keys.value = await service.listKeys();
      newlyCreatedSecret.value = result.plainTextToken;
      newlyCreatedKey.value = result.apiKey;
      syncUndoState();

      f7.toast
        .create({
          text: `API Key "${result.apiKey.name}" berhasil dibuat.`,
          position: 'bottom',
          closeTimeout: 3000,
          cssClass: 'color-green',
        })
        .open();

      return result;
    } catch (e: any) {
      error.value = e?.message || 'Gagal membuat API Key';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateKey(id: string, input: UpdateApiKeyInput): Promise<ApiKey> {
    loading.value = true;
    try {
      const updated = await service.updateKey(id, input);
      keys.value = await service.listKeys();
      syncUndoState();

      f7.toast
        .create({
          text: `API Key "${updated.name}" berhasil diperbarui.`,
          position: 'bottom',
          closeTimeout: 3000,
          cssClass: 'color-blue',
        })
        .open();

      return updated;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memperbarui API Key';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function revokeKey(id: string): Promise<ApiKey> {
    loading.value = true;
    try {
      const target = keys.value.find((k) => k.id === id);
      const name = target?.name || id;
      const revoked = await service.revokeKey(id);
      keys.value = await service.listKeys();
      syncUndoState();

      // Show toast with Undo action
      f7.toast
        .create({
          text: `API Key "${name}" telah dicabut.`,
          position: 'bottom',
          closeButton: true,
          closeButtonText: 'Batalkan (Undo)',
          closeButtonColor: 'yellow',
          closeTimeout: 7000,
          on: {
            closeButtonClick: async () => {
              await undoLastAction();
            },
          },
        })
        .open();

      return revoked;
    } catch (e: any) {
      error.value = e?.message || 'Gagal mencabut API Key';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function deleteKey(id: string): Promise<void> {
    loading.value = true;
    try {
      const target = keys.value.find((k) => k.id === id);
      const name = target?.name || id;
      await service.deleteKey(id);
      keys.value = await service.listKeys();
      syncUndoState();

      // Show toast with Undo action
      f7.toast
        .create({
          text: `API Key "${name}" telah dihapus.`,
          position: 'bottom',
          closeButton: true,
          closeButtonText: 'Batalkan (Undo)',
          closeButtonColor: 'yellow',
          closeTimeout: 7000,
          on: {
            closeButtonClick: async () => {
              await undoLastAction();
            },
          },
        })
        .open();
    } catch (e: any) {
      error.value = e?.message || 'Gagal menghapus API Key';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Revert state to previous snapshot ("Balik ke state sebelumnya")
   */
  async function undoLastAction(): Promise<boolean> {
    if (!service.canRollback()) {
      f7.toast
        .create({
          text: 'Tidak ada riwayat untuk dibatalkan.',
          position: 'bottom',
          closeTimeout: 2000,
        })
        .open();
      return false;
    }

    loading.value = true;
    try {
      const result = await service.rollbackToPreviousState();
      if (result) {
        keys.value = result.restoredKeys;
        syncUndoState();
        lastActionMessage.value = result.actionName || null;

        f7.toast
          .create({
            text: `Berhasil membatalkan tindakan: ${result.actionName || 'State sebelumnya dipulihkan'}`,
            position: 'center',
            closeTimeout: 3000,
            cssClass: 'color-green',
          })
          .open();

        return true;
      }
      return false;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memulihkan state sebelumnya';
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    keys,
    filteredKeys,
    loading,
    error,
    searchQuery,
    statusFilter,
    envFilter,
    selectedKey,
    newlyCreatedSecret,
    newlyCreatedKey,
    canUndo,
    lastActionMessage,
    stats,

    // Methods
    fetchKeys,
    createKey,
    updateKey,
    revokeKey,
    deleteKey,
    undoLastAction,
    syncUndoState,
  };
}
