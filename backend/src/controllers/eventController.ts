import { Request, Response } from 'express';
import { EventModel } from '../models/Event';
import { UserModel } from '../models/User';
import { UserRole } from '../types';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

export class EventController {
  async getEvents(req: any, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const userRole = req.user.role;

      let whereClause: any = { isActive: true };

      // Filter by date range if provided
      if (startDate && endDate) {
        whereClause.eventDate = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
        };
      }

      // Role-based visibility
      if (userRole === UserRole.GUARDIAN) {
        whereClause.targetAudience = { [Op.in]: ['all', 'guardians_only'] };
      } else if (userRole === UserRole.TEACHER || userRole === UserRole.HOMEROOM_TEACHER) {
        whereClause.targetAudience = { [Op.in]: ['all', 'teachers_only'] };
      }

      const events = await EventModel.findAll({
        where: whereClause,
        include: [{
          model: UserModel,
          as: 'creator',
          attributes: ['fullName', 'role']
        }],
        order: [['eventDate', 'ASC']]
      });

      res.json({
        success: true,
        data: { events }
      });
    } catch (error) {
      logger.error('Get events error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch events'
      });
    }
  }

  async createEvent(req: any, res: Response): Promise<void> {
    try {
      const { title, description, eventDate, eventType, location, targetAudience } = req.body;
      const userId = req.user.userId;

      // Validate role - Only Director can create events per document
      if (req.user.role !== UserRole.DIRECTOR) {
        res.status(403).json({
          success: false,
          message: 'Only Director can schedule school-wide events'
        });
        return;
      }

      // Conflict Detection: Same time and location
      const existingEvent = await EventModel.findOne({
        where: {
          eventDate: new Date(eventDate),
          location: location,
          isActive: true
        }
      });

      if (existingEvent) {
        res.status(409).json({
          success: false,
          error: {
            code: 'EVENT_CONFLICT',
            message: `A conflict was detected: "${existingEvent.title}" is already scheduled at this time and location.`
          }
        });
        return;
      }

      const event = await EventModel.create({
        title,
        description,
        eventDate: new Date(eventDate),
        eventType,
        location,
        targetAudience,
        createdBy: userId,
        isActive: true
      });

      res.status(201).json({
        success: true,
        message: 'Event scheduled successfully',
        data: event
      });
    } catch (error) {
      logger.error('Create event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule event'
      });
    }
  }

  async deleteEvent(req: any, res: Response): Promise<void> {
    try {
      // Validate role - Only Director can delete events
      if (req.user.role !== UserRole.DIRECTOR) {
        res.status(403).json({
          success: false,
          message: 'Only Director can cancel school-wide events'
        });
        return;
      }

      const { id } = req.params;
      const event = await EventModel.findByPk(id);

      if (!event) {
        res.status(404).json({ success: false, message: 'Event not found' });
        return;
      }

      await event.update({ isActive: false });

      res.json({
        success: true,
        message: 'Event cancelled successfully'
      });
    } catch (error) {
      logger.error('Delete event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel event'
      });
    }
  }

  async updateEvent(req: any, res: Response): Promise<void> {
    try {
      // Validate role - Only Director can update events
      if (req.user.role !== UserRole.DIRECTOR) {
        res.status(403).json({
          success: false,
          message: 'Only Director can update school-wide events'
        });
        return;
      }

      const { id } = req.params;
      const { title, description, eventDate, eventType, location, targetAudience } = req.body;

      const event = await EventModel.findByPk(id);
      if (!event || !event.isActive) {
        res.status(404).json({ success: false, message: 'Event not found' });
        return;
      }

      // Conflict Detection: Same time and location (excluding this event)
      if (eventDate || location) {
        const checkDate = eventDate ? new Date(eventDate) : event.eventDate;
        const checkLocation = location !== undefined ? location : event.location;

        const existingEvent = await EventModel.findOne({
          where: {
            eventDate: checkDate,
            location: checkLocation,
            isActive: true,
            eventId: { [Op.ne]: id }
          }
        });

        if (existingEvent) {
          res.status(409).json({
            success: false,
            error: {
              code: 'EVENT_CONFLICT',
              message: `A conflict was detected: "${existingEvent.title}" is already scheduled at this time and location.`
            }
          });
          return;
        }
      }

      await event.update({
        title: title !== undefined ? title : event.title,
        description: description !== undefined ? description : event.description,
        eventDate: eventDate !== undefined ? new Date(eventDate) : event.eventDate,
        eventType: eventType !== undefined ? eventType : event.eventType,
        location: location !== undefined ? location : event.location,
        targetAudience: targetAudience !== undefined ? targetAudience : event.targetAudience,
      });

      res.json({
        success: true,
        message: 'Event updated successfully',
        data: event
      });
    } catch (error) {
      logger.error('Update event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update event'
      });
    }
  }
}

export const eventController = new EventController();
