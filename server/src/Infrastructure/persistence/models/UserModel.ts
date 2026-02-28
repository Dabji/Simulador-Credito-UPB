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
  document_type: 'CC' | 'TI' | null;
  document_number: string;
  password: string | null;
  phone: string | null;
  role: 'STUDENT' | 'ADMIN';
  is_active: boolean;
  terms_accepted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

type UserCreationAttributes = Optional<UserAttributes, 'document_type' | 'password' | 'phone' | 'terms_accepted_at' | 'created_at' | 'updated_at'>;

export class UserModel extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  declare id: string;
  declare email: string;
  declare first_name: string;
  declare last_name: string;
  declare document_type: 'CC' | 'TI' | null;
  declare document_number: string;
  declare password: string | null;
  declare phone: string | null;
  declare role: 'STUDENT' | 'ADMIN';
  declare is_active: boolean;
  declare terms_accepted_at: Date | null;
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
    document_type: {
      type: DataTypes.ENUM('CC', 'TI'),
      allowNull: true,
    },
    document_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
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
    terms_accepted_at: {
      type: DataTypes.DATE,
      allowNull: true,
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
