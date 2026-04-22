// DTO: MyProfileOutput (HU-81)
// Datos del perfil devueltos al frontend (sin password).
// issue #187: actualizado para soportar 9 tipos de documento

import type { DocumentType } from '../../Core/entities/User';

export interface MyProfileOutput {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly documentType: DocumentType | undefined;
  readonly identificationNumber: string;
  readonly phone: string | undefined;
  readonly role: 'STUDENT' | 'ADMIN';
  readonly createdAt: string; // ISO date string
}
