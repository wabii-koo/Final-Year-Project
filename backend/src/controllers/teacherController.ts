import { Request, Response } from 'express';
import { sequelize } from '../database/connection';
import { HomeworkModel } from '../models/Homework';
import { UserModel } from '../models/User';
import { StudentModel } from '../models/Student';
import { QueryTypes } from 'sequelize';

// Section 2.4.1 - Subject Teacher role definition
// Section 2.6.2.2 - Use Case UC-09: Homework Communication Management

export class TeacherController {
  // Module 1: Get classes assigned to teacher
  async getAssignedClasses(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Only teachers can access their assigned classes
      if (userRole !== 'teacher' && userRole !== 'homeroom_teacher') {
        res.status(403).json({
          success: false,
          message: 'Access denied: Only teachers can view assigned classes'
        });
        return;
      }

      console.log(`[DEBUG] Fetching classes for UserID: ${userId}, Role: ${userRole}`);
      let classes: any[] = [];

      const onlySubjectClasses = req.query.onlySubjectClasses === 'true';
      console.log(`[DEBUG] onlySubjectClasses filter: ${onlySubjectClasses}`);

      if (onlySubjectClasses) {
        // Return only classes where this user is the designated subject teacher.
        const results = await sequelize.query(`
          SELECT DISTINCT
            c.class_id as id,
            c.class_id as "classId",
            c.class_level as "classLevel",
            c.class_level as "className",
            c.academic_year as "academicYear",
            c.subject as "subject",
            (SELECT COUNT(*) FROM "Students" s WHERE s.class_id IN (SELECT class_id FROM "Classrooms" WHERE class_level = c.class_level)) as "totalStudents"
          FROM "Classrooms" c
          WHERE c.teacher_id = ?
          ORDER BY c.class_level
        `, {
          replacements: [userId],
          type: QueryTypes.SELECT
        });
        classes = results as any[];
      } else if (userRole === 'homeroom_teacher') {
        // Homeroom teachers can also teach subjects in other classes (dual-role).
        // Return ALL classes where they are the homeroom teacher OR a subject teacher.
        const results = await sequelize.query(`
          SELECT DISTINCT
            c.class_id as id,
            c.class_id as "classId",
            c.class_level as "classLevel",
            c.class_level as "className",
            c.academic_year as "academicYear",
            c.subject as "subject",
            (SELECT COUNT(*) FROM "Students" s WHERE s.class_id IN (SELECT class_id FROM "Classrooms" WHERE class_level = c.class_level)) as "totalStudents"
          FROM "Classrooms" c
          WHERE c.homeroom_teacher_id = ? OR c.teacher_id = ?
          ORDER BY c.class_level
        `, {
          replacements: [userId, userId],
          type: QueryTypes.SELECT
        });
        classes = results as any[];
      } else {
        // For regular teachers, get all classes they teach (subject or homeroom)
        const results = await sequelize.query(`
          SELECT DISTINCT 
            c.class_id as id, 
            c.class_id as "classId",
            c.class_level as "classLevel", 
            c.class_level as "className", 
            c.academic_year as "academicYear",
            c.subject as "subject",
            (SELECT COUNT(*) FROM "Students" s WHERE s.class_id IN (SELECT class_id FROM "Classrooms" WHERE class_level = c.class_level)) as "totalStudents"
          FROM "Classrooms" c
          WHERE c.teacher_id = ? OR c.homeroom_teacher_id = ?
          ORDER BY c.class_level
        `, {
          replacements: [userId, userId],
          type: QueryTypes.SELECT
        });
        classes = results as any[];
      }
      
      console.log(`[DEBUG] Found ${classes.length} classes for user ${userId}`);
      console.log('[DEBUG] Classes:', JSON.stringify(classes));

      res.json({
        success: true,
        data: {
          classes: classes
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch assigned classes',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Module 2: Get students assigned to teacher
  async getTeacherStudents(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Only teachers can access their assigned students
      if (userRole !== 'teacher' && userRole !== 'homeroom_teacher') {
        res.status(403).json({
          success: false,
          message: 'Access denied: Only teachers can view assigned students'
        });
        return;
      }

      // Get students for a specific class
      const classId = req.params.classId;
      
      const results = await sequelize.query(`
        SELECT 
          s.student_id as "studentId",
          s.full_name as "fullName",
          s.class_id as "classId",
          s.guardian_id,
          u.full_name as "guardianName"
        FROM "Students" s
        LEFT JOIN users u ON s.guardian_id = u.user_id
        ${classId ? 'WHERE s.class_id IN (SELECT class_id FROM "Classrooms" WHERE class_level = (SELECT class_level FROM "Classrooms" WHERE class_id = ?))' : ''}
        ORDER BY s.full_name
      `, {
        replacements: classId ? [classId] : [],
        type: QueryTypes.SELECT
      });

      const students = (results || []).map((row: any) => {
        const nameParts = row.fullName ? row.fullName.split(' ') : ['Unknown', ''];
        return {
          id: row.studentId,
          studentId: row.studentId,
          fullName: row.fullName || `${nameParts[0]} ${nameParts.slice(1).join(' ')}`.trim(),
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' ') || '',
          grade: row.grade || 'N/A',
          attendance: '95%',
          studentCode: 'KG2024' + row.studentId.toString().padStart(3, '0'),
          guardianName: row.guardianName || 'Not assigned',
          guardianEmail: row.guardianEmail || 'Not provided',
          guardianPhone: row.guardianPhone || 'Not provided'
        };
      });

      res.json(students);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch students',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
