import type { ApiKey, ApiKeyCreationResult, CreateApiKeyInput, UpdateApiKeyInput } from '../models/ApiKey';

/**
 * Secondary (Driven) Port: Repository interface for ApiKey persistence
 */
export interface IApiKeyRepository {
  findAll(): Promise<ApiKey[]>;
  findById(id: string): Promise<ApiKey | null>;
  create(input: CreateApiKeyInput): Promise<ApiKeyCreationResult>;
  update(id: string, input: UpdateApiKeyInput): Promise<ApiKey>;
  revoke(id: string): Promise<ApiKey>;
  delete(id: string): Promise<void>;
  restore(apiKey: ApiKey): Promise<ApiKey>;
  saveAll(keys: ApiKey[]): Promise<void>;
}
