// ============================================================
// Sequelize Model: ModalityRuleModel
// Mapeo ORM para la tabla 'modality_rules'.
// Cuotas máximas y cuota inicial mínima por modalidad + nivel.
//
// @deprecated — Reemplazado por LevelConfigModel (level_configs).
// max_total_payments por modalidad → max_payments_sin_interes /
// max_payments_con_interes en level_configs.
// min_initial_pct → min_initial_pct en level_configs.
// Mantener hasta migrar ParameterVersionRepository.
// Ver: docs/database/migration_level_configs_redesign.sql
// ============================================================

import { DataTypes, Model } from 'sequelize';
import { Database } from '../../config/database';

interface ModalityRuleAttributes {
  id: string;
  modality: 'SIN_INTERES' | 'CON_INTERES';
  level: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech';
  max_total_payments: number;
  min_initial_pct: number;           // decimal(5,4) → e.g. 0.2000 = 20%
  parameter_version_id: string;
}

export class ModalityRuleModel
  extends Model<ModalityRuleAttributes>
  implements ModalityRuleAttributes
{
  declare id: string;
  declare modality: 'SIN_INTERES' | 'CON_INTERES';
  declare level: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech';
  declare max_total_payments: number;
  declare min_initial_pct: number;
  declare parameter_version_id: string;
}

const sequelize = Database.getInstance().getSequelize();

ModalityRuleModel.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    modality: {
      type: DataTypes.ENUM('SIN_INTERES', 'CON_INTERES'),
      allowNull: false,
    },
    level: {
      type: DataTypes.ENUM('PREGRADO', 'POSGRADO', 'UPB_Tech'),
      allowNull: false,
    },
    max_total_payments: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
    },
    min_initial_pct: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
    },
    parameter_version_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'modality_rules',
    timestamps: false,
  },
);
