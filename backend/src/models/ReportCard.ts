import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import { ReportCard } from '../types';
import { UserModel } from './User';
import { StudentModel } from './Student';

interface ReportCardCreationAttributes extends Optional<ReportCard, 'reportcardId' | 'filledAt' | 'status'> {}

export class ReportCardModel extends Model<ReportCard, ReportCardCreationAttributes> implements ReportCard {
  public reportcardId!: number;
  public studentId!: number;
  public term!: string;
  public academicYear!: string;
  public filledBy!: number;
  public filledAt!: Date;
  public status!: 'pending' | 'approved' | 'unlocked';
  public approvedBy?: number;
  public approvedAt?: Date;
  public editTimestamp?: Date;
  public subjectsGrades!: Record<string, string>;
  public teacherComments?: string;
  public principalComments?: string;
  public attendanceRecord?: Record<string, any>;
  public conductGrade?: string;
  public overallGrade?: string;
}

ReportCardModel.init(
  {
    reportcardId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'reportcard_id',
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'student_id',
    },
    term: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'term',
    },
    academicYear: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'academic_year',
    },
    filledBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'filled_by',
    },
    filledAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'filled_at',
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'unlocked'),
      allowNull: false,
      defaultValue: 'pending',
      field: 'status',
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'approved_by',
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at',
    },
    editTimestamp: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'edit_timestamp',
    },
    subjectsGrades: {
      type: DataTypes.JSON,
      allowNull: false,
      field: 'subjects_grades',
    },
    teacherComments: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'teacher_comments',
    },
    principalComments: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'principal_comments',
    },
    attendanceRecord: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'attendance_record',
    },
    conductGrade: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'conduct_grade',
    },
    overallGrade: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'overall_grade',
    },
  },
  {
    sequelize,
    modelName: 'ReportCard',
    tableName: 'ReportCards',
    timestamps: true,
    createdAt: 'filledAt',
    updatedAt: false,
  }
);

// Define associations
ReportCardModel.belongsTo(StudentModel, {
  foreignKey: 'studentId',
  as: 'student'
});

ReportCardModel.belongsTo(UserModel, {
  foreignKey: 'filledBy',
  as: 'teacher'
});

export default ReportCardModel;
