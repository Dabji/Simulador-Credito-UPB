// ============================================================
// Sequelize Model: CreditModel
// ============================================================

import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import { Database } from '../../config/database';

interface CreditAttributes {
  id: string;
  user_id: string;
  amount: number;
  annual_rate: number;
  term_months: number;
  amortization_type: 'FRENCH';
  monthly_payment: number;
  total_interest: number;
  total_payment: number;
  created_at: Date;
  updated_at: Date;
}

type CreditCreationAttributes = Optional<CreditAttributes, 'created_at' | 'updated_at'>;

export class CreditModel extends Model<CreditAttributes, CreditCreationAttributes>
  implements CreditAttributes {
  declare id: string;
  declare user_id: string;
  declare amount: number;
  declare annual_rate: number;
  declare term_months: number;
  declare amortization_type: 'FRENCH';
  declare monthly_payment: number;
  declare total_interest: number;
  declare total_payment: number;
  declare created_at: Date;
  declare updated_at: Date;
}

const sequelize = Database.getInstance().getSequelize();

CreditModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    annual_rate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
    },
    term_months: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amortization_type: {
      type: DataTypes.ENUM('FRENCH'),
      allowNull: false,
      defaultValue: 'FRENCH',
    },
    monthly_payment: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    total_interest: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    total_payment: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
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
    tableName: 'credits',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);
