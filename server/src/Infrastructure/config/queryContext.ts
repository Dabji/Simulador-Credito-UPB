// ============================================================
// Query Context — AsyncLocalStorage
// Almacena un contador de queries por request HTTP.
// Cada request tiene su propio contexto aislado gracias a ALS.
// Solo activo en desarrollo (NODE_ENV === 'development').
// ============================================================

import { AsyncLocalStorage } from 'async_hooks';

export interface QueryContext {
  count: number;
  method: string;
  path: string;
  startMs: number;
}

export const queryContext = new AsyncLocalStorage<QueryContext>();
