import { Router } from 'express';
import { authenticateToken, checkRole } from '../middleware/auth';
import { HomeworkController } from '../controllers/homeworkController';
import { validate, schemas } from '../middleware/validation';
import { UserRole } from '../types';

const router = Router();

// Apply authentication to all homework routes
router.use(authenticateToken);

// GET /api/homework - View homework (role-based filtering)
router.get('/', new HomeworkController().getHomework);

// GET /api/homework/:id - View homework details
router.get('/:id', new HomeworkController().getHomeworkById);

// POST /api/homework - Create homework (Subject Teacher / Homeroom Teacher only)
router.post(
  '/', 
  checkRole([UserRole.TEACHER, UserRole.HOMEROOM_TEACHER]), 
  validate(schemas.homework), 
  new HomeworkController().createHomework
);

// PUT /api/homework/:id - Edit homework (Subject Teacher / Homeroom Teacher only)
router.put(
  '/:id', 
  checkRole([UserRole.TEACHER, UserRole.HOMEROOM_TEACHER]), 
  new HomeworkController().updateHomework
);

// DELETE /api/homework/:id - Delete homework (Subject Teacher / Homeroom Teacher only)
router.delete(
  '/:id', 
  checkRole([UserRole.TEACHER, UserRole.HOMEROOM_TEACHER]), 
  new HomeworkController().deleteHomework
);

// POST /api/homework/:id/view - Mark homework as viewed (Guardian only)
router.post(
  '/:id/view', 
  checkRole([UserRole.GUARDIAN]), 
  new HomeworkController().viewHomework
);

// POST /api/homework/:id/feedback - Add feedback (Guardian only)
router.post(
  '/:id/feedback', 
  checkRole([UserRole.GUARDIAN]), 
  validate(schemas.homeworkFeedback), 
  new HomeworkController().addFeedback
);

// GET /api/homework/:id/analytics - View analytics (Teacher / Homeroom Teacher only)
router.get(
  '/:id/analytics', 
  checkRole([UserRole.TEACHER, UserRole.HOMEROOM_TEACHER]), 
  new HomeworkController().getHomeworkAnalytics
);

// GET /api/homework/export - Export data (Teacher / Homeroom Teacher only)
router.get(
  '/export', 
  checkRole([UserRole.TEACHER, UserRole.HOMEROOM_TEACHER]), 
  new HomeworkController().exportHomeworkData
);

export default router;
