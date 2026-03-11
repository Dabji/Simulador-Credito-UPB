// ============================================================
// Use Case: GetMyProfileUseCase (HU-81)
// Retorna el perfil del usuario autenticado (sin contraseña).
// ============================================================

import type { IUserRepository } from '../../Core/repositories/IUserRepository';
import type { MyProfileOutput } from '../dtos/MyProfileOutput';
import { NotFoundError, UnauthorizedError } from '../../Core/errors';

export class GetMyProfileUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string): Promise<MyProfileOutput> {
    if (!userId) throw new UnauthorizedError('Usuario no identificado.');

    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError('Usuario');

    return {
      id:                   user.id,
      email:                user.email,
      firstName:            user.firstName,
      lastName:             user.lastName,
      documentType:         user.documentType,
      identificationNumber: user.identificationNumber,
      phone:                user.phone,
      role:                 user.role,
      createdAt:            user.createdAt.toISOString(),
    };
  }
}
