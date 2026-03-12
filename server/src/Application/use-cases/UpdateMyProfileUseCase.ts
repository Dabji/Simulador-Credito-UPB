// ============================================================
// Use Case: UpdateMyProfileUseCase (HU-81)
// Actualiza solo los campos permitidos del usuario autenticado.
// El userId SIEMPRE viene del JWT — nunca del body del request.
// ============================================================

import type { IUserRepository } from '../../Core/repositories/IUserRepository';
import type { UpdateMyProfileInput } from '../dtos/UpdateMyProfileInput';
import type { MyProfileOutput } from '../dtos/MyProfileOutput';
import { NotFoundError, UnauthorizedError } from '../../Core/errors';
import { User } from '../../Core/entities/User';
import type { DocumentType } from '../../Core/entities/User';

export class UpdateMyProfileUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string, data: UpdateMyProfileInput): Promise<MyProfileOutput> {
    if (!userId) throw new UnauthorizedError('Usuario no identificado.');

    const existing = await this.userRepo.findById(userId);
    if (!existing) throw new NotFoundError('Usuario');

    // Reconstruir con los campos permitidos actualizados (los demás se mantienen)
    const updated = User.reconstitute({
      id:                   existing.id,
      email:                existing.email,               // email NO se edita
      firstName:            data.firstName            ?? existing.firstName,
      lastName:             data.lastName             ?? existing.lastName,
      documentType:         (data.documentType as DocumentType | undefined) ?? existing.documentType,
      identificationNumber: data.identificationNumber ?? existing.identificationNumber,
      password:             existing.password,             // password NO se edita
      phone:                data.phone               ?? existing.phone,
      role:                 existing.role,                 // role NO se edita
      isActive:             existing.isActive,
      termsAcceptedAt:      existing.termsAcceptedAt,
      lastLoginAt:          existing.lastLoginAt,
      createdAt:            existing.createdAt,
      updatedAt:            new Date(),
    });

    const saved = await this.userRepo.update(updated);

    return {
      id:                   saved.id,
      email:                saved.email,
      firstName:            saved.firstName,
      lastName:             saved.lastName,
      documentType:         saved.documentType,
      identificationNumber: saved.identificationNumber,
      phone:                saved.phone,
      role:                 saved.role,
      createdAt:            saved.createdAt.toISOString(),
    };
  }
}
