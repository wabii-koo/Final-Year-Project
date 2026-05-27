import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import { Classroom } from '../types';

interface ClassroomCreationAttributes extends Optional<Classroom, 'classId' | 'createdAt'> {}

export class ClassroomModel extends Model<Classroom, ClassroomCreationAttributes> implements Classroom {
  public classId!: number;
  public teacherId!: number;
  public classLevel!: string;
  public homeroomTeacherId!: number;
  public academicYear!: string;
  public subject?: string;
  public createdAt!: Date;
  
  // Association
  public students?: any[];
}

ClassroomModel.init(
  {
    classId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'class_id',
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'teacher_id',
    },
    classLevel: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'class_level',
    },
    homeroomTeacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'homeroom_teacher_id',
    },
    academicYear: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'academic_year',
    },
    subject: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'subject',
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
    modelName: 'Classroom',
    tableName: 'Classrooms',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false,
  }
);

// Define associations - lazy loaded to avoid circular imports
export const initClassroomAssociations = () => {
  const { StudentModel } = require('./Student');
  ClassroomModel.hasMany(StudentModel, {
    foreignKey: 'classId',
    as: 'students'
  });
};

export default ClassroomModel;
