// ============================================================
// Use Case: RequestPasswordReset
// Genera un token de recuperación y lo guarda en BD.
// Como no hay servicio de correos, se imprime en consola.
// TODO: Abstraer acceso a persistencia de tokens e implementar
//       hashing del token (SHA-256) antes de guardar en BD por seguridad.
// ============================================================

import crypto from 'crypto';
import type { IUserRepository } from '../../Core/repositories/IUserRepository';
import { PasswordResetTokenModel } from '../../Infrastructure/persistence/models/PasswordResetTokenModel';
import type { ForgotPasswordInput } from '../dtos/ForgotPasswordInput';
import { logger } from '../../Infrastructure/logger';

const TOKEN_EXPIRY_HOURS = 1;

export class RequestPasswordResetUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ForgotPasswordInput): Promise<void> {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      // No revelar si el email existe o no (seguridad)
      // Pero para desarrollo, logueamos
      logger.warn('Intento de recuperación para email no registrado', { email: input.email });
      return;
    }

    // Generar token hex de 32 bytes (64 caracteres)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Invalidar tokens previos del mismo usuario
    await PasswordResetTokenModel.update(
      { used: true },
      { where: { user_id: user.id, used: false } },
    );

    // Guardar el nuevo token
    await PasswordResetTokenModel.create({
      id: crypto.randomUUID(),
      user_id: user.id,
      token,
      expires_at: expiresAt,
    });

    // Imprimir en consola solo en desarrollo (copiar y pegar para probar)
    if (process.env.NODE_ENV === 'development') {
      console.log('\n══════════════════════════════════════════════════════════');
      console.log('  🔑 TOKEN DE RECUPERACIÓN DE CONTRASEÑA');
      console.log(`  Email:   ${input.email}`);
      console.log(`  Token:   ${token}`);
      console.log(`  Expira:  ${expiresAt.toISOString()}`);
      console.log(`  URL:     http://localhost:5173/reset-password?token=${token}`);
      console.log('══════════════════════════════════════════════════════════\n');
    }

    logger.info('Token de recuperación generado', { email: input.email });
  }
}
