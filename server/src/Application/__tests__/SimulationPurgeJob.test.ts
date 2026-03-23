// ============================================================
// Unit Tests: SimulationPurgeJob
// Verifica la purga automática de simulaciones vencidas,
// incluyendo batch-size, auditoría agregada y manejo de errores.
// ============================================================

// ── Mocks ────────────────────────────────────────────────────

const mockFindAll = jest.fn();
const mockSoftDelete = jest.fn();
const mockAuditLogFn = jest.fn().mockResolvedValue(undefined);

jest.mock(
  '../../Infrastructure/persistence/models/SimulationModel',
  () => ({
    SimulationModel: {
      findAll: mockFindAll,
      init: jest.fn(),
    },
  }),
);

jest.mock(
  '../../Infrastructure/persistence/repositories/SequelizeSimulationRepository',
  () => ({
    SequelizeSimulationRepository: jest.fn().mockImplementation(() => ({
      softDelete: mockSoftDelete,
    })),
  }),
);

jest.mock('../services/AuditService', () => ({
  auditLog: mockAuditLogFn,
}));

jest.mock('../../Infrastructure/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../Infrastructure/config/env', () => ({
  env: {
    RETENTION_DAYS: 90,
    PURGE_INTERVAL_HOURS: 24,
    PURGE_BATCH_SIZE: 500,
  },
}));

jest.mock('../../Infrastructure/config/database', () => ({
  Database: {
    getInstance: jest.fn().mockReturnValue({
      getSequelize: jest.fn().mockReturnValue({}),
    }),
  },
}));

import { purgeExpiredSimulations, startPurgeScheduler, stopPurgeScheduler } from '../../Infrastructure/scheduler/SimulationPurgeJob';
import { logger } from '../../Infrastructure/logger';

// ── Tests ─────────────────────────────────────────────────────

describe('SimulationPurgeJob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    stopPurgeScheduler();
  });

  // ── purgeExpiredSimulations ──

  describe('purgeExpiredSimulations()', () => {
    it('retorna 0 y hace debug log cuando no hay simulaciones expiradas', async () => {
      mockFindAll.mockResolvedValue([]);

      const result = await purgeExpiredSimulations();

      expect(result).toBe(0);
      expect(mockSoftDelete).not.toHaveBeenCalled();
      expect(mockAuditLogFn).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('no hay simulaciones'),
      );
    });

    it('purga simulaciones expiradas y retorna el conteo correcto', async () => {
      mockFindAll.mockResolvedValue([
        { id: 'sim-1' },
        { id: 'sim-2' },
        { id: 'sim-3' },
      ]);
      mockSoftDelete.mockResolvedValue(true);

      const result = await purgeExpiredSimulations();

      expect(result).toBe(3);
      expect(mockSoftDelete).toHaveBeenCalledTimes(3);
      expect(mockSoftDelete).toHaveBeenCalledWith('sim-1', null, 'PURGA_AUTOMATICA_RETENCION_90_DIAS');
      expect(mockSoftDelete).toHaveBeenCalledWith('sim-2', null, 'PURGA_AUTOMATICA_RETENCION_90_DIAS');
      expect(mockSoftDelete).toHaveBeenCalledWith('sim-3', null, 'PURGA_AUTOMATICA_RETENCION_90_DIAS');
    });

    it('cuenta solo las filas efectivamente eliminadas (softDelete true)', async () => {
      mockFindAll.mockResolvedValue([
        { id: 'sim-1' },
        { id: 'sim-2' },
      ]);
      mockSoftDelete
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false); // ya eliminada por race condition

      const result = await purgeExpiredSimulations();

      expect(result).toBe(1);
    });

    it('registra evento SIMULATION_PURGE_COMPLETED agregado con detalles de purga', async () => {
      mockFindAll.mockResolvedValue([{ id: 'sim-1' }]);
      mockSoftDelete.mockResolvedValue(true);

      await purgeExpiredSimulations();

      expect(mockAuditLogFn).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SIMULATION_PURGE_COMPLETED',
          entity: 'SIMULATION_PURGE',
          entity_id: 'PURGA_AUTOMATICA_RETENCION_90_DIAS',
          actor_type: 'SYSTEM',
          user_id: null,
          details: expect.objectContaining({
            reason:         'PURGA_AUTOMATICA_RETENCION_90_DIAS',
            threshold_days: 90,
            total_affected: 1,
            purged_at:      expect.any(String),
            simulation_ids: ['sim-1'],
          }),
        }),
      );
    });

    it('no registra auditoría agregada cuando no hay candidatos', async () => {
      mockFindAll.mockResolvedValue([]);

      await purgeExpiredSimulations();

      expect(mockAuditLogFn).not.toHaveBeenCalled();
    });

    it('respeta el límite de batch size en la consulta findAll', async () => {
      mockFindAll.mockResolvedValue([]);

      await purgeExpiredSimulations();

      const findAllCall = mockFindAll.mock.calls[0][0] as Record<string, unknown>;
      expect(findAllCall.limit).toBe(500);
    });

    it('retorna 0 y loguea error cuando findAll lanza excepción', async () => {
      mockFindAll.mockRejectedValue(new Error('DB connection lost'));

      const result = await purgeExpiredSimulations();

      expect(result).toBe(0);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error en purga automática'),
        expect.objectContaining({ error: 'DB connection lost' }),
      );
    });

    it('incluye purgeReason dinámico basado en RETENTION_DAYS', async () => {
      mockFindAll.mockResolvedValue([{ id: 'sim-x' }]);
      mockSoftDelete.mockResolvedValue(true);

      await purgeExpiredSimulations();

      expect(mockSoftDelete).toHaveBeenCalledWith(
        'sim-x',
        null,
        expect.stringContaining('90'),
      );
    });
  });

  // ── startPurgeScheduler / stopPurgeScheduler ──

  describe('startPurgeScheduler()', () => {
    it('loguea inicio con parámetros de configuración', () => {
      jest.useFakeTimers();

      startPurgeScheduler();

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('retención: 90 días'),
      );

      jest.useRealTimers();
    });

    it('no re-inicia si ya está corriendo', () => {
      jest.useFakeTimers();

      startPurgeScheduler();
      startPurgeScheduler();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('ya está corriendo'),
      );

      jest.useRealTimers();
    });

    it('stopPurgeScheduler detiene el scheduler', () => {
      jest.useFakeTimers();

      startPurgeScheduler();
      stopPurgeScheduler();

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('detenido'),
      );

      // Puede re-iniciar después de detenerse
      (logger.warn as jest.Mock).mockClear();
      startPurgeScheduler();
      expect(logger.warn).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });
});
