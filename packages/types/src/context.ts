/**
 * Context Object Pattern Types
 * Used for dependency injection in service layer
 */

import type { AuthedUser, UserRole } from './auth';

/**
 * Base application context
 * Injected into service functions for DI
 */
export interface AppContext {
  /** API client for HTTP requests */
  api: ApiClient;
  
  /** Framework7 router instance */
  router: AppRouter;
  
  /** SQLite database connection */
  db: DatabaseConnection;
  
  /** Currently authenticated user (null if not logged in) */
  currentUser: AuthedUser | null;
  
  /** Show notification/toast to user */
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

/**
 * Context when user is guaranteed to be authenticated
 */
export type AuthedContext = AppContext & {
  currentUser: AuthedUser;
};

/**
 * Minimal context for expression evaluation
 */
export interface ExpressionContext {
  /** Current form row data */
  row: Record<string, unknown>;
  
  /** Parent form data (for nested forms) */
  parent?: Record<string, unknown>;
  
  /** Current user info */
  user: {
    id: number;
    role: UserRole;
    orgId: number;
  };
  
  /** Prelist/prefilled data */
  prelist: Record<string, unknown>;
  
  /** Lookup function for referencing other tables */
  lookup: (table: string, id: unknown) => unknown;
}

// Abstract interfaces - implementations in apps
export interface ApiClient {
  get<T>(url: string, params?: Record<string, unknown>): Promise<T>;
  post<T>(url: string, data?: Record<string, unknown>): Promise<T>;
  put<T>(url: string, data?: Record<string, unknown>): Promise<T>;
  delete<T>(url: string): Promise<T>;
}

export interface AppRouter {
  navigate(path: string, options?: Record<string, unknown>): void;
  back(): void;
  currentRoute: { path: string; params: Record<string, string> };
}

export interface DatabaseConnection {
  run(sql: string, params?: unknown[]): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  get<T>(sql: string, params?: unknown[]): Promise<T | undefined>;
}
