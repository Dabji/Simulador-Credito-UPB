// ============================================================
// Sequelize Model: InitialPaymentRuleModel
// Mapeo ORM para la tabla 'initial_payment_rules'.
// Esquemas concretos del formato AF-FO-318-B por nivel/modalidad.
// ============================================================

import { DataTypes, Model } from 'sequelize';
import { Database } from '../../config/database';

interface InitialPaymentRuleAttributes {
  id: string;
  level: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech';
  modality: 'SIN_INTERES' | 'CON_INTERES';
  extra_installments: number;
  initial_pct_required: number;      // decimal(5,4) → e.g. 0.2000 = 20%
  parameter_version_id: string;
}

export class InitialPaymentRuleModel
  extends Model<InitialPaymentRuleAttributes>
  implements InitialPaymentRuleAttributes
{
  declare id: string;
  declare level: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech';
  declare modality: 'SIN_INTERES' | 'CON_INTERES';
  declare extra_installments: number;
  declare initial_pct_required: number;
  declare parameter_version_id: string;
}

const sequelize = Database.getInstance().getSequelize();

InitialPaymentRuleModel.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    level: {
      type: DataTypes.ENUM('PREGRADO', 'POSGRADO', 'UPB_Tech'),
      allowNull: false,
    },
    modality: {
      type: DataTypes.ENUM('SIN_INTERES', 'CON_INTERES'),
      allowNull: false,
    },
    extra_installments: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    initial_pct_required: {
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
    tableName: 'initial_payment_rules',
    timestamps: false,
  },
);
