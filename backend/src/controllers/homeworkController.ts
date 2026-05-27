import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Homework } from '../models/Homework';
import { HomeworkView } from '../models/HomeworkView';
import { HomeworkFeedback } from '../models/HomeworkFeedback';
import { UserModel } from '../models/User';
import ClassroomModel from '../models/Classroom';
import StudentModel from '../models/Student';
import { UserRole } from '../types';

export class HomeworkController {
  async getHomework(req: any, res: Response): Promise<void> {
    try {
      console.log('Homework request - User:', req.user);
      
      const { teacherId, classId } = req.query;
      const userRole = req.user?.role;
      const userId = req.user?.userId;

      if (!userRole) {
        console.log('No user role found in request');
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      let whereClause: any = { isActive: true };

      // Role-based filtering
      if (userRole === UserRole.TEACHER) {
        // regular teachers see homework they created
        whereClause.teacherId = userId;
      } else if (userRole === UserRole.HOMEROOM_TEACHER) {
        // Homeroom teachers see:
        //  1. All homework THEY created (any class, as subject or homeroom teacher)
        //  2. Homework assigned to any class where they are the homeroom teacher
        const homeroomClassrooms = await ClassroomModel.findAll({
          where: { homeroomTeacherId: userId }
        });
        
        const classLevels: string[] = homeroomClassrooms.map((c: any) => c.classLevel);
        
        if (classId) {
          const targetClass = await ClassroomModel.findByPk(classId);
          if (targetClass && !classLevels.includes(targetClass.classLevel)) {
            classLevels.push(targetClass.classLevel);
          }
        }
        
        if (classLevels.length > 0) {
          whereClause = {
            isActive: true,
            [Op.or]: [
              { teacherId: userId },
              { className: classLevels }
            ]
          };
        } else {
          whereClause.teacherId = userId;
        }
      } else if (userRole === UserRole.GUARDIAN) {
        // For guardians, show homework for their children's classes
        const students = await StudentModel.findAll({
          where: { guardianId: userId }
        });
        
        if (students.length > 0) {
          const studentClassIds = students.map((s: any) => s.classId);
          const classrooms = await ClassroomModel.findAll({
            where: { classId: studentClassIds }
          });
          const classLevels = classrooms.map((c: any) => c.classLevel);
          
          if (classLevels.length > 0) {
            whereClause[Op.or] = classLevels.map((level: string) => ({
              className: {
                [Op.iLike]: level
              }
            }));
          } else {
            whereClause.className = 'NON_EXISTENT_CLASS';
          }
        } else {
          whereClause.className = 'NON_EXISTENT_CLASS';
        }
      }

      console.log('Homework query - Where clause:', whereClause);

      const homework = await Homework.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      });

      console.log('Homework found:', homework.length, 'items');

      // Populate teacherName, viewCount, and feedbackCount dynamically
      const transformedHomework = await Promise.all(homework.map(async (h: any) => {
        const teacher = await UserModel.findByPk(h.teacherId);
        const teacherName = teacher ? teacher.fullName : 'Unknown Teacher';

        const viewCount = await HomeworkView.count({
          where: { homeworkId: h.homeworkId }
        });

        const feedbackCount = await HomeworkFeedback.count({
          where: { homeworkId: h.homeworkId }
        });

        const userHasSeen = await HomeworkView.findOne({
          where: { homeworkId: h.homeworkId, guardianId: userId }
        });

        return {
          homeworkId: h.homeworkId,
          title: h.title,
          description: h.description,
          subject: h.subject,
          className: h.className,
          dueDate: h.dueDate,
          createdAt: h.createdAt,
          isActive: h.isActive,
          teacherName,
          viewCount,
          feedbackCount,
          isSeen: !!userHasSeen
        };
      }));

      res.json({
        success: true,
        data: { homework: transformedHomework }
      });
    } catch (error) {
      console.error('Get homework error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch homework',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getHomeworkById(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userRole = req.user?.role;
      const userId = req.user?.userId;

      if (!userRole) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const homework = await Homework.findByPk(id);
      if (!homework) {
        res.status(404).json({
          success: false,
          message: 'Homework not found'
        });
        return;
      }

      // Check if user is allowed to access this homework
      let isAllowed = false;
      if (userRole === UserRole.TEACHER) {
        // Teacher of this class or creator
        isAllowed = (homework as any).teacherId === userId;
      } else if (userRole === UserRole.HOMEROOM_TEACHER) {
        // Homeroom teacher for this class or creator
        const classroom = await ClassroomModel.findOne({
          where: { 
            homeroomTeacherId: userId, 
            classLevel: {
              [Op.iLike]: (homework as any).className
            }
          }
        });
        isAllowed = !!classroom || (homework as any).teacherId === userId;
      } else if (userRole === UserRole.GUARDIAN) {
        // Guardian whose child is in this class
        const students = await StudentModel.findAll({
          where: { guardianId: userId }
        });
        const studentClassIds = students.map((s: any) => s.classId);
        const classrooms = await ClassroomModel.findAll({
          where: { 
            classId: studentClassIds, 
            classLevel: {
              [Op.iLike]: (homework as any).className
            }
          }
        });
        isAllowed = classrooms.length > 0;
      } else if (userRole === UserRole.DIRECTOR || userRole === UserRole.REGISTRAR) {
        isAllowed = true;
      }

      if (!isAllowed) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to view this homework'
        });
        return;
      }

