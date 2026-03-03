// ============================================================
// Repository Pattern: IUserRepository
// Contrato que debe cumplir cualquier implementación de
// persistencia de usuarios (MySQL, MongoDB, en memoria, etc.)
// ============================================================

import { User } from '../entities/User';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByIdentification(identificationNumber: string): Promise<User | null>;
  findByDocument(documentNumber: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
  updateLastLogin(userId: string): Promise<void>;
  delete(id: string): Promise<void>;
}
