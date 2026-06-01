import { Request, Response } from 'express';
import { PickupRequestModel } from '../models/PickupRequest';
import { StudentModel } from '../models/Student';
import { UserModel } from '../models/User';
import { ClassroomModel } from '../models/Classroom';
import { Op } from 'sequelize';

export class PickupController {
  // Get all pickup requests for the user
  async getPickupRequests(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      let pickupRequests;

      if (userRole === 'guardian') {
        // Guardians see their own requests
        pickupRequests = await PickupRequestModel.findAll({
          where: { guardianId: userId },
          order: [['createdAt', 'DESC']]
        });
      } else if (userRole === 'teacher' || userRole === 'homeroom_teacher') {
        // Teachers see only requests for students in classes they teach/manage
        const assignedClassrooms = await ClassroomModel.findAll({
          where: {
            [Op.or]: [
              { teacherId: userId },
              { homeroomTeacherId: userId }
            ]
          }
        });
        const classIds = assignedClassrooms.map((c: any) => c.classId);

        const students = await StudentModel.findAll({
          where: { classId: classIds }
        });
        const studentIds = students.map((s: any) => s.studentId);

        pickupRequests = await PickupRequestModel.findAll({
          where: { studentId: studentIds },
          order: [['createdAt', 'DESC']]
        });
      } else if (userRole === 'registrar') {
        // Registrars see all requests
        pickupRequests = await PickupRequestModel.findAll({
          order: [['createdAt', 'DESC']]
        });
      } else {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: pickupRequests
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pickup requests',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Create a new pickup request
  async createPickupRequest(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Only guardians can create pickup requests
      if (userRole !== 'guardian') {
        res.status(403).json({
          success: false,
          message: 'Only guardians can create pickup requests'
        });
        return;
      }

      const {
        studentId,
        authorizedPersonName,
        authorizedPersonRelationship,
        authorizedPersonPhone,
        authorizedPersonNationalId,
        pickupDate,
        pickupTimeStart,
        pickupTimeEnd,
        notes
      } = req.body;

      // Validate required fields
      if (!studentId || !authorizedPersonName || !authorizedPersonRelationship || 
          !authorizedPersonPhone || !authorizedPersonNationalId || !pickupDate) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
        return;
      }

      // Validate Authorized Person's National ID format (Fayda Identification Number: exactly 12 digits, numbers only)
      const finRegex = /^[0-9]{12}$/;
      if (!finRegex.test(authorizedPersonNationalId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid Authorized Person National ID. It must be a valid Fayda Identification Number (exactly 12 digits, numbers only).'
        });
        return;
      }

      // Get student info
      const student = await StudentModel.findByPk(studentId);
      if (!student) {
        res.status(404).json({
          success: false,
          message: 'Student not found'
        });
        return;
      }

      // Verify the student belongs to this guardian
      if (student.guardianId !== userId) {
        res.status(403).json({
          success: false,
          message: 'You can only create pickup requests for your own children'
        });
        return;
      }

      // Get guardian info
      const guardian = await UserModel.findByPk(userId);

      // Create pickup request
      const pickupRequest = await PickupRequestModel.create({
        studentId: parseInt(studentId),
        studentName: student.fullName,
        guardianId: userId,
        guardianName: guardian?.fullName || '',
        authorizedPersonName,
        authorizedPersonRelationship,
        authorizedPersonPhone,
        authorizedPersonNationalId,
        pickupDate: new Date(pickupDate),
        pickupTimeStart: pickupTimeStart || '',
        pickupTimeEnd: pickupTimeEnd || '',
        status: 'pending',
        notes: notes || '',
        createdAt: new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Pickup request created successfully',
        data: pickupRequest
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create pickup request',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Process a pickup request (approve/reject)
  async processPickupRequest(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { requestId } = req.params;
      const { status, notes } = req.body;

      // Only teachers and registrars can process requests
      if (userRole !== 'teacher' && userRole !== 'homeroom_teacher' && userRole !== 'registrar') {
        res.status(403).json({
          success: false,
          message: 'Only teachers and registrars can process pickup requests'
        });
        return;
      }

      if (!status || !['approved', 'rejected'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status. Must be approved or rejected'
        });
        return;
      }

      const pickupRequest = await PickupRequestModel.findByPk(requestId);
      if (!pickupRequest) {
        res.status(404).json({
          success: false,
          message: 'Pickup request not found'
        });
        return;
      }

      if (pickupRequest.status !== 'pending') {
        res.status(400).json({
          success: false,
          message: 'Request has already been processed'
        });
        return;
      }

      // Restrict access for teachers/homeroom teachers
      if (userRole === 'teacher' || userRole === 'homeroom_teacher') {
        const student = await StudentModel.findByPk(pickupRequest.studentId);
        if (!student) {
          res.status(404).json({
            success: false,
            message: 'Student associated with this request not found'
          });
          return;
        }

        const classroom = await ClassroomModel.findOne({
          where: {
            classId: student.classId,
            [Op.or]: [
              { teacherId: userId },
              { homeroomTeacherId: userId }
            ]
          }
        });

        if (!classroom) {
          res.status(403).json({
            success: false,
            message: 'Access denied: You do not teach this student\'s class'
          });
          return;
        }
      }

      await pickupRequest.update({
        status,
        processedBy: userId,
        processedAt: new Date(),
        notes: notes || pickupRequest.notes
      });

      res.status(200).json({
        success: true,
        message: `Pickup request ${status} successfully`,
        data: pickupRequest
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to process pickup request',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
