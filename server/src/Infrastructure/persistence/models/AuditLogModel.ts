// ============================================================
// Sequelize Model: AuditLogModel
// Tabla general de auditoría para cualquier entidad del sistema.
// Tabla: audit_logs (HU-25, RF-10, RF-23, RF-24)
// ============================================================

import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import { Database } from '../../config/database';

interface AuditLogAttributes {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  actor_type: 'ADMIN' | 'STUDENT' | 'SYSTEM';
  user_id: string | null;
  ip_address: string | null;
  details: string;
  created_at: Date;
}

type AuditLogCreationAttributes = Optional<
  AuditLogAttributes,
  'id' | 'user_id' | 'ip_address' | 'created_at'
>;

export class AuditLogModel
  extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes
{
  declare id: string;
  declare action: string;
  declare entity: string;
  declare entity_id: string;
  declare actor_type: 'ADMIN' | 'STUDENT' | 'SYSTEM';
  declare user_id: string | null;
  declare ip_address: string | null;
  declare details: string;
  declare created_at: Date;
}

const sequelize = Database.getInstance().getSequelize();

AuditLogModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    entity: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    entity_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    actor_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'ADMIN',
      validate: {
        isIn: [['ADMIN', 'STUDENT', 'SYSTEM']],
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    details: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    timestamps: false,
  },
);
