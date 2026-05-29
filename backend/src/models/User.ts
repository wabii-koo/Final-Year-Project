import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import { User, UserRole } from '../types';

interface UserCreationAttributes extends Optional<User, 'userId' | 'createdAt' | 'isActive' | 'lastLogin' | 'nationalId' | 'profileImage'> {}

export class UserModel extends Model<User, UserCreationAttributes> implements User {
  public userId!: number;
  public email!: string;
  public passwordHash!: string;
  public role!: UserRole;
  public fullName!: string;
  public createdAt!: Date;
  public phoneNo!: string;
  public address!: string;
  public nationalId?: string;
  public profileImage?: string;
  public isActive!: boolean;
  public lastLogin?: Date;
  public resetToken?: string;
  public resetTokenExpiry?: Date;
}

UserModel.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'user_id',
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'email',
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      field: 'role',
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'full_name',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    phoneNo: {
      type: DataTypes.STRING(15),
      allowNull: false,
      field: 'phone_no',
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'address',
    },
    nationalId: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'national_id',
    },
    profileImage: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'profile_image',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login',
    },
    resetToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'reset_token',
    },
    resetTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reset_token_expiry',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false,
    underscored: true,
  }
);

export default UserModel;
