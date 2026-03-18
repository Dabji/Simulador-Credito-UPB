// DTO: AdminUserProfileOutput (HU-82)
// Perfil completo de un usuario visto desde el admin (sin password).

export interface AdminUserProfileOutput {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
  readonly documentType: 'CC' | 'TI' | undefined;
  readonly identificationNumber: string;
  readonly email: string;
  readonly phone: string | undefined;
  readonly role: 'STUDENT' | 'ADMIN';
  readonly isActive: boolean;
  readonly createdAt: string; // ISO date string
}
