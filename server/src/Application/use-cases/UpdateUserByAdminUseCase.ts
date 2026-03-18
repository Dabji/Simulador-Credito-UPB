// ============================================================
// Use Case: UpdateUserByAdminUseCase (HU-82)
// El admin actualiza campos permitidos del perfil de otro usuario.
// Role, password, email y createdAt NUNCA son editables.
// ============================================================

import type { IUserRepository } from '../../Core/repositories/IUserRepository';
import type { UpdateUserByAdminInput } from '../dtos/UpdateUserByAdminInput';
import type { AdminUserProfileOutput } from '../dtos/AdminUserProfileOutput';
import { NotFoundError } from '../../Core/errors';
import { User } from '../../Core/entities/User';
import type { DocumentType } from '../../Core/entities/User';

export class UpdateUserByAdminUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(
    targetUserId: string,
    data: UpdateUserByAdminInput,
  ): Promise<AdminUserProfileOutput> {
    const existing = await this.userRepo.findById(targetUserId);
    if (!existing) throw new NotFoundError('Usuario');

    const updated = User.reconstitute({
      id:                   existing.id,
      email:                existing.email,               // email NO editable
      firstName:            data.firstName            ?? existing.firstName,
      lastName:             data.lastName             ?? existing.lastName,
      documentType:         (data.documentType as DocumentType | undefined) ?? existing.documentType,
      identificationNumber: data.identificationNumber ?? existing.identificationNumber,
      password:             existing.password,             // password NO editable
      phone:                data.phone               ?? existing.phone,
      role:                 existing.role,                 // role NO editable
      isActive:             existing.isActive,
      termsAcceptedAt:      existing.termsAcceptedAt,
      lastLoginAt:          existing.lastLoginAt,
      createdAt:            existing.createdAt,
      updatedAt:            new Date(),
    });

    const saved = await this.userRepo.update(updated);

    return {
      id:                   saved.id,
      firstName:            saved.firstName,
      lastName:             saved.lastName,
      fullName:             saved.fullName,
      documentType:         saved.documentType,
      identificationNumber: saved.identificationNumber,
      email:                saved.email,
      phone:                saved.phone,
      role:                 saved.role,
      isActive:             saved.isActive,
      createdAt:            saved.createdAt.toISOString(),
    };
  }
}
