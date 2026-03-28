// ============================================================
// Unit Tests: GetEmailHintUseCase (HU-PV-04)
// Cubre maskEmail y GetEmailHintUseCase.execute().
// ============================================================

jest.mock('../../Infrastructure/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

import { maskEmail, GetEmailHintUseCase } from '../use-cases/GetEmailHintUseCase';
import { NotFoundError } from '../../Core/errors';
import type { IUserRepository } from '../../Core/repositories/IUserRepository';
import type { User } from '../../Core/entities/User';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<{ id: string; email: string }> = {}): User {
  return {
    id:                   overrides.id    ?? 'user-uuid-1',
    email:                overrides.email ?? 'johndoe@gmail.com',
    firstName:            'John',
    lastName:             'Doe',
    identificationNumber: '1234567890',
    role:                 'STUDENT',
    isActive:             true,
    createdAt:            new Date(),
    updatedAt:            new Date(),
  } as unknown as User;
}

function makeRepo(user: User | null): jest.Mocked<Pick<IUserRepository, 'findByIdentification'>> {
  return {
    findByIdentification: jest.fn().mockResolvedValue(user),
  };
}

// ── maskEmail ─────────────────────────────────────────────────────────────────

describe('maskEmail()', () => {
  it('caso estándar: muestra 2 chars + ***** + dominio', () => {
    expect(maskEmail('johndoe@gmail.com')).toBe('jo*****@gmail.com');
  });

  it('caso borde nombre corto (1 char): muestra 1 char + *****', () => {
    expect(maskEmail('a@upb.edu.co')).toBe('a*****@upb.edu.co');
  });

  it('caso con exactamente 2 chars en nombre local', () => {
    expect(maskEmail('jo@correo.co')).toBe('jo*****@correo.co');
  });

  it('preserva el dominio completo con subdominios', () => {
    expect(maskEmail('estudiante@mail.upb.edu.co')).toBe('es*****@mail.upb.edu.co');
  });

  it('correo inválido sin @ retorna fallback seguro', () => {
    expect(maskEmail('correo-invalido')).toBe('*****@*****');
  });
});

// ── GetEmailHintUseCase ───────────────────────────────────────────────────────

describe('GetEmailHintUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('execute() — usuario encontrado', () => {
    it('retorna maskedEmail y userId cuando el usuario existe', async () => {
      const user = makeUser({ id: 'user-uuid-42', email: 'johndoe@gmail.com' });
      const repo = makeRepo(user);
      const useCase = new GetEmailHintUseCase(repo as unknown as IUserRepository);

      const result = await useCase.execute({ identificationNumber: '1234567890' });

      expect(result.maskedEmail).toBe('jo*****@gmail.com');
      expect(result.userId).toBe('user-uuid-42');
    });

    it('llama al repositorio con el número de identificación correcto', async () => {
      const user = makeUser();
      const repo = makeRepo(user);
      const useCase = new GetEmailHintUseCase(repo as unknown as IUserRepository);

      await useCase.execute({ identificationNumber: '9876543210' });

      expect(repo.findByIdentification).toHaveBeenCalledTimes(1);
      expect(repo.findByIdentification).toHaveBeenCalledWith('9876543210');
    });

    it('aplica enmascaramiento correctamente para correos con nombre corto', async () => {
      const user = makeUser({ email: 'x@upb.edu.co' });
      const repo = makeRepo(user);
      const useCase = new GetEmailHintUseCase(repo as unknown as IUserRepository);

      const result = await useCase.execute({ identificationNumber: '12345' });

      expect(result.maskedEmail).toBe('x*****@upb.edu.co');
    });
  });

  describe('execute() — usuario no encontrado', () => {
    it('lanza NotFoundError cuando no existe cuenta asociada', async () => {
      const repo = makeRepo(null);
      const useCase = new GetEmailHintUseCase(repo as unknown as IUserRepository);

      await expect(
        useCase.execute({ identificationNumber: '0000000000' }),
      ).rejects.toThrow(NotFoundError);
    });

    it('el mensaje del NotFoundError incluye "Cuenta"', async () => {
      const repo = makeRepo(null);
      const useCase = new GetEmailHintUseCase(repo as unknown as IUserRepository);

      await expect(
        useCase.execute({ identificationNumber: '0000000000' }),
      ).rejects.toThrow('Cuenta no encontrado');
    });

    it('llama al repositorio incluso cuando el usuario no existe', async () => {
      const repo = makeRepo(null);
      const useCase = new GetEmailHintUseCase(repo as unknown as IUserRepository);

      await expect(
        useCase.execute({ identificationNumber: '1111111111' }),
      ).rejects.toThrow(NotFoundError);

      expect(repo.findByIdentification).toHaveBeenCalledWith('1111111111');
    });
  });
});
