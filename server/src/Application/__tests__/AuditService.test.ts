// ============================================================
// Unit Tests: AuditService
// Verifica el helper centralizado de auditoría.
// ============================================================

const mockCreate = jest.fn();

jest.mock('../../Infrastructure/persistence/models/AuditLogModel', () => ({
  AuditLogModel: { create: mockCreate },
}));

jest.mock('../../Infrastructure/config/database', () => ({
  Database: {
    getInstance: jest.fn().mockReturnValue({
      getSequelize: jest.fn().mockReturnValue({}),
    }),
  },
}));

jest.mock('../../Infrastructure/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

import { auditLog, extractIp } from '../services/AuditService';

describe('AuditService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('auditLog()', () => {
    it('persiste un registro con todos los campos', async () => {
      mockCreate.mockResolvedValue({});

      await auditLog({
        action:     'LOGIN_SUCCESS',
        entity:     'SESSION',
        entity_id:  'user-123',
        actor_type: 'STUDENT',
        user_id:    'user-123',
        ip_address: '127.0.0.1',
        details:    { email: 'test@upb.edu.co' },
      });

      expect(mockCreate).toHaveBeenCalledTimes(1);
      const payload = mockCreate.mock.calls[0][0] as Record<string, unknown>;
      expect(payload.action).toBe('LOGIN_SUCCESS');
      expect(payload.entity).toBe('SESSION');
      expect(payload.entity_id).toBe('user-123');
      expect(payload.actor_type).toBe('STUDENT');
      expect(payload.user_id).toBe('user-123');
      expect(payload.ip_address).toBe('127.0.0.1');

      const details = JSON.parse(payload.details as string) as Record<string, unknown>;
      expect(details.email).toBe('test@upb.edu.co');
    });

    it('no lanza excepción si AuditLogModel.create falla', async () => {
      mockCreate.mockRejectedValue(new Error('DB down'));

      await expect(
        auditLog({
          action:     'LOGIN_FAILED',
          entity:     'SESSION',
          entity_id:  'N/A',
          actor_type: 'SYSTEM',
          details:    { reason: 'bad password' },
        }),
      ).resolves.toBeUndefined();
    });

    it('usa null por defecto para user_id e ip_address', async () => {
      mockCreate.mockResolvedValue({});

      await auditLog({
        action:     'TOKEN_MISSING',
        entity:     'SESSION',
        entity_id:  'N/A',
        actor_type: 'SYSTEM',
        details:    {},
      });

      const payload = mockCreate.mock.calls[0][0] as Record<string, unknown>;
      expect(payload.user_id).toBeNull();
      expect(payload.ip_address).toBeNull();
    });
  });

  describe('extractIp()', () => {
    it('devuelve req.ip si está disponible', () => {
      expect(extractIp({ ip: '10.0.0.1' })).toBe('10.0.0.1');
    });

    it('cae a socket.remoteAddress si ip es undefined', () => {
      expect(extractIp({ socket: { remoteAddress: '192.168.1.1' } })).toBe('192.168.1.1');
    });

    it('devuelve null si no hay IP disponible', () => {
      expect(extractIp({})).toBeNull();
    });
  });
});
