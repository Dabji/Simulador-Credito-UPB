// ============================================================
// Sequelize Model: AmortizationRowModel
// Mapeo ORM para la tabla 'amortization_rows'.
// Filas de la tabla de amortización vinculadas a una simulación.
// ============================================================

import { DataTypes, Model } from 'sequelize';
import { Database } from '../../config/database';

interface AmortizationRowAttributes {
  id: string;
  payment_no: number;
  scheduled_date: string;            // DATE "YYYY-MM-DD"
  payment_value: number;             // bigint unsigned
  interest_value: number;
  principal_value: number;
  balance_after: number;
  simulation_id: string;
}

export class AmortizationRowModel
  extends Model<AmortizationRowAttributes>
  implements AmortizationRowAttributes
{
  declare id: string;
  declare payment_no: number;
  declare scheduled_date: string;
  declare payment_value: number;
  declare interest_value: number;
  declare principal_value: number;
  declare balance_after: number;
  declare simulation_id: string;
}

const sequelize = Database.getInstance().getSequelize();

AmortizationRowModel.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    payment_no: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
    },
    scheduled_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    payment_value: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    interest_value: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    principal_value: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    balance_after: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    simulation_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'amortization_rows',
    timestamps: false,
  },
);
