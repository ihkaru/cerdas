/**
 * Response and Assignment Types
 */

export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'synced';

export interface Assignment {
  id: string;
  tableId: string;
  tableVersionId: string;
  organizationId: string | null;
  supervisorId: string | null;
  enumeratorId: string | null;
  externalId: string | null;
  status: AssignmentStatus;
  prelistData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;

  // Backward compatibility
  /** @deprecated Use tableVersionId instead */
  schemaVersionId?: string;
}

export interface Response {
  id: string;
  assignmentId: string;
  data: Record<string, unknown>;
  localId: string;
  deviceId: string | null;
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;

  // Backward compatibility / Deprecated
  /** @deprecated Nested forms use data column, parentResponseId is deprecated */
  parentResponseId?: string | null;
}

/**
 * Local (offline) response before sync
 */
export interface LocalResponse {
  localId: string;
  serverId: string | null;
  assignmentId: string;
  data: Record<string, unknown>;
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;

  /** @deprecated Nested forms use data column, parentResponseId is deprecated */
  parentResponseId?: string | null;
}

export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  tableName: string;
  recordId: string;
  payload: Record<string, unknown>;
  attempts: number;
  createdAt: string;
}
