/**
 * Response and Assignment Types
 */

export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'synced';

export interface Assignment {
  id: number;
  schemaVersionId: number;
  organizationId: number;
  supervisorId: number;
  enumeratorId: number;
  externalId: string | null;
  status: AssignmentStatus;
  prelistData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Response {
  id: number;
  assignmentId: number;
  parentResponseId: number | null;
  data: Record<string, unknown>;
  localId: string;
  deviceId: string | null;
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Local (offline) response before sync
 */
export interface LocalResponse {
  localId: string;
  serverId: number | null;
  assignmentId: number;
  parentResponseId: string | null;
  data: Record<string, unknown>;
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SyncQueueItem {
  id: number;
  action: 'create' | 'update' | 'delete';
  tableName: string;
  recordId: string;
  payload: Record<string, unknown>;
  attempts: number;
  createdAt: string;
}
