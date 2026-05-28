import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

interface PickupRequestAttributes {
  requestId: number;
  studentId: number;
  studentName: string;
  guardianId: number;
  guardianName: string;
  authorizedPersonName: string;
  authorizedPersonRelationship: string;
  authorizedPersonPhone: string;
  authorizedPersonNationalId: string;
  status: 'pending' | 'approved' | 'rejected';
  pickupDate: Date;
  pickupTimeStart?: string;
  pickupTimeEnd?: string;
  notes?: string;
  processedBy?: number;
  processedAt?: Date;
  createdAt: Date;
}

interface PickupRequestCreationAttributes extends Optional<PickupRequestAttributes, 'requestId' | 'processedBy' | 'processedAt' | 'notes'> {}

export class PickupRequestModel extends Model<PickupRequestAttributes, PickupRequestCreationAttributes> implements PickupRequestAttributes {
  public requestId!: number;
  public studentId!: number;
  public studentName!: string;
  public guardianId!: number;
  public guardianName!: string;
  public authorizedPersonName!: string;
  public authorizedPersonRelationship!: string;
  public authorizedPersonPhone!: string;
  public authorizedPersonNationalId!: string;
  public status!: 'pending' | 'approved' | 'rejected';
  public pickupDate!: Date;
  public pickupTimeStart?: string;
  public pickupTimeEnd?: string;
  public notes?: string;
  public processedBy?: number;
  public processedAt?: Date;
  public createdAt!: Date;
}

PickupRequestModel.init(
  {
    requestId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'request_id'
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'student_id'
    },
    studentName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'student_name'
    },
    guardianId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'guardian_id'
    },
    guardianName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'guardian_name'
    },
    authorizedPersonName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'authorized_person_name'
    },
    authorizedPersonRelationship: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'authorized_person_relationship'
    },
    authorizedPersonPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'authorized_person_phone'
    },
    authorizedPersonNationalId: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'authorized_person_national_id'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
      field: 'status'
    },
    pickupDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'pickup_date'
    },
    pickupTimeStart: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'pickup_time_start'
    },
    pickupTimeEnd: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'pickup_time_end'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'notes'
    },
    processedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'processed_by'
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'processed_at'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  },
  {
    sequelize,
    tableName: 'PickupRequests',
    timestamps: false
  }
);

export default PickupRequestModel;
