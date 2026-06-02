import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

interface GuardianRegistrationAttributes {
  registrationId: number;
  fullName: string;
  email: string;
  phoneNo: string;
  passwordHash: string;
  nationalId: string;
  studentId: number;
  studentName: string;
  relationshipType: 'parent' | 'legal_guardian';
  certificateDocumentPath: string;
  idFrontPath: string;
  idBackPath: string;
  status: 'pending' | 'approved' | 'rejected' | 'correction_required' | 'locked';
  rejectionReason?: string;
  correctionAttempts: number;
  reviewedBy?: number;
  reviewedAt?: Date;
  createdAt: Date;
}

interface GuardianRegistrationCreationAttributes extends Optional<GuardianRegistrationAttributes, 'registrationId' | 'rejectionReason' | 'reviewedBy' | 'reviewedAt' | 'createdAt'> {}

export class GuardianRegistrationModel extends Model<GuardianRegistrationAttributes, GuardianRegistrationCreationAttributes> implements GuardianRegistrationAttributes {
  public registrationId!: number;
  public fullName!: string;
  public email!: string;
  public phoneNo!: string;
  public passwordHash!: string;
  public nationalId!: string;
  public studentId!: number;
  public studentName!: string;
  public relationshipType!: 'parent' | 'legal_guardian';
  public certificateDocumentPath!: string;
  public idFrontPath!: string;
  public idBackPath!: string;
  public status!: 'pending' | 'approved' | 'rejected' | 'correction_required' | 'locked';
  public rejectionReason?: string;
  public correctionAttempts!: number;
  public reviewedBy?: number;
  public reviewedAt?: Date;
  public createdAt!: Date;
}

GuardianRegistrationModel.init(
  {
    registrationId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'registration_id',
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'full_name',
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'email',
    },
    phoneNo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'phone_no',
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    nationalId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'national_id',
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'student_id',
    },
    studentName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'student_name',
    },
    relationshipType: {
      type: DataTypes.ENUM('parent', 'legal_guardian'),
      allowNull: false,
      field: 'relationship_type',
    },
    certificateDocumentPath: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'certificate_document_path',
    },
    idFrontPath: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'id_front_path',
    },
    idBackPath: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'id_back_path',
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'correction_required', 'locked'),
      allowNull: false,
      defaultValue: 'pending',
      field: 'status',
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason',
    },
    correctionAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
      field: 'correction_attempts',
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reviewed_by',
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reviewed_at',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    modelName: 'GuardianRegistration',
    tableName: 'GuardianRegistrations',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false,
  }
);

export default GuardianRegistrationModel;
