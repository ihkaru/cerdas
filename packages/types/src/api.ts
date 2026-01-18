/**
 * API Response Types
 */

export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: ApiMeta;
}

export interface ApiMeta {
  pagination?: Pagination;
}

export interface Pagination {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  from: number;
  to: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

/**
 * Request state for UI (Discriminated Union Pattern)
 */
export type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: ApiError };
