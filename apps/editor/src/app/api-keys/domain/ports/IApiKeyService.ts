import type {
  ApiKey,
  ApiKeyCreationResult,
  ApiKeyStatus,
  CreateApiKeyInput,
  UpdateApiKeyInput,
} from '../models/ApiKey';

/**
 * Primary (Driving) Port: Application Use Cases interface for API Key management
 */
export interface IApiKeyService {
  listKeys(filter?: { status?: ApiKeyStatus | 'all'; search?: string }): Promise<ApiKey[]>;
  getById(id: string): Promise<ApiKey | null>;
  createKey(input: CreateApiKeyInput): Promise<ApiKeyCreationResult>;
  updateKey(id: string, input: UpdateApiKeyInput): Promise<ApiKey>;
  revokeKey(id: string): Promise<ApiKey>;
  deleteKey(id: string): Promise<void>;
  rollbackToPreviousState(): Promise<{ restoredKeys: ApiKey[]; actionName?: string } | null>;
  canRollback(): boolean;
  getHistoryDepth(): number;
}
