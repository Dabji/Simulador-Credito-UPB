// DTO: AdminUserListItemOutput (HU-82)
// Ítem de usuario en el listado administrativo (sin password).
// issue #187: actualizado para soportar 9 tipos de documento

import type { DocumentType } from '../../Core/entities/User';

export interface AdminUserListItemOutput {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
  readonly documentType: DocumentType | undefined;
  readonly identificationNumber: string;
  readonly email: string;
  readonly phone: string | undefined;
  readonly role: 'STUDENT' | 'ADMIN';
  readonly createdAt: string; // ISO date string
}
