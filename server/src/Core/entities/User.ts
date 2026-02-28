// ============================================================
// Entity: User (Domain Layer)
// Representa un usuario del sistema (estudiante o admin).
// Esta entidad es pura y no depende de ningún framework.
// ============================================================

export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
}

export type DocumentType = 'CC' | 'TI';

export interface UserProps {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  documentType?: DocumentType;
  identificationNumber: string;
  password?: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  termsAcceptedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private readonly props: UserProps;

  private constructor(props: UserProps) {
    this.props = Object.freeze({ ...props });
  }

  // ── Factory Method ──────────────────────────────────────────
  static create(props: Omit<UserProps, 'createdAt' | 'updatedAt'>): User {
    const now = new Date();
    return new User({
      ...props,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  // ── Getters (Inmutabilidad) ─────────────────────────────────
  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get documentType(): DocumentType | undefined {
    return this.props.documentType;
  }

  get identificationNumber(): string {
    return this.props.identificationNumber;
  }

  get password(): string | undefined {
    return this.props.password;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get termsAcceptedAt(): Date | null | undefined {
    return this.props.termsAcceptedAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ── Domain Logic ────────────────────────────────────────────
  isAdmin(): boolean {
    return this.props.role === UserRole.ADMIN;
  }

  isStudent(): boolean {
    return this.props.role === UserRole.STUDENT;
  }

  toJSON(): UserProps {
    return { ...this.props };
  }
}
