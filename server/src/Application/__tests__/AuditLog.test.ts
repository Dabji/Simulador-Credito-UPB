// ============================================================
// Unit Tests: Audit Log — HU-25
// Verifica que el registro de auditoría se crea correctamente
// al actualizar parámetros y que el endpoint GET /audit devuelve
// los datos en el formato esperado.
// ============================================================

// ── Mocks ────────────────────────────────────────────────────

const mockFindById = jest.fn();
const mockUpdateVersion = jest.fn();
const mockHasOverlap = jest.fn();
const mockAuditCreate = jest.fn();
const mockAuditFindAndCountAll = jest.fn();

jest.mock(
  '../../Infrastructure/persistence/repositories/SequelizeParameterVersionRepository',
  () => ({
    SequelizeParameterVersionRepository: jest.fn().mockImplementation(() => ({
      findById: mockFindById,
      updateVersion: mockUpdateVersion,
      hasOverlap: mockHasOverlap,
      findAll: jest.fn().mockResolvedValue([]),
      findActive: jest.fn().mockResolvedValue(null),
    })),
  }),
);

jest.mock('../../Infrastructure/persistence/models/AuditLogModel', () => ({
  AuditLogModel: {
    create: mockAuditCreate,
    findAndCountAll: mockAuditFindAndCountAll,
  },
}));

jest.mock('../../Infrastructure/config/database', () => ({
  Database: {
    getInstance: jest.fn().mockReturnValue({
      getSequelize: jest.fn().mockReturnValue({}),
    }),
  },
}));

import { Router } from 'express';

// Importar el router después de los mocks
// eslint-disable-next-line @typescript-eslint/no-require-imports
const adminRouter = require('../../Infrastructure/http/routes/adminRoutes').default as Router;

import express from 'express';
import request from 'supertest';

// ── App de prueba ─────────────────────────────────────────────

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());

  // Simular authGuard: inyectar req.user
  app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user: Record<string, unknown> }).user = {
      userId: 'test-admin-uuid',
      email: 'admin@upb.edu.co',
      role: 'ADMIN',
    };
    next();
  });

  app.use('/api/admin', adminRouter);
  return app;
}

// ── Fixtures ─────────────────────────────────────────────────

const FAKE_VERSION_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

const fakeVersion = {
  id: FAKE_VERSION_ID,
  validFrom: '2026-01-01',
  validTo: null,
  notes: 'Versión de prueba',
  interestRates: [{ levelScope: 'PREGRADO', rateMonthly: 0.009 }],
  modalityRules: [],
  initialPaymentRules: [],
};

// ── Tests ─────────────────────────────────────────────────────

