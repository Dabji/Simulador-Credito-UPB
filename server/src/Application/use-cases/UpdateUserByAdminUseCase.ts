// ============================================================
// Use Case: UpdateUserByAdminUseCase (HU-82)
// El admin actualiza campos permitidos del perfil de otro usuario.
// Role, password, email y createdAt NUNCA son editables.
// ============================================================

import type { IUserRepository } from '../../Core/repositories/IUserRepository';
import type { UpdateUserByAdminInput } from '../dtos/UpdateUserByAdminInput';
import type { AdminUserProfileOutput } from '../dtos/AdminUserProfileOutput';
import { ConflictError, NotFoundError } from '../../Core/errors';
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

    if (
      data.identificationNumber &&
      data.identificationNumber !== existing.identificationNumber
    ) {
      const conflict = await this.userRepo.findByIdentification(data.identificationNumber);
      if (conflict && conflict.id !== existing.id) {
        throw new ConflictError('Ya existe un usuario con ese número de documento.');
      }
    }

    if (data.email && data.email !== existing.email) {
      const emailConflict = await this.userRepo.findByEmail(data.email);
      if (emailConflict && emailConflict.id !== existing.id) {
        throw new ConflictError('Ya existe un usuario con ese correo electrónico.');
      }
    }

    const updated = User.reconstitute({
      id:                   existing.id,
      email:                data.email ?? existing.email,
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
