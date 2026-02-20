// ============================================================
// Repository Implementation: SequelizeUserRepository
// Implementa IUserRepository usando Sequelize + MySQL.
// ============================================================

import { User, UserRole } from '../../../Core/entities/User';
import type { IUserRepository } from '../../../Core/repositories/IUserRepository';
import { UserModel } from '../models/UserModel';

export class SequelizeUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const row = await UserModel.findByPk(id);
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await UserModel.findOne({ where: { email } });
    return row ? this.toDomain(row) : null;
  }

  async findByIdentification(identificationNumber: string): Promise<User | null> {
    const row = await UserModel.findOne({
      where: { identification_number: identificationNumber },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<User[]> {
    const rows = await UserModel.findAll();
    return rows.map((row) => this.toDomain(row));
  }

  async save(user: User): Promise<User> {
    const row = await UserModel.create({
      id: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      identification_number: user.identificationNumber,
      role: user.role,
      is_active: user.isActive,
    });
    return this.toDomain(row);
  }

  async update(user: User): Promise<User> {
    await UserModel.update(
      {
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        identification_number: user.identificationNumber,
        role: user.role,
        is_active: user.isActive,
      },
      { where: { id: user.id } },
    );
    const updated = await UserModel.findByPk(user.id);
    if (!updated) throw new Error(`Usuario no encontrado: ${user.id}`);
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await UserModel.destroy({ where: { id } });
  }

  // ── Mapper: ORM → Domain ───────────────────────────────────
  private toDomain(row: UserModel): User {
    return User.reconstitute({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      identificationNumber: row.identification_number,
      role: row.role as UserRole,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
