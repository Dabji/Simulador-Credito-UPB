// DTO: AdminUserProfileOutput (HU-82)
// Perfil completo de un usuario visto desde el admin (sin password).
// issue #187: actualizado para soportar 9 tipos de documento

import type { DocumentType } from '../../Core/entities/User';

export interface AdminUserProfileOutput {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
  readonly documentType: DocumentType;
  readonly identificationNumber: string;
  readonly email: string;
  readonly phone: string | undefined;
  readonly role: 'STUDENT' | 'ADMIN';
  readonly isActive: boolean;
  readonly createdAt: string; // ISO date string
}
