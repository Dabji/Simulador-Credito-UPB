// ============================================================
// Unit Tests: PasswordResetTokenPurgeJob
// Verifica la purga automática de password_reset_tokens,
// incluyendo loop por lotes, flag anti-solapamiento,
// manejo de errores y start/stop del scheduler.
// ============================================================

// ── Mocks ────────────────────────────────────────────────────

const mockQuery = jest.fn();

jest.mock('../../Infrastructure/config/database', () => ({
  Database: {
    getInstance: jest.fn().mockReturnValue({
      getSequelize: jest.fn().mockReturnValue({
        query: mockQuery,
      }),
    }),
  },
}));

jest.mock('../../Infrastructure/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../Infrastructure/config/env', () => ({
  env: {
    TOKEN_PURGE_RETENTION_DAYS: 30,
    TOKEN_PURGE_INTERVAL_HOURS: 24,
    TOKEN_PURGE_BATCH_SIZE: 1000,
  },
}));

import {
  purgeExpiredTokens,
  startTokenPurgeScheduler,
  stopTokenPurgeScheduler,
} from '../../Infrastructure/scheduler/PasswordResetTokenPurgeJob';
import { logger } from '../../Infrastructure/logger';

// ── Tests ─────────────────────────────────────────────────────

describe('PasswordResetTokenPurgeJob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    stopTokenPurgeScheduler();
  });

  // ── purgeExpiredTokens ──

  describe('purgeExpiredTokens()', () => {
    it('retorna 0 y hace debug log cuando no hay tokens expirados', async () => {
      mockQuery.mockResolvedValue([[], { affectedRows: 0 }]);

      const result = await purgeExpiredTokens();

      expect(result).toBe(0);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('no hay tokens expirados'),
      );
    });

    it('elimina tokens en un solo lote cuando hay menos que batchSize', async () => {
      mockQuery.mockResolvedValue([[], { affectedRows: 43 }]);

      const result = await purgeExpiredTokens();

      expect(result).toBe(43);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('43 token(s) eliminado(s)'),
        expect.objectContaining({ batch: 1, deleted: 43 }),
      );
    });

    it('ejecuta múltiples lotes hasta agotar candidatos', async () => {
      mockQuery
        .mockResolvedValueOnce([[], { affectedRows: 1000 }])
        .mockResolvedValueOnce([[], { affectedRows: 1000 }])
        .mockResolvedValueOnce([[], { affectedRows: 200 }]);

      const result = await purgeExpiredTokens();

      expect(result).toBe(2200);
      expect(mockQuery).toHaveBeenCalledTimes(3);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('2200 token(s) eliminado(s) en 3 lote(s)'),
        expect.objectContaining({ totalDeleted: 2200, batches: 3 }),
      );
    });

    it('soporta meta como número directo', async () => {
      mockQuery.mockResolvedValue([[], 15]);

      const result = await purgeExpiredTokens();

      expect(result).toBe(15);
    });

    it('retorna 0 y loguea error cuando query lanza excepción', async () => {
      mockQuery.mockRejectedValue(new Error('DB connection lost'));

      const result = await purgeExpiredTokens();

      expect(result).toBe(0);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error en purga automática'),
        expect.objectContaining({ error: 'DB connection lost' }),
      );
    });

    it('omite ejecución si ya hay una en curso (flag isRunning)', async () => {
      // Simular una ejecución lenta que nunca resuelve mientras intentamos otra
      let resolveFirst!: (v: unknown) => void;
      const slowPromise = new Promise((resolve) => { resolveFirst = resolve; });
      mockQuery.mockReturnValueOnce(slowPromise);

      const first = purgeExpiredTokens();
      const second = await purgeExpiredTokens();

      expect(second).toBe(0);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('ejecución anterior aún en curso'),
      );

      // Resolver la primera para limpiar el flag
      resolveFirst([[], { affectedRows: 0 }]);
      await first;
    });
  });

  // ── startTokenPurgeScheduler / stopTokenPurgeScheduler ──

  describe('startTokenPurgeScheduler()', () => {
    it('loguea inicio con parámetros de configuración', () => {
      jest.useFakeTimers();

      startTokenPurgeScheduler();

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('retención: 30 días'),
      );

      jest.useRealTimers();
    });

    it('no re-inicia si ya está corriendo', () => {
      jest.useFakeTimers();

      startTokenPurgeScheduler();
      startTokenPurgeScheduler();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('ya está corriendo'),
      );

      jest.useRealTimers();
    });

    it('stopTokenPurgeScheduler detiene el scheduler', () => {
      jest.useFakeTimers();

      startTokenPurgeScheduler();
      stopTokenPurgeScheduler();

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('detenido'),
      );

      // Puede re-iniciar después de detenerse
      (logger.warn as jest.Mock).mockClear();
      startTokenPurgeScheduler();
      expect(logger.warn).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });
});
