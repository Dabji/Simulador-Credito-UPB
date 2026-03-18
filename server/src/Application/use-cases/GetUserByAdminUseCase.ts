// ============================================================
// Use Case: GetUserByAdminUseCase (HU-82)
// Retorna el perfil completo de un usuario por ID.
// Solo accesible por ADMIN. Nunca expone password/hash.
// ============================================================

import type { IUserRepository } from '../../Core/repositories/IUserRepository';
import type { AdminUserProfileOutput } from '../dtos/AdminUserProfileOutput';
import { NotFoundError } from '../../Core/errors';

export class GetUserByAdminUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(targetUserId: string): Promise<AdminUserProfileOutput> {
    const user = await this.userRepo.findById(targetUserId);
    if (!user) throw new NotFoundError('Usuario');

    return {
      id:                   user.id,
      firstName:            user.firstName,
      lastName:             user.lastName,
      fullName:             user.fullName,
      documentType:         user.documentType,
      identificationNumber: user.identificationNumber,
      email:                user.email,
      phone:                user.phone,
      role:                 user.role,
      isActive:             user.isActive,
      createdAt:            user.createdAt.toISOString(),
    };
  }
}
