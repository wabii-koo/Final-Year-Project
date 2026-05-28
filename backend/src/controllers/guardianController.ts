import { Request, Response } from 'express';
import { sequelize } from '../database/connection';
import { QueryTypes } from 'sequelize';

export class GuardianController {
  // Get guardian's linked students (my children)
  async getMyChildren(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Only guardians can access their children
      if (userRole !== 'guardian') {
        res.status(403).json({
          success: false,
          message: 'Access denied: Only guardians can view their children'
        });
        return;
      }

      // Find students linked to this guardian with homeroom teacher info
      const students = await sequelize.query(`
        SELECT 
          s.student_id as "studentId",
          s.full_name as "fullName",
          s.class_id as "classId",
          s.dob,
          s.emergency_contact as "emergencyContact",
          c.class_level as "className",
          u.user_id as "homeroomTeacherId",
          u.full_name as "homeroomTeacherName",
          u.email as "homeroomTeacherEmail",
          u.phone_no as "homeroomTeacherPhone"
        FROM "Students" s
        LEFT JOIN "Classrooms" c ON s.class_id = c.class_id
        LEFT JOIN users u ON c.homeroom_teacher_id = u.user_id
        WHERE s.guardian_id = ?
        ORDER BY s.full_name ASC
      `, {
        replacements: [userId],
        type: QueryTypes.SELECT
      });

      res.status(200).json({
        success: true,
        data: students
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch children',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

