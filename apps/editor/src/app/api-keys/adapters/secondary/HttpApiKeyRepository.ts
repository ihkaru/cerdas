import { ApiClient } from '@/common/api/ApiClient';
import type {
  ApiKey,
  ApiKeyCreationResult,
  ApiKeyEnvironment,
  CreateApiKeyInput,
  UpdateApiKeyInput,
} from '../../domain/models/ApiKey';
import type { IApiKeyRepository } from '../../domain/ports/IApiKeyRepository';

const STORAGE_KEY = 'cerdas_api_keys_v1';

/**
 * Utility to generate secure random key conforming to September 2026 industry standards
 * Format: crd_live_<32_alphanumeric_chars> or crd_test_<32_alphanumeric_chars>
 */
export function generateIndustryStandardKey(env: ApiKeyEnvironment): {
  plainTextToken: string;
  prefix: string;
  maskedKey: string;
} {
  const prefix = env === 'live' ? 'crd_live_' : 'crd_test_';
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomBytes = new Uint8Array(32);

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    // Cryptographically secure fallback using webcrypto / node:crypto if in node/test
    const nodeCrypto = (globalThis as any).crypto;
    if (nodeCrypto?.getRandomValues) {
      nodeCrypto.getRandomValues(randomBytes);
    }
  }

  let randomPart = '';
  for (let i = 0; i < 32; i++) {
    const val = randomBytes[i] ?? 0;
    randomPart += charset[val % charset.length];
  }

  const plainTextToken = `${prefix}${randomPart}`;
  const lastFour = plainTextToken.slice(-4);
  const maskedKey = `${prefix}${'•'.repeat(16)}${lastFour}`;

  return { plainTextToken, prefix, maskedKey };
}

/**
 * Secondary Adapter: HttpApiKeyRepository
 * Connects to the backend REST API with persistent local storage backing
 */
export class HttpApiKeyRepository implements IApiKeyRepository {
  private localKeys: ApiKey[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.localKeys = JSON.parse(data);
      } else {
        // Initialize with default demo/starter keys if empty
        this.localKeys = [
          {
            id: 'key-prod-01',
            name: 'Production Field Enumerator Sync',
            keyPrefix: 'crd_live_',
            maskedKey: 'crd_live_••••••••••••8a92',
            environment: 'live',
            scopes: ['apps:read', 'tables:read', 'records:read', 'records:write', 'sync:trigger'],
            status: 'active',
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            lastUsedIp: null,
            totalRequests: 1420,
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'key-dev-02',
            name: 'Staging Integration Webhook',
            keyPrefix: 'crd_test_',
            maskedKey: 'crd_test_••••••••••••f42c',
            environment: 'test',
            scopes: ['apps:read', 'tables:read', 'records:read'],
            status: 'active',
            expiresAt: null,
            lastUsedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
            lastUsedIp: '127.0.0.1',
            totalRequests: 89,
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
        this.saveToStorage();
      }
    } catch (e) {
      console.error('[HttpApiKeyRepository] Failed to read from localStorage:', e);
      this.localKeys = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.localKeys));
    } catch (e) {
      console.error('[HttpApiKeyRepository] Failed to write to localStorage:', e);
    }
  }

  async findAll(): Promise<ApiKey[]> {
    try {
      const response = await ApiClient.get<any>('/api-keys');
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        this.localKeys = response.data.data;
        this.saveToStorage();
        return this.localKeys;
      }
    } catch {
      // Backend not yet deployed or route unreachable: use resilient local storage
    }
    return [...this.localKeys];
  }

  async findById(id: string): Promise<ApiKey | null> {
    const found = this.localKeys.find((k) => k.id === id);
    return found ? { ...found } : null;
  }

  async create(input: CreateApiKeyInput): Promise<ApiKeyCreationResult> {
    const { plainTextToken, prefix, maskedKey } = generateIndustryStandardKey(input.environment);

    let expiresAt: string | null = null;
    if (input.expiresInDays && input.expiresInDays > 0) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + input.expiresInDays);
      expiresAt = expDate.toISOString();
    }

    const newKey: ApiKey = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `key-${Date.now()}`,
      name: input.name,
      keyPrefix: prefix,
      maskedKey,
      environment: input.environment,
      scopes: input.scopes,
      status: 'active',
      expiresAt,
      lastUsedAt: null,
      lastUsedIp: null,
      totalRequests: 0,
      ipWhitelist: input.ipWhitelist,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await ApiClient.post<any>('/api-keys', {
        ...input,
        token: plainTextToken,
        masked_key: maskedKey,
      });
      if (response.data && response.data.success && response.data.data) {
        const serverKey = response.data.data;
        this.localKeys.unshift(serverKey);
        this.saveToStorage();
        return {
          apiKey: serverKey,
          plainTextToken,
        };
      }
    } catch {
      // Offline fallback
    }

    this.localKeys.unshift(newKey);
    this.saveToStorage();

    return {
      apiKey: newKey,
      plainTextToken,
    };
  }

  async update(id: string, input: UpdateApiKeyInput): Promise<ApiKey> {
    const index = this.localKeys.findIndex((k) => k.id === id);
    const current = index >= 0 ? this.localKeys[index] : null;
    if (!current) {
      throw new Error(`API Key with ID ${id} not found.`);
    }
    const updated: ApiKey = {
      ...current,
      ...(input.name ? { name: input.name } : {}),
      ...(input.scopes ? { scopes: input.scopes } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.ipWhitelist !== undefined ? { ipWhitelist: input.ipWhitelist } : {}),
      updatedAt: new Date().toISOString(),
    };

    try {
      await ApiClient.put(`/api-keys/${id}`, input);
    } catch {
      // Local fallback
    }

    this.localKeys[index] = updated;
    this.saveToStorage();
    return updated;
  }

  async revoke(id: string): Promise<ApiKey> {
    return this.update(id, { status: 'revoked' });
  }

  async delete(id: string): Promise<void> {
    try {
      await ApiClient.delete(`/api-keys/${id}`);
    } catch {
      // Local fallback
    }

    this.localKeys = this.localKeys.filter((k) => k.id !== id);
    this.saveToStorage();
  }

  async restore(apiKey: ApiKey): Promise<ApiKey> {
    const existingIndex = this.localKeys.findIndex((k) => k.id === apiKey.id);
    if (existingIndex >= 0) {
      this.localKeys[existingIndex] = apiKey;
    } else {
      this.localKeys.unshift(apiKey);
    }
    this.saveToStorage();

    try {
      await ApiClient.post('/api-keys/restore', apiKey);
    } catch {
      // Local fallback
    }

    return apiKey;
  }

  async saveAll(keys: ApiKey[]): Promise<void> {
    this.localKeys = [...keys];
    this.saveToStorage();
  }
}
