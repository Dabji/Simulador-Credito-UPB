// ============================================================
// Sequelize Model: ParameterAuditLogModel
// Registra cada cambio de parametrización hecho por un admin.
// Tabla: parameter_audit_logs (HU-25, RF-10, RF-23, RF-24)
// ============================================================

import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import { Database } from '../../config/database';

interface ParameterAuditLogAttributes {
  id: string;
  parameter_version_id: string;
  admin_user_id: string;
  admin_email: string;
  changed_at: Date;
  change_summary: string;
  previous_snapshot: string;
  new_snapshot: string;
}

type ParameterAuditLogCreationAttributes = Optional<
  ParameterAuditLogAttributes,
  'id' | 'changed_at'
>;

export class ParameterAuditLogModel
  extends Model<ParameterAuditLogAttributes, ParameterAuditLogCreationAttributes>
  implements ParameterAuditLogAttributes
{
  declare id: string;
  declare parameter_version_id: string;
  declare admin_user_id: string;
  declare admin_email: string;
  declare changed_at: Date;
  declare change_summary: string;
  declare previous_snapshot: string;
  declare new_snapshot: string;
}

const sequelize = Database.getInstance().getSequelize();

ParameterAuditLogModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    parameter_version_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    admin_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    admin_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    changed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    change_summary: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    previous_snapshot: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    new_snapshot: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'parameter_audit_logs',
    timestamps: false,
  },
);
