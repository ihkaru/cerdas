import type {
  ApiKey,
  ApiKeyCreationResult,
  ApiKeyStatus,
  CreateApiKeyInput,
  UpdateApiKeyInput,
} from '../domain/models/ApiKey';
import type { IApiKeyRepository } from '../domain/ports/IApiKeyRepository';
import type { IApiKeyService } from '../domain/ports/IApiKeyService';
import type { IStateHistoryManager } from '../domain/ports/IStateHistoryManager';

/**
 * ApiKeyService implements IApiKeyService Use Case port.
 * Applies Hexagonal Architecture and Single Responsibility Principle (SRP).
 * Dependencies (Repository & HistoryManager) are injected via constructor.
 */
export class ApiKeyService implements IApiKeyService {
  constructor(
    private readonly repository: IApiKeyRepository,
    private readonly historyManager: IStateHistoryManager<ApiKey[]>
  ) {}

  /**
   * Helper to capture current state into undo history before applying mutations
   */
  private async snapshotCurrentState(actionDescription: string): Promise<void> {
    const currentKeys = await this.repository.findAll();
    // Deep clone to ensure immutable snapshot
    const cloned = JSON.parse(JSON.stringify(currentKeys)) as ApiKey[];
    this.historyManager.pushSnapshot(cloned, actionDescription);
  }

  async listKeys(filter?: { status?: ApiKeyStatus | 'all'; search?: string }): Promise<ApiKey[]> {
    const keys = await this.repository.findAll();
    return keys.filter((key) => {
      // Status filter
      if (filter?.status && filter.status !== 'all') {
        if (key.status !== filter.status) return false;
      }
      // Search filter
      if (filter?.search && filter.search.trim() !== '') {
        const query = filter.search.toLowerCase().trim();
        const matchesName = key.name.toLowerCase().includes(query);
        const matchesPrefix = key.maskedKey.toLowerCase().includes(query);
        const matchesScope = key.scopes.some((s) => s.toLowerCase().includes(query));
        return matchesName || matchesPrefix || matchesScope;
      }
      return true;
    });
  }

  async getById(id: string): Promise<ApiKey | null> {
    return this.repository.findById(id);
  }

  async createKey(input: CreateApiKeyInput): Promise<ApiKeyCreationResult> {
    await this.snapshotCurrentState(`Membuat API Key: "${input.name}"`);
    return this.repository.create(input);
  }

  async updateKey(id: string, input: UpdateApiKeyInput): Promise<ApiKey> {
    const existing = await this.repository.findById(id);
    const label = existing ? existing.name : id;
    await this.snapshotCurrentState(`Memperbarui API Key: "${label}"`);
    return this.repository.update(id, input);
  }

  async revokeKey(id: string): Promise<ApiKey> {
    const existing = await this.repository.findById(id);
    const label = existing ? existing.name : id;
    await this.snapshotCurrentState(`Mencabut (Revoke) API Key: "${label}"`);
    return this.repository.revoke(id);
  }

  async deleteKey(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    const label = existing ? existing.name : id;
    await this.snapshotCurrentState(`Menghapus API Key: "${label}"`);
    await this.repository.delete(id);
  }

  /**
   * Rollback to the previous state snapshot ("Balik ke state sebelumnya")
   */
  async rollbackToPreviousState(): Promise<{ restoredKeys: ApiKey[]; actionName?: string } | null> {
    if (!this.historyManager.canUndo()) {
      return null;
    }

    const previous = this.historyManager.undo();
    if (!previous) return null;

    // Overwrite repository state with previous snapshot
    await this.repository.saveAll(previous.state);

    return {
      restoredKeys: previous.state,
      actionName: previous.actionName,
    };
  }

  canRollback(): boolean {
    return this.historyManager.canUndo();
  }

  getHistoryDepth(): number {
    return this.historyManager.getHistoryDepth();
  }
}
