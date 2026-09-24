import { beforeEach, describe, expect, it } from 'vitest';
import { ApiKeyService } from '../../src/app/api-keys/application/ApiKeyService';
import {
  generateIndustryStandardKey,
  HttpApiKeyRepository,
} from '../../src/app/api-keys/adapters/secondary/HttpApiKeyRepository';
import { InMemoryStateHistoryAdapter } from '../../src/app/api-keys/adapters/secondary/InMemoryStateHistoryAdapter';
import type { ApiKey } from '../../src/app/api-keys/domain/models/ApiKey';

describe('ApiKey Management & Hexagonal Architecture', () => {
  let repository: HttpApiKeyRepository;
  let historyManager: InMemoryStateHistoryAdapter<ApiKey[]>;
  let service: ApiKeyService;

  beforeEach(() => {
    // Reset local storage mock
    const store: Record<string, string> = {};
    globalThis.localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
      length: 0,
      key: () => null,
    };

    repository = new HttpApiKeyRepository();
    historyManager = new InMemoryStateHistoryAdapter<ApiKey[]>(20);
    service = new ApiKeyService(repository, historyManager);
  });

  describe('Industry Standard Token Generation (2026)', () => {
    it('generates secret token with correct crd_live_ prefix and 32 chars entropy', () => {
      const liveKey = generateIndustryStandardKey('live');
      expect(liveKey.prefix).toBe('crd_live_');
      expect(liveKey.plainTextToken.startsWith('crd_live_')).toBe(true);
      expect(liveKey.plainTextToken.length).toBe(9 + 32); // 'crd_live_' is 9 chars + 32 random chars
      expect(liveKey.maskedKey.startsWith('crd_live_••••••••••••')).toBe(true);
    });

    it('generates secret token with correct crd_test_ prefix for sandbox', () => {
      const testKey = generateIndustryStandardKey('test');
      expect(testKey.prefix).toBe('crd_test_');
      expect(testKey.plainTextToken.startsWith('crd_test_')).toBe(true);
      expect(testKey.plainTextToken.length).toBe(9 + 32);
    });
  });

  describe('CRUD Operations', () => {
    it('creates a new API key with granular scopes and TTL', async () => {
      const result = await service.createKey({
        name: 'Field Survey Ingestion Key',
        environment: 'live',
        scopes: ['records:write', 'tables:read'],
        expiresInDays: 30,
      });

      expect(result.apiKey).toBeDefined();
      expect(result.apiKey.name).toBe('Field Survey Ingestion Key');
      expect(result.apiKey.environment).toBe('live');
      expect(result.apiKey.scopes).toEqual(['records:write', 'tables:read']);
      expect(result.apiKey.status).toBe('active');
      expect(result.plainTextToken).toBeDefined();
      expect(result.plainTextToken.startsWith('crd_live_')).toBe(true);

      const allKeys = await service.listKeys();
      expect(allKeys.some((k) => k.id === result.apiKey.id)).toBe(true);
    });

    it('updates an existing API key', async () => {
      const created = await service.createKey({
        name: 'Initial Name',
        environment: 'live',
        scopes: ['records:read'],
        expiresInDays: null,
      });

      const updated = await service.updateKey(created.apiKey.id, {
        name: 'Updated Name',
        scopes: ['records:read', 'records:write'],
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.scopes).toEqual(['records:read', 'records:write']);
    });

    it('revokes an API key successfully', async () => {
      const created = await service.createKey({
        name: 'Key To Revoke',
        environment: 'test',
        scopes: ['apps:read'],
        expiresInDays: null,
      });

      const revoked = await service.revokeKey(created.apiKey.id);
      expect(revoked.status).toBe('revoked');

      const fetched = await service.getById(created.apiKey.id);
      expect(fetched?.status).toBe('revoked');
    });

    it('deletes an API key', async () => {
      const created = await service.createKey({
        name: 'Key To Delete',
        environment: 'test',
        scopes: ['apps:read'],
        expiresInDays: null,
      });

      await service.deleteKey(created.apiKey.id);
      const fetched = await service.getById(created.apiKey.id);
      expect(fetched).toBeNull();
    });
  });

  describe('State Rollback ("Balik ke State Sebelumnya" / Undo)', () => {
    it('restores deleted key when rolling back', async () => {
      const created = await service.createKey({
        name: 'Accidentally Deleted Key',
        environment: 'live',
        scopes: ['admin:all'],
        expiresInDays: 60,
      });

      // Confirm key exists
      expect(await service.getById(created.apiKey.id)).not.toBeNull();

      // Delete key
      await service.deleteKey(created.apiKey.id);
      expect(await service.getById(created.apiKey.id)).toBeNull();
      expect(service.canRollback()).toBe(true);

      // Rollback to previous state
      const rollbackResult = await service.rollbackToPreviousState();
      expect(rollbackResult).not.toBeNull();
      expect(rollbackResult?.actionName).toContain('Menghapus API Key');

      // Key must be restored!
      const restored = await service.getById(created.apiKey.id);
      expect(restored).not.toBeNull();
      expect(restored?.name).toBe('Accidentally Deleted Key');
      expect(restored?.status).toBe('active');
    });

    it('restores active status when undoing a revocation', async () => {
      const created = await service.createKey({
        name: 'Revoked Key To Undo',
        environment: 'live',
        scopes: ['sync:trigger'],
        expiresInDays: null,
      });

      // Revoke key
      await service.revokeKey(created.apiKey.id);
      expect((await service.getById(created.apiKey.id))?.status).toBe('revoked');

      // Undo revocation
      await service.rollbackToPreviousState();
      const reverted = await service.getById(created.apiKey.id);
      expect(reverted?.status).toBe('active');
    });

    it('handles multiple undo steps in history stack', async () => {
      const key1 = await service.createKey({
        name: 'Key 1',
        environment: 'live',
        scopes: ['apps:read'],
        expiresInDays: null,
      });

      const key2 = await service.createKey({
        name: 'Key 2',
        environment: 'test',
        scopes: ['tables:read'],
        expiresInDays: null,
      });

      expect(service.getHistoryDepth()).toBeGreaterThanOrEqual(2);

      // Undo key2 creation
      await service.rollbackToPreviousState();
      expect(await service.getById(key2.apiKey.id)).toBeNull();
      expect(await service.getById(key1.apiKey.id)).not.toBeNull();

      // Undo key1 creation
      await service.rollbackToPreviousState();
      expect(await service.getById(key1.apiKey.id)).toBeNull();
    });
  });
});
