/**
 * Domain Models for Developer API Keys
 * Compliant with 2026 Industry Best Practices (Secret Scanning, Prefixing, Granular Scopes)
 */

export type ApiKeyEnvironment = 'live' | 'test';

export type ApiKeyStatus = 'active' | 'revoked' | 'expired';

export interface ApiKeyScope {
  id: string;
  name: string;
  description: string;
  category: 'applications' | 'schema' | 'records' | 'sync' | 'admin';
}

export const STANDARD_API_SCOPES: readonly ApiKeyScope[] = [
  // Applications
  {
    id: 'apps:read',
    name: 'Read Applications',
    description: 'View list of applications, basic metadata, and status.',
    category: 'applications',
  },
  {
    id: 'apps:write',
    name: 'Manage Applications',
    description: 'Create, modify, and manage application configurations.',
    category: 'applications',
  },

  // Schema & Tables
  {
    id: 'tables:read',
    name: 'Read Tables & Schema',
    description: 'Inspect table structures, field definitions, and schema versions.',
    category: 'schema',
  },
  {
    id: 'tables:write',
    name: 'Modify Tables & Schema',
    description: 'Create tables, update columns, publish versions, and adjust validation.',
    category: 'schema',
  },

  // Records & Responses
  {
    id: 'records:read',
    name: 'Read Data Records',
    description: 'Query and fetch survey responses and table records.',
    category: 'records',
  },
  {
    id: 'records:write',
    name: 'Submit & Edit Records',
    description: 'Insert new survey responses and update existing data records.',
    category: 'records',
  },

  // Sync & Automations
  {
    id: 'sync:trigger',
    name: 'Trigger 2-Way Sync',
    description: 'Manually trigger bi-directional Google Sheet and external webhook sync.',
    category: 'sync',
  },

  // Admin
  {
    id: 'admin:all',
    name: 'Full Administrator Access',
    description: 'Unrestricted access across all workspace resources and settings.',
    category: 'admin',
  },
] as const;

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string; // e.g. 'crd_live_'
  maskedKey: string; // e.g. 'crd_live_••••••••••••3f9a'
  tokenHash?: string;
  environment: ApiKeyEnvironment;
  scopes: string[];
  status: ApiKeyStatus;
  expiresAt: string | null; // ISO 8601 string or null for never
  lastUsedAt: string | null;
  lastUsedIp?: string | null;
  totalRequests: number;
  ipWhitelist?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiKeyInput {
  name: string;
  environment: ApiKeyEnvironment;
  scopes: string[];
  expiresInDays: number | null; // 30, 60, 90, 365, or null (never)
  ipWhitelist?: string[];
}

export interface UpdateApiKeyInput {
  name?: string;
  scopes?: string[];
  status?: ApiKeyStatus;
  ipWhitelist?: string[];
}

export interface ApiKeyCreationResult {
  apiKey: ApiKey;
  plainTextToken: string; // Secret key shown ONCE upon generation
}