describe('HU-25 — Audit Log', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Criterio 2: escritura del audit log al actualizar parámetros ──

  describe('PUT /api/admin/parameters/:id — crea registro de auditoría', () => {
    it('crea audit log con campos correctos al actualizar interestRates', async () => {
      mockFindById.mockResolvedValue(fakeVersion);
      mockHasOverlap.mockResolvedValue(false);
      mockUpdateVersion.mockResolvedValue({
        ...fakeVersion,
        interestRates: [{ levelScope: 'PREGRADO', rateMonthly: 0.01 }],
      });
      mockAuditCreate.mockResolvedValue({});

      const app = buildApp();
      const res = await request(app)
        .put(`/api/admin/parameters/${FAKE_VERSION_ID}`)
        .send({ interestRates: [{ levelScope: 'PREGRADO', rateMonthly: 0.01 }] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('registrado');

      expect(mockAuditCreate).toHaveBeenCalledTimes(1);
      const auditPayload = mockAuditCreate.mock.calls[0][0] as Record<string, unknown>;
      expect(auditPayload.action).toBe('UPDATE_PARAMETER_VERSION');
      expect(auditPayload.entity).toBe('PARAMETER_VERSION');
      expect(auditPayload.entity_id).toBe(FAKE_VERSION_ID);
      expect(auditPayload.actor_type).toBe('ADMIN');
      expect(auditPayload.user_id).toBe('test-admin-uuid');

      const details = JSON.parse(auditPayload.details as string) as {
        adminEmail: string;
        changeSummary: string;
        previousSnapshot: unknown;
        newSnapshot: unknown;
      };
      expect(details.adminEmail).toBe('admin@upb.edu.co');
      expect(details.changeSummary).toContain('interestRates');
      expect(details.previousSnapshot).toBeDefined();
      expect(details.newSnapshot).toBeDefined();
    });

    it('responde 200 aunque falle la inserción del audit log (no bloquea operación principal)', async () => {
      mockFindById.mockResolvedValue(fakeVersion);
      mockHasOverlap.mockResolvedValue(false);
      mockUpdateVersion.mockResolvedValue({ ...fakeVersion, notes: 'Nuevo nota' });
      mockAuditCreate.mockRejectedValue(new Error('DB connection lost'));

      const app = buildApp();
      const res = await request(app)
        .put(`/api/admin/parameters/${FAKE_VERSION_ID}`)
        .send({ notes: 'Nuevo nota' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('responde 404 si la versión no existe', async () => {
      mockFindById.mockResolvedValue(null);

      const app = buildApp();
      const res = await request(app)
        .put(`/api/admin/parameters/${FAKE_VERSION_ID}`)
        .send({ notes: 'Test' });

      expect(res.status).toBe(404);
      expect(mockAuditCreate).not.toHaveBeenCalled();
    });
  });

  // ── Criterio 3: consulta del historial de auditoría ──

  describe('GET /api/admin/parameters/audit — retorna historial', () => {
    const fakeLog = {
      id: 'log-uuid-1',
      action: 'UPDATE_PARAMETER_VERSION',
      entity: 'PARAMETER_VERSION',
      entity_id: FAKE_VERSION_ID,
      actor_type: 'ADMIN',
      user_id: 'test-admin-uuid',
      ip_address: '127.0.0.1',
      created_at: new Date('2026-03-01T10:00:00Z'),
      details: JSON.stringify({
        adminEmail: 'admin@upb.edu.co',
        changeSummary: 'Campos modificados: interestRates',
        previousSnapshot: { interestRates: [{ levelScope: 'PREGRADO', rateMonthly: 0.009 }] },
        newSnapshot:      { interestRates: [{ levelScope: 'PREGRADO', rateMonthly: 0.01  }] },
      }),
    };

    it('devuelve lista de logs con estructura correcta', async () => {
      mockAuditFindAndCountAll.mockResolvedValue({ rows: [fakeLog], count: 1 });

      const app = buildApp();
      const res = await request(app).get('/api/admin/parameters/audit');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.logs).toHaveLength(1);

      const log = res.body.data.logs[0] as Record<string, unknown>;
      expect(log.action).toBe('UPDATE_PARAMETER_VERSION');
      expect(log.parameterVersionId).toBe(FAKE_VERSION_ID);
      expect(log.changeSummary).toContain('interestRates');
      expect(log.previousSnapshot).toBeDefined();
      expect(log.newSnapshot).toBeDefined();
    });

    it('clampea limit negativo a 1', async () => {
      mockAuditFindAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      const app = buildApp();
      await request(app).get('/api/admin/parameters/audit?limit=-5');

      const call = mockAuditFindAndCountAll.mock.calls[0][0] as { limit: number };
      expect(call.limit).toBe(1);
    });

    it('clampea limit superior a 200', async () => {
      mockAuditFindAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      const app = buildApp();
      await request(app).get('/api/admin/parameters/audit?limit=999');

      const call = mockAuditFindAndCountAll.mock.calls[0][0] as { limit: number };
      expect(call.limit).toBe(200);
    });

    it('normaliza offset negativo a 0', async () => {
      mockAuditFindAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      const app = buildApp();
      await request(app).get('/api/admin/parameters/audit?offset=-10');

      const call = mockAuditFindAndCountAll.mock.calls[0][0] as { offset: number };
      expect(call.offset).toBe(0);
    });

    it('maneja details con JSON malformado sin lanzar excepción', async () => {
      const brokenLog = { ...fakeLog, details: 'INVALID_JSON' };
      mockAuditFindAndCountAll.mockResolvedValue({ rows: [brokenLog], count: 1 });

      const app = buildApp();
      const res = await request(app).get('/api/admin/parameters/audit');

      expect(res.status).toBe(200);
      const log = res.body.data.logs[0] as Record<string, unknown>;
      expect(log.changeSummary).toBe('Error al procesar detalles');
    });
  });
});
