// ============================================================
// Sequelize Model: ParameterVersionModel
// Mapeo ORM para la tabla 'parameter_versions'.
// Agrupa todos los parámetros institucionales de un semestre.
// ============================================================

import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import { Database } from '../../config/database';

interface ParameterVersionAttributes {
  id: string;
  valid_from: string;                // DATE "YYYY-MM-DD"
  valid_to: string | null;
  notes: string | null;
  installments_window_from: string;  // DATE
  installments_window_to: string;    // DATE
  payment_period_days: number;
  created_at: Date;
  created_by: string;                // FK → users.id (admin)
}

type ParameterVersionCreation = Optional<ParameterVersionAttributes, 'valid_to' | 'notes' | 'created_at'>;

export class ParameterVersionModel
  extends Model<ParameterVersionAttributes, ParameterVersionCreation>
  implements ParameterVersionAttributes
{
  declare id: string;
  declare valid_from: string;
  declare valid_to: string | null;
  declare notes: string | null;
  declare installments_window_from: string;
  declare installments_window_to: string;
  declare payment_period_days: number;
  declare created_at: Date;
  declare created_by: string;
}

const sequelize = Database.getInstance().getSequelize();

ParameterVersionModel.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    valid_from: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    valid_to: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    installments_window_from: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    installments_window_to: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    payment_period_days: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 30,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    created_by: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'parameter_versions',
    timestamps: false,
    indexes: [
      { fields: ['valid_from', 'valid_to'], name: 'idx_pv_validity' },
    ],
  },
);
