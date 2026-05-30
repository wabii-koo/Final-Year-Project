import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import { Student } from '../types';

interface StudentCreationAttributes extends Optional<Student, 'studentId' | 'createdAt'> {}

export class StudentModel extends Model<Student, StudentCreationAttributes> implements Student {
  public studentId!: number;
  public guardianId?: number | null;
  public classId!: number;
  public fullName!: string;
  public dob!: Date;
  public emergencyContact!: string;
  public createdAt!: Date;
  
  // Associations
  public reportCards?: any[];
}

StudentModel.init(
  {
    studentId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'student_id',
    },
    guardianId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'guardian_id',
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'class_id',
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'full_name',
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'dob',
    },
    emergencyContact: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'emergency_contact',
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
    modelName: 'Student',
    tableName: 'Students',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false,
  }
);

// Define associations - lazy loaded to avoid circular imports
export const initStudentAssociations = () => {
  const { ReportCardModel } = require('./ReportCard');
  const { ClassroomModel } = require('./Classroom');
  StudentModel.hasMany(ReportCardModel, {
    foreignKey: 'studentId',
    as: 'reportCards'
  });
  StudentModel.belongsTo(ClassroomModel, {
    foreignKey: 'classId',
    as: 'classroom'
  });
};

export default StudentModel;
