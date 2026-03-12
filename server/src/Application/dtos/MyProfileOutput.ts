// DTO: MyProfileOutput (HU-81)
// Datos del perfil devueltos al frontend (sin password).

export interface MyProfileOutput {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly documentType: 'CC' | 'TI' | undefined;
  readonly identificationNumber: string;
  readonly phone: string | undefined;
  readonly role: 'STUDENT' | 'ADMIN';
  readonly createdAt: string; // ISO date string
}
