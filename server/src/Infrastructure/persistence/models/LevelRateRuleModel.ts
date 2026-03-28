// ============================================================
// Sequelize Model: LevelRateRuleModel  (nueva — tabla hija)
// HU-PV-01: Tasas mensuales por número de cuotas.
//
// DISEÑO:
//   - Hija de LevelConfigModel (level_configs).
//   - Una fila por (level_config_id, payment_count).
//   - ON DELETE RESTRICT: la FK preserva el histórico. Para borrar
//     reglas hay que eliminarlas manualmente antes que la cabecera.
//   - rate_monthly = 0 → cuota sin interés.
//   - rate_monthly > 0 → tasa mensual vencida (ej: 0.009000 = 0.9% MV).
// ============================================================

import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import { Database } from '../../config/database';

interface LevelRateRuleAttributes {
  id: string;
  level_config_id: string;    // FK → level_configs.id (ON DELETE RESTRICT)
  payment_count: number;      // 1 .. max_payments_con_interes del padre
  rate_monthly: number;       // decimal(8,6) — 0 = sin interés
  created_at: Date;
  updated_at: Date;
}

type LevelRateRuleCreation = Optional<LevelRateRuleAttributes, 'id' | 'created_at' | 'updated_at'>;

export class LevelRateRuleModel
  extends Model<LevelRateRuleAttributes, LevelRateRuleCreation>
  implements LevelRateRuleAttributes
{
  declare id: string;
  declare level_config_id: string;
  declare payment_count: number;
  declare rate_monthly: number;
  declare created_at: Date;
  declare updated_at: Date;
}

const sequelize = Database.getInstance().getSequelize();

LevelRateRuleModel.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    level_config_id: {
      type: DataTypes.CHAR(36),
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
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'level_rate_rules',
    timestamps: false,
  },
);
