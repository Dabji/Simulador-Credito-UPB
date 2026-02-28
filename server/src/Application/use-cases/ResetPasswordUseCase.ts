// ============================================================
// Use Case: ResetPassword
// Valida el token, hashea la nueva contraseña y actualiza el user.
// TODO: Inyectar IPasswordResetTokenRepository para evitar el
//       acoplamiento con Sequelize y cumplir con Clean Architecture.
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

    // 4. Consumir el token y actualizar la contraseña de forma atómica
    const sequelize = PasswordResetTokenModel.sequelize;
    if (!sequelize) {
      throw new Error('Sequelize instance is not initialized for PasswordResetTokenModel');
    }

    await sequelize.transaction(async (transaction) => {
      // 4.1 Marcar el token como usado de forma condicional
      const [affectedRows] = await PasswordResetTokenModel.update(
        { used: true },
        {
          where: { id: tokenRecord.id, used: false },
          transaction,
        },
      );

      // Si no se afectó exactamente 1 fila, el token ya fue usado o es inválido
      if (affectedRows !== 1) {
        throw new BadRequestError('El enlace de recuperación es inválido o ha expirado');
      }

      // 4.2 Actualizar la contraseña del usuario
      const { UserModel } = await import('../../Infrastructure/persistence/models/UserModel');
      await UserModel.update(
        { password: hashedPassword },
        { where: { id: user.id }, transaction },
      );
    });

    logger.info('Contraseña actualizada exitosamente', { userId: user.id });
  }
}
