// ============================================================
// Sequelize Model: UserModel
// Mapeo ORM para la tabla 'users'.
// ============================================================

import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import { Database } from '../../config/database';

interface UserAttributes {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  identification_number: string;
  role: 'STUDENT' | 'ADMIN';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

type UserCreationAttributes = Optional<UserAttributes, 'created_at' | 'updated_at'>;

export class UserModel extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  declare id: string;
  declare email: string;
  declare first_name: string;
  declare last_name: string;
  declare identification_number: string;
  declare role: 'STUDENT' | 'ADMIN';
  declare is_active: boolean;
  declare created_at: Date;
  declare updated_at: Date;
}

const sequelize = Database.getInstance().getSequelize();

UserModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    identification_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    role: {
      type: DataTypes.ENUM('STUDENT', 'ADMIN'),
      allowNull: false,
      defaultValue: 'STUDENT',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);
