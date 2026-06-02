import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/User';
import { ClassroomModel } from '../models/Classroom';
import { StudentModel } from '../models/Student';
import { EventModel } from '../models/Event';
import { NotificationModel } from '../models/Notification';
import { ReportCardModel } from '../models/ReportCard';
import { GuardianRegistrationModel } from '../models/GuardianRegistration';
import { SystemLogModel } from '../models/SystemLog';
import { sequelize } from '../database/connection';
import { UserRole } from '../types';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [students, teachers, guardians, pendingReports, emergencyAlerts, totalUsers] = await Promise.all([
      StudentModel.count(),
      UserModel.count({ where: { role: [UserRole.TEACHER, UserRole.HOMEROOM_TEACHER] } }),
      UserModel.count({ where: { role: UserRole.GUARDIAN, isActive: true } }),
      ReportCardModel.count({ where: { status: 'pending' } }),
      NotificationModel.count({ where: { priority: 'emergency', deliveryStatus: 'pending' } }),
      UserModel.count({ where: { isActive: true } })
    ]);

    const pendingRegistrations = await GuardianRegistrationModel.count({ where: { status: 'pending' } });

    res.json({
      success: true,
      data: {
        students,
        teachers,
        guardians,
        pendingReports,
        emergencyAlerts,
        pendingRegistrations,
        totalUsers
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    next(error);
  }
};

export const getPendingReportCards = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportCards = await ReportCardModel.findAll({
      where: { status: 'pending' },
      include: [
        { model: StudentModel, as: 'student', attributes: ['fullName'], required: true },
        { model: UserModel, as: 'teacher', attributes: ['fullName'] }
      ]
    });
    res.json({ success: true, data: reportCards });
  } catch (error) {
    logger.error('Error fetching pending report cards:', error);
    next(error);
  }
};

export const approveReportCard = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    const reportCard = await ReportCardModel.findByPk(id);
    if (!reportCard) {
      res.status(404).json({ success: false, message: 'Report card not found' });
      return;
    }

    await reportCard.update({
      status: 'approved',
      approvedBy: adminId,
      approvedAt: new Date()
    });

    // Log the action
    await SystemLogModel.create({
      userId: adminId,
      action: 'APPROVE_REPORT_CARD',
      tableName: 'ReportCards',
      recordId: id,
      newValues: { status: 'approved' }
    });

    res.json({
      success: true,
      message: 'Report card approved successfully'
    });
  } catch (error) {
    logger.error('Error approving report card:', error);
    next(error);
  }
};

export const getPendingRegistrations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const registrations = await GuardianRegistrationModel.findAll({
      where: { status: 'pending' },
      include: [{
        model: UserModel,
        as: 'user',
        attributes: ['fullName', 'email', 'phoneNo']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: registrations
    });
  } catch (error) {
    logger.error('Error fetching pending registrations:', error);
    next(error);
  }
};

export const approveRegistration = async (req: any, res: Response, next: NextFunction) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    const registration = await GuardianRegistrationModel.findByPk(id);
    if (!registration) {
      await t.rollback();
      res.status(404).json({ success: false, message: 'Registration not found' });
      return;
    }

    // Update registration status
    await registration.update({
      status: 'approved',
      reviewedBy: adminId,
      reviewedAt: new Date()
    }, { transaction: t });

    // Find or create guardian user account
    let guardianUser = await UserModel.findOne({ where: { email: registration.email }, transaction: t });
    if (!guardianUser) {
      guardianUser = await UserModel.create({
        email: registration.email,
        passwordHash: registration.passwordHash,
        role: UserRole.GUARDIAN,
        fullName: registration.fullName,
        phoneNo: registration.phoneNo,
        address: '',
        isActive: true,
        createdAt: new Date()
      }, { transaction: t });

      // Link to the student if possible. Acquire a row lock before updating to prevent
      // assigning a guardian when one already exists (avoid race conditions).
      let student = null;
      if (registration.studentId) {
        student = await StudentModel.findByPk(registration.studentId, { transaction: t, lock: t.LOCK.UPDATE });
      } else {
        // Try to find by name, then lock by PK
        const found = await StudentModel.findOne({ where: { fullName: registration.studentName }, transaction: t });
        if (found) {
          student = await StudentModel.findByPk((found as any).studentId, { transaction: t, lock: t.LOCK.UPDATE });
        }
      }

      if (student) {
        if (student.guardianId) {
          // Student already linked — roll back and respond with conflict
          await t.rollback();
          res.status(409).json({ success: false, message: 'Selected student is already linked to another guardian' });
          return;
        }
        await student.update({ guardianId: guardianUser.userId }, { transaction: t });
      }
    } else {
      await guardianUser.update({ isActive: true }, { transaction: t });
    }

    const activatedUserId = guardianUser.userId;

    // Log the action
    await SystemLogModel.create({
      userId: adminId,
      action: 'APPROVE_GUARDIAN_REGISTRATION',
      tableName: 'GuardianRegistrations',
      recordId: id,
      newValues: { status: 'approved', activated_user_id: activatedUserId }
    }, { transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: 'Guardian registration approved and account activated!'
    });
  } catch (error) {
    if (t) await t.rollback();
    logger.error('Error approving registration:', error);
    next(error);
  }
};

export const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, role } = req.query;
    let whereClause: any = {};

    if (query) {
      whereClause[Op.or] = [
        { fullName: { [Op.like]: `%${query}%` } },
        { email: { [Op.like]: `%${query}%` } }
      ];
    }

    if (role) {
      whereClause.role = role;
    }

    const users = await UserModel.findAll({
      where: whereClause,
      attributes: ['userId', 'fullName', 'email', 'role', 'phoneNo', 'isActive', 'profileImage'],
      limit: 50,
      order: [['fullName', 'ASC']]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Error searching users:', error);
    next(error);
  }
};
