import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { validate, schemas } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();
const notificationController = new NotificationController();

// All notification routes require authentication
router.use(authenticateToken);

// GET /api/notifications - Get notifications for logged-in user
router.get('/', notificationController.getNotifications.bind(notificationController));

// POST /api/notifications - Create notification (Director/Registrar only)
router.post('/', 
  validate(schemas.notification), 
  notificationController.createNotification.bind(notificationController)
);

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', notificationController.markAsRead.bind(notificationController));

// PUT /api/notifications/:id - Update notification (sender or admin only)
router.put('/:id', 
  validate(schemas.notificationUpdate), 
  notificationController.updateNotification.bind(notificationController)
);

// DELETE /api/notifications/:id - Delete notification (sender or admin only)
router.delete('/:id', notificationController.deleteNotification.bind(notificationController));

export default router;
