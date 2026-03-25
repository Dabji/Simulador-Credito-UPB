// ============================================================
// Sequelize Model: LevelConfigModel
// HU-PV-01: Configuración por nivel académico.
// Almacena estado activo/inactivo, vigencia y tasa de interés
// por número total de pagos para cada nivel educativo.
// ============================================================

import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import { Database } from '../../config/database';

interface LevelConfigAttributes {
  id: string;
  level_scope: 'PREGRADO' | 'POSGRADO' | 'UPB_TEC';
  is_active: boolean;
  valid_from: string;             // DATEONLY "YYYY-MM-DD"
  payment_count: number;          // 1-6: total de pagos
  rate_monthly: number;           // decimal(8,6) — tasa mensual para ese payment_count
  parameter_version_id: string;
}

type LevelConfigCreation = Optional<LevelConfigAttributes, 'id'>;

export class LevelConfigModel
  extends Model<LevelConfigAttributes, LevelConfigCreation>
  implements LevelConfigAttributes
{
  declare id: string;
  declare level_scope: 'PREGRADO' | 'POSGRADO' | 'UPB_TEC';
  declare is_active: boolean;
  declare valid_from: string;
  declare payment_count: number;
  declare rate_monthly: number;
  declare parameter_version_id: string;
}

const sequelize = Database.getInstance().getSequelize();

LevelConfigModel.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    level_scope: {
      type: DataTypes.ENUM('PREGRADO', 'POSGRADO', 'UPB_TEC'),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    valid_from: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    payment_count: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
    },
    rate_monthly: {
      type: DataTypes.DECIMAL(8, 6),
      allowNull: false,
      defaultValue: 0,
    },
    parameter_version_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'level_configs',
    timestamps: false,
  },
);
