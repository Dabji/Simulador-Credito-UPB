// ============================================================
// Use Case: GetEmailHint (HU-PV-04)
// Busca un usuario por número de identificación y retorna
// una versión enmascarada del correo asociado.
// ============================================================

import type { IUserRepository } from '../../Core/repositories/IUserRepository';
import { NotFoundError } from '../../Core/errors';
import { logger } from '../../Infrastructure/logger';

export interface GetEmailHintInput {
  readonly identificationNumber: string;
}

export interface GetEmailHintOutput {
  readonly maskedEmail: string;
  readonly userId: string;
}

/**
 * Aplica la regla de enmascaramiento al correo:
 * - Muestra los 2 primeros caracteres del nombre de usuario
 * - Oculta el resto del nombre con 5 asteriscos fijos
 * - Muestra el dominio completo
 *
 * Ejemplo: "johndoe@gmail.com" → "jo*****@gmail.com"
 */
export function maskEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex < 0) return '*****@*****';

  const localPart = email.slice(0, atIndex);
  const domain    = email.slice(atIndex);

  const visible = localPart.slice(0, 2);
  return `${visible}*****${domain}`;
}

export class GetEmailHintUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: GetEmailHintInput): Promise<GetEmailHintOutput> {
    const user = await this.userRepository.findByIdentification(
      input.identificationNumber,
    );

    if (!user) {
      logger.warn('Intento de recuperación por identificación no registrada', {
        identificationNumber: input.identificationNumber,
      });
      throw new NotFoundError('Cuenta');
    }

    const maskedEmail = maskEmail(user.email);

    logger.info('Pista de correo generada por identificación', {
      userId: user.id,
    });

    return { maskedEmail, userId: user.id };
  }
}
