// ============================================================
// Sequelize Model: SimulationModel
// Mapeo ORM para la tabla 'simulations'.
// Fotografía completa de una simulación guardada por el estudiante.
// ============================================================

import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import { Database } from '../../config/database';

interface SimulationAttributes {
  id: string;
  created_at: Date;
  saved_at: Date;
  deleted_at: Date | null;
  deleted_by: string | null;
  delete_reason: string | null;
  student_type: 'NUEVO' | 'CONTINUO';
  level: 'PREGRADO' | 'POSGRADO' | 'UPB_TEC';
  modality: 'SIN_INTERES' | 'CON_INTERES';
  tuition_gross: number;              // bigint unsigned
  scholar_pct: number;                // decimal(5,4)
  tuition_net: number;
  initial_payment_pct: number;        // decimal(5,4)
  initial_payment_value: number;
  total_payments: number;
  first_payment_date: string;         // DATE "YYYY-MM-DD"
  financed_value: number;
  periodic_payment_value: number;
  total_interest: number;
  total_paid: number;
  applied_rate_monthly: number;       // decimal(8,6)
  student_observation: string | null;
  user_id: string;
  parameter_version_id: string;
}

type SimulationCreation = Optional<
  SimulationAttributes,
  'created_at' | 'saved_at' | 'deleted_at' | 'deleted_by' | 'delete_reason' | 'student_observation'
>;

export class SimulationModel
  extends Model<SimulationAttributes, SimulationCreation>
  implements SimulationAttributes
{
  declare id: string;
  declare created_at: Date;
  declare saved_at: Date;
  declare deleted_at: Date | null;
  declare deleted_by: string | null;
  declare delete_reason: string | null;
  declare student_type: 'NUEVO' | 'CONTINUO';
  declare level: 'PREGRADO' | 'POSGRADO' | 'UPB_TEC';
  declare modality: 'SIN_INTERES' | 'CON_INTERES';
  declare tuition_gross: number;
  declare scholar_pct: number;
  declare tuition_net: number;
  declare initial_payment_pct: number;
  declare initial_payment_value: number;
  declare total_payments: number;
  declare first_payment_date: string;
  declare financed_value: number;
  declare periodic_payment_value: number;
  declare total_interest: number;
  declare total_paid: number;
  declare applied_rate_monthly: number;
  declare student_observation: string | null;
  declare user_id: string;
  declare parameter_version_id: string;
}

const sequelize = Database.getInstance().getSequelize();

SimulationModel.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    saved_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_by: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    delete_reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    student_type: {
      type: DataTypes.ENUM('NUEVO', 'CONTINUO'),
      allowNull: false,
    },
    level: {
      type: DataTypes.ENUM('PREGRADO', 'POSGRADO', 'UPB_TEC'),
      allowNull: false,
    },
    modality: {
      type: DataTypes.ENUM('SIN_INTERES', 'CON_INTERES'),
      allowNull: false,
    },
    tuition_gross: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    scholar_pct: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0,
    },
    tuition_net: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    initial_payment_pct: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
    },
    initial_payment_value: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    total_payments: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
    },
    first_payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    financed_value: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    periodic_payment_value: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    total_interest: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    total_paid: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    applied_rate_monthly: {
      type: DataTypes.DECIMAL(8, 6),
      allowNull: false,
      defaultValue: 0,
    },
    student_observation: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    parameter_version_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'simulations',
    timestamps: false,
  },
);
