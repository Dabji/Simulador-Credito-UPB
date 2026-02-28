// ============================================================
// Use Case: ResetPassword
// Valida el token, hashea la nueva contraseña y actualiza el user.
// ============================================================

import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import type { IUserRepository } from '../../Core/repositories/IUserRepository';
import { BadRequestError } from '../../Core/errors';
import { PasswordResetTokenModel } from '../../Infrastructure/persistence/models/PasswordResetTokenModel';
import type { ResetPasswordInput } from '../dtos/ResetPasswordInput';
import { logger } from '../../Infrastructure/logger';

const SALT_ROUNDS = 10;

export class ResetPasswordUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    // 1. Buscar token válido (no usado, no expirado)
    const tokenRecord = await PasswordResetTokenModel.findOne({
      where: {
        token: input.token,
        used: false,
        expires_at: { [Op.gt]: new Date() },
      },
    });

    if (!tokenRecord) {
      throw new BadRequestError('El enlace de recuperación es inválido o ha expirado');
    }

    // 2. Buscar el usuario asociado
    const user = await this.userRepository.findById(tokenRecord.user_id);
    if (!user) {
      throw new BadRequestError('Usuario no encontrado');
    }

    // 3. Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    // 4. Actualizar la contraseña del usuario via Sequelize directo
    //    (el repositorio no tiene updatePassword, usamos el model)
    const { UserModel } = await import('../../Infrastructure/persistence/models/UserModel');
    await UserModel.update(
      { password: hashedPassword },
      { where: { id: user.id } },
    );

    // 5. Marcar el token como usado
    await PasswordResetTokenModel.update(
      { used: true },
      { where: { id: tokenRecord.id } },
    );

    logger.info('Contraseña actualizada exitosamente', { userId: user.id });
  }
}
