import { Response } from 'express';
import { Op } from 'sequelize';
import { ReportCardModel } from '../models/ReportCard';
import { StudentModel } from '../models/Student';
import { UserModel } from '../models/User';
import { ClassroomModel } from '../models/Classroom';
import { UserRole } from '../types';

export class ReportCardController {
  // Get report cards (filtered by role and query params)
  async getReportCards(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { student_id, term, academic_year } = req.query;

      let whereClause: any = {};

      if (student_id) whereClause.studentId = student_id;
      if (term) whereClause.term = term;
      if (academic_year) whereClause.academicYear = academic_year;

      if (userRole === UserRole.GUARDIAN) {
        // Guardians see report cards for their own children (both before and after approval)
        const students = await StudentModel.findAll({
          where: { guardianId: userId }
        });
        const studentIds = students.map(s => s.studentId);

        whereClause.studentId = { [Op.in]: studentIds };
      } else if (userRole === UserRole.TEACHER || userRole === UserRole.HOMEROOM_TEACHER) {
        // Teachers see report cards they filled OR for students in their assigned classes
        const assignedClassrooms = await ClassroomModel.findAll({
          where: {
            [Op.or]: [
              { teacherId: userId },
              { homeroomTeacherId: userId }
            ]
          }
        });
        const classIds = assignedClassrooms.map(c => c.classId);

        const students = await StudentModel.findAll({
          where: { classId: classIds }
        });
        const studentIds = students.map(s => s.studentId);

        whereClause[Op.or] = [
          { filledBy: userId },
          { studentId: { [Op.in]: studentIds } }
        ];
      } else if (userRole !== UserRole.DIRECTOR && userRole !== UserRole.REGISTRAR) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const reportCards = await ReportCardModel.findAll({
        where: whereClause,
        include: [
          { model: StudentModel, as: 'student', attributes: ['fullName', 'classId', 'guardianId'] },
          { model: UserModel, as: 'teacher', attributes: ['fullName'] }
        ],
        order: [['filledAt', 'DESC']]
      });

      // Load all classrooms and teachers to map homeroom teacher contact info dynamically
      const classrooms = await ClassroomModel.findAll();
      const classroomMap = new Map(classrooms.map(c => [c.classId, c]));

      const teachers = await UserModel.findAll({
        where: {
          role: {
            [Op.in]: [UserRole.TEACHER, UserRole.HOMEROOM_TEACHER]
          }
        }
      });
      const teacherMap = new Map(teachers.map(t => [t.userId, t]));

      // Map to frontend properties if necessary
      const formattedReportCards = reportCards.map((rc: any) => {
        const studentClassId = rc.student?.classId;
        const classroom = studentClassId ? classroomMap.get(studentClassId) : null;
        const homeroomTeacher = classroom ? teacherMap.get(classroom.homeroomTeacherId) : null;

        return {
          id: rc.reportcardId,
          reportcardId: rc.reportcardId,
          studentId: rc.studentId,
          studentName: rc.student?.fullName || 'Unknown Student',
          student: rc.student,
          teacher: rc.teacher,
          grade: classroom ? classroom.classLevel : 'KG-A', // fallback
          term: rc.term,
          academicYear: rc.academicYear,
          status: rc.status,
          submittedBy: rc.teacher?.fullName || 'Unknown Teacher',
          filledAt: rc.filledAt,
          subjectsGrades: rc.subjectsGrades,
          teacherComments: rc.teacherComments,
          principalComments: rc.principalComments,
          attendanceRecord: rc.attendanceRecord,
          conductGrade: rc.conductGrade,
          overallGrade: rc.overallGrade,
          homeroomTeacher: {
            userId: homeroomTeacher?.userId || null,
            fullName: homeroomTeacher?.fullName || 'Unassigned',
            email: homeroomTeacher?.email || 'N/A',
            phoneNo: homeroomTeacher?.phoneNo || 'N/A'
          }
        };
      });

      res.status(200).json({
        success: true,
        data: { reportCards: formattedReportCards }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch report cards',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Create a new report card
  async createReportCard(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      if (userRole !== UserRole.TEACHER && userRole !== UserRole.HOMEROOM_TEACHER) {
        res.status(403).json({
          success: false,
          message: 'Only teachers can create report cards'
        });
        return;
      }

      const {
        studentId,
        term,
        academicYear,
        subjectsGrades,
        teacherComments,
        conductGrade,
        overallGrade
      } = req.body;

      if (!studentId || !term || !academicYear || !subjectsGrades) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
        return;
      }

      const student = await StudentModel.findByPk(studentId);
      if (!student) {
        res.status(404).json({
          success: false,
          message: 'Student not found'
        });
        return;
      }

      // Check if logged-in teacher is the homeroom teacher of student's class
      const classroom = await ClassroomModel.findByPk(student.classId);
      if (!classroom || classroom.homeroomTeacherId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied: Only the homeroom teacher of this class can fill report cards'
        });
        return;
      }

      // Check if report card already exists for this term
      const existing = await ReportCardModel.findOne({
        where: { studentId, term, academicYear }
      });

      if (existing) {
        res.status(400).json({
          success: false,
          message: `Report card already exists for ${term} (${academicYear})`
        });
        return;
      }

      const reportCard = await ReportCardModel.create({
        studentId: parseInt(studentId),
        term,
        academicYear,
        filledBy: userId,
        status: 'pending',
        subjectsGrades,
        teacherComments: teacherComments || '',
        conductGrade: conductGrade || '',
        overallGrade: overallGrade || '',
        filledAt: new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Report card created successfully',
        data: reportCard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create report card',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Approve report card
  async approveReportCard(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { id } = req.params;

      if (userRole !== UserRole.DIRECTOR && userRole !== UserRole.REGISTRAR) {
        res.status(403).json({
          success: false,
          message: 'Only directors and registrars can approve report cards'
        });
        return;
      }

      const reportCard = await ReportCardModel.findByPk(id);
      if (!reportCard) {
        res.status(404).json({
          success: false,
          message: 'Report card not found'
        });
        return;
      }

      await reportCard.update({
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date()
      });

      res.status(200).json({
        success: true,
        message: 'Report card approved successfully',
        data: reportCard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to approve report card',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Reject / Unlock report card
  async rejectReportCard(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { id } = req.params;
      const { reason } = req.body;

      if (userRole !== UserRole.DIRECTOR && userRole !== UserRole.REGISTRAR) {
        res.status(403).json({
          success: false,
          message: 'Only directors and registrars can reject report cards'
        });
        return;
      }

      const reportCard = await ReportCardModel.findByPk(id);
      if (!reportCard) {
        res.status(404).json({
          success: false,
          message: 'Report card not found'
        });
        return;
      }

      await reportCard.update({
        status: 'unlocked', // sets status to unlocked for editing/revision
        principalComments: reason || 'Revision requested by director',
        editTimestamp: new Date()
      });

      res.status(200).json({
        success: true,
        message: 'Report card sent back for revision',
        data: reportCard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to reject report card',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Unlock report card
  async unlockReportCard(req: any, res: Response): Promise<void> {
    try {
      const userRole = req.user.role;
      const { id } = req.params;

      if (userRole !== UserRole.DIRECTOR && userRole !== UserRole.REGISTRAR && userRole !== UserRole.HOMEROOM_TEACHER) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const reportCard = await ReportCardModel.findByPk(id);
      if (!reportCard) {
        res.status(404).json({
          success: false,
          message: 'Report card not found'
        });
        return;
      }

      await reportCard.update({
        status: 'unlocked',
        editTimestamp: new Date()
      });

      res.status(200).json({
        success: true,
        message: 'Report card unlocked successfully',
        data: reportCard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to unlock report card',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update a report card (when unlocked or editing is permitted)
  async updateReportCard(req: any, res: Response): Promise<void> {
    try {
      const userRole = req.user.role;
      const { id } = req.params;

      if (userRole !== UserRole.TEACHER && userRole !== UserRole.HOMEROOM_TEACHER) {
        res.status(403).json({
          success: false,
          message: 'Only teachers can edit report cards'
        });
        return;
      }

      const reportCard = await ReportCardModel.findByPk(id);
      if (!reportCard) {
        res.status(404).json({
          success: false,
          message: 'Report card not found'
        });
        return;
      }

      const student = await StudentModel.findByPk(reportCard.studentId);
      if (!student) {
        res.status(404).json({
          success: false,
          message: 'Student associated with this report card not found'
        });
        return;
      }

      // Check if logged-in teacher is the homeroom teacher of student's class
      const classroom = await ClassroomModel.findByPk(student.classId);
      if (!classroom || classroom.homeroomTeacherId !== req.user.userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied: Only the homeroom teacher of this class can edit report cards'
        });
        return;
      }

      // Teachers can only edit pending or unlocked report cards
      if (reportCard.status === 'approved') {
        res.status(400).json({
          success: false,
          message: 'Approved report cards cannot be edited'
        });
        return;
      }

      const {
        term,
        academicYear,
        subjectsGrades,
        teacherComments,
        conductGrade,
        overallGrade
      } = req.body;

      await reportCard.update({
        term: term || reportCard.term,
        academicYear: academicYear || reportCard.academicYear,
        subjectsGrades: subjectsGrades || reportCard.subjectsGrades,
        teacherComments: teacherComments !== undefined ? teacherComments : reportCard.teacherComments,
        conductGrade: conductGrade !== undefined ? conductGrade : reportCard.conductGrade,
        overallGrade: overallGrade !== undefined ? overallGrade : reportCard.overallGrade,
        status: 'pending', // reset status to pending for approval
        filledAt: new Date()
      });

      res.status(200).json({
        success: true,
        message: 'Report card updated successfully',
        data: reportCard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update report card',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
