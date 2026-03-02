// ============================================================
// Use Case: RequestPasswordReset
// Genera un token de recuperación, lo hashea (SHA-256) y guarda
// el hash en BD. El token plano se imprime en consola (dev).
// ============================================================

import crypto from 'crypto';
import type { IUserRepository } from '../../Core/repositories/IUserRepository';
import { PasswordResetTokenModel } from '../../Infrastructure/persistence/models/PasswordResetTokenModel';
import type { ForgotPasswordInput } from '../dtos/ForgotPasswordInput';
import { logger, logDev } from '../../Infrastructure/logger';

const TOKEN_EXPIRY_HOURS = 1;

export interface PasswordResetContext {
  readonly ip?: string;
  readonly userAgent?: string;
}

export class RequestPasswordResetUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ForgotPasswordInput, context?: PasswordResetContext): Promise<void> {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      // No revelar si el email existe o no (seguridad)
      logger.warn('Intento de recuperación para email no registrado', { email: input.email });
      return;
    }

    // Generar token plano (64 hex chars) y hashearlo con SHA-256
    const tokenPlain = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenPlain).digest('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Invalidar tokens previos del mismo usuario (marcar como usados)
    await PasswordResetTokenModel.update(
      { used_at: new Date() },
      { where: { user_id: user.id, used_at: null } },
    );

    // Guardar el HASH del token (nunca el token plano)
    await PasswordResetTokenModel.create({
      id: crypto.randomUUID(),
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      requested_ip: context?.ip ?? null,
      user_agent: context?.userAgent ?? null,
    });

    // Imprimir token plano en la consola de desarrollo.
    // Usa logDev() (Winston Console sin redacción) porque ts-node-dev
    // NO muestra la salida de console.log / process.stderr.write,
    // pero SÍ muestra la salida de los transports de Winston.
    logDev(
      '',
      '══════════════════════════════════════════════════════════',
      '  🔑 TOKEN DE RECUPERACIÓN DE CONTRASEÑA',
      `  Email:   ${input.email}`,
      `  Token:   ${tokenPlain}`,
      `  Expira:  ${expiresAt.toISOString()}`,
      `  URL:     http://localhost:5173/reset-password?token=${tokenPlain}`,
      '══════════════════════════════════════════════════════════',
      '',
    );

    logger.info('Reset-token generado correctamente', { email: input.email });
  }
}
