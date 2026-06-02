import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

interface PendingRegistrationAttributes {
  tempId: string;
  fullName: string;
  email: string;
  phoneNo: string;
  passwordHash: string;
  nationalId: string;
  studentId: number;
  studentName: string;
  relationshipType: 'parent' | 'legal_guardian';
  otpVerified: boolean;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PendingRegistrationCreationAttributes extends Optional<PendingRegistrationAttributes, 'otpVerified' | 'createdAt' | 'updatedAt'> {}

export class PendingRegistrationModel extends Model<PendingRegistrationAttributes, PendingRegistrationCreationAttributes> implements PendingRegistrationAttributes {
  public tempId!: string;
  public fullName!: string;
  public email!: string;
  public phoneNo!: string;
  public passwordHash!: string;
  public nationalId!: string;
  public studentId!: number;
  public studentName!: string;
  public relationshipType!: 'parent' | 'legal_guardian';
  public otpVerified!: boolean;
  public expiresAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PendingRegistrationModel.init(
  {
    tempId: {
      type: DataTypes.STRING(255),
      primaryKey: true,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    phoneNo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    nationalId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    studentName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    relationshipType: {
      type: DataTypes.ENUM('parent', 'legal_guardian'),
      allowNull: false,
    },
    otpVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'PendingRegistration',
    tableName: 'PendingRegistrations',
    timestamps: true,
  }
);

export default PendingRegistrationModel;
