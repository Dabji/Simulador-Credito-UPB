// ============================================================
// Sequelize Model: InterestRateModel
// Mapeo ORM para la tabla 'interest_rates'.
// Tasa mensual por nivel educativo dentro de una versión.
// ============================================================

import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import { Database } from '../../config/database';

interface InterestRateAttributes {
  id: string;
  rate_monthly: number;                // decimal(8,6)
  rate_type: 'MV';
  level_scope: 'PREGRADO' | 'POSGRADO' | 'UPB_TEC';
  created_at: Date;
  parameter_version_id: string;
}

type InterestRateCreation = Optional<InterestRateAttributes, 'created_at'>;

export class InterestRateModel
  extends Model<InterestRateAttributes, InterestRateCreation>
  implements InterestRateAttributes
{
  declare id: string;
  declare rate_monthly: number;
  declare rate_type: 'MV';
  declare level_scope: 'PREGRADO' | 'POSGRADO' | 'UPB_TEC';
  declare created_at: Date;
  declare parameter_version_id: string;
}

const sequelize = Database.getInstance().getSequelize();

InterestRateModel.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    rate_monthly: {
      type: DataTypes.DECIMAL(8, 6),
      allowNull: false,
    },
    rate_type: {
      type: DataTypes.ENUM('MV'),
      allowNull: false,
      defaultValue: 'MV',
    },
    level_scope: {
      type: DataTypes.ENUM('PREGRADO', 'POSGRADO', 'UPB_TEC'),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    parameter_version_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'interest_rates',
    timestamps: false,
  },
);