      // Get teacher name
      const teacher = await UserModel.findByPk((homework as any).teacherId);
      const teacherName = teacher ? teacher.fullName : 'Unknown Teacher';

      const transformedHomework = {
        homeworkId: (homework as any).homeworkId,
        title: (homework as any).title,
        description: (homework as any).description,
        subject: (homework as any).subject,
        className: (homework as any).className,
        dueDate: (homework as any).dueDate,
        createdAt: (homework as any).createdAt,
        isActive: (homework as any).isActive,
        teacherName
      };

      res.json({
        success: true,
        data: { homework: transformedHomework }
      });
    } catch (error) {
      console.error('Get homework details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch homework details',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createHomework(req: any, res: Response): Promise<void> {
    try {
      const { title, description, subject, className, dueDate } = req.body;
      const userId = req.user.userId;

      const homework = await Homework.create({
        title,
        description,
        subject,
        className,
        teacherId: userId,
        dueDate: new Date(dueDate),
        isActive: true
      });

      res.status(201).json({
        success: true,
        message: 'Homework created successfully',
        data: { homework }
      });
    } catch (error) {
      console.error('Create homework error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create homework'
      });
    }
  }

  async updateHomework(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, dueDate, isActive } = req.body;
      const userId = req.user.userId;

      const homework = await Homework.findByPk(id);
      if (!homework) {
        res.status(404).json({
          success: false,
          message: 'Homework not found'
        });
        return;
      }

      if ((homework as any).teacherId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You can only edit your own homework'
        });
        return;
      }

      await homework.update({
        title: title || (homework as any).title,
        description: description || (homework as any).description,
        dueDate: dueDate ? new Date(dueDate) : (homework as any).dueDate,
        isActive: isActive !== undefined ? isActive : (homework as any).isActive
      });

      res.json({
        success: true,
        message: 'Homework updated successfully',
        data: { homework }
      });
    } catch (error) {
      console.error('Update homework error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update homework'
      });
    }
  }

  async deleteHomework(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const homework = await Homework.findByPk(id);
      if (!homework) {
        res.status(404).json({
          success: false,
          message: 'Homework not found'
        });
        return;
      }

      if ((homework as any).teacherId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You can only delete your own homework'
        });
        return;
      }

      await homework.destroy();

      res.json({
        success: true,
        message: 'Homework deleted successfully'
      });
    } catch (error) {
      console.error('Delete homework error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete homework'
      });
    }
  }

  async viewHomework(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const homework = await Homework.findByPk(id);
      if (!homework) {
        res.status(404).json({
          success: false,
          message: 'Homework not found'
        });
        return;
      }

      await HomeworkView.findOrCreate({
        where: {
          homeworkId: id,
          guardianId: userId
        },
        defaults: {
          homeworkId: id,
          guardianId: userId,
          viewedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Homework marked as viewed'
      });
    } catch (error) {
      console.error('View homework error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark homework as viewed'
      });
    }
  }

  async addFeedback(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { feedback } = req.body;
      const userId = req.user.userId;

      const homework = await Homework.findByPk(id);
      if (!homework) {
        res.status(404).json({
          success: false,
          message: 'Homework not found'
        });
        return;
      }

      await HomeworkFeedback.create({
        homeworkId: id,
        guardianId: userId,
        feedback,
        feedbackDate: new Date()
      });

      res.json({
        success: true,
        message: 'Feedback added successfully'
      });
    } catch (error) {
      console.error('Add feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add feedback'
      });
    }
  }

  async getHomeworkAnalytics(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const homework = await Homework.findByPk(id);
      if (!homework) {
        res.status(404).json({
          success: false,
          message: 'Homework not found'
        });
        return;
      }

      // FEEDBACK ROUTING: Only the teacher who CREATED this homework can see its feedback.
      // This ensures guardian replies reach only the sender of the assignment — not other
      // teachers who may also be associated with that class.
      const userRole = req.user.role;
      let isAllowed = false;
      
      if (userRole === UserRole.TEACHER || userRole === UserRole.HOMEROOM_TEACHER) {
        // Strictly check creator — do NOT grant access based on classroom association
        isAllowed = (homework as any).teacherId === userId;
      } else if (userRole === UserRole.DIRECTOR) {
        isAllowed = true;
      }

      if (!isAllowed) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to view analytics for this homework'
        });
        return;
      }

      // Get views with guardian details
      const views = await HomeworkView.findAll({
        where: { homeworkId: id },
        include: [{
          model: UserModel,
          as: 'guardian',
          attributes: ['fullName']
        }],
        order: [['viewedAt', 'DESC']]
      });

      // Get feedback with guardian details
      const feedbackList = await HomeworkFeedback.findAll({
        where: { homeworkId: id },
        include: [{
          model: UserModel,
          as: 'guardian',
          attributes: ['fullName']
        }],
        order: [['feedbackDate', 'DESC']]
      });

      const analytics = {
        totalViews: views.length,
        feedbackCount: feedbackList.length,
        viewDetails: views.map((v: any) => ({
          guardianName: v.guardian ? v.guardian.fullName : 'Unknown Guardian',
          viewedAt: v.viewedAt
        })),
        feedbackDetails: feedbackList.map((f: any) => ({
          guardianName: f.guardian ? f.guardian.fullName : 'Unknown Guardian',
          feedback: f.feedback,
          feedbackDate: f.feedbackDate
        }))
      };

      res.json({
        success: true,
        data: { analytics }
      });
    } catch (error) {
      console.error('Get homework analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch homework analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async exportHomeworkData(req: any, res: Response): Promise<void> {
    try {
      const { format } = req.query;
      const userRole = req.user.role;
      const userId = req.user.userId;

      let whereClause: any = { isActive: true };

      if (userRole === UserRole.TEACHER || userRole === UserRole.HOMEROOM_TEACHER) {
        // Export only homework THIS teacher created (regardless of class)
        whereClause.teacherId = userId;
      }

      const homework = await Homework.findAll({
        where: whereClause
      });

      let exportData;
      if (format === 'csv') {
        exportData = await Promise.all(homework.map(async (h: any) => {
          const teacher = await UserModel.findByPk(h.teacherId);
          const teacherName = teacher ? teacher.fullName : 'Unknown Teacher';
          return {
            Title: h.title,
            Subject: h.subject,
            Class: h.className,
            DueDate: h.dueDate,
            Teacher: teacherName,
            Status: h.isActive ? 'Active' : 'Inactive'
          };
        }));
      } else {
        exportData = homework;
      }

      res.json({
        success: true,
        data: { homework: exportData }
      });
    } catch (error) {
      console.error('Export homework error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export homework data'
      });
    }
  }
}
