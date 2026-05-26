import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { HomeworkController } from '../controllers/homeworkController';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// Apply authentication to all homework routes
router.use(authenticateToken);

// GET /api/homework - View homework (role-based filtering)
router.get('/', new HomeworkController().getHomework);

// GET /api/homework/:id - View homework details
router.get('/:id', new HomeworkController().getHomeworkById);

// POST /api/homework - Create homework (Subject Teacher only)
router.post('/', validate(schemas.homework), new HomeworkController().createHomework);

// PUT /api/homework/:id - Edit homework (Subject Teacher, time-limited)
router.put('/:id', new HomeworkController().updateHomework);

// DELETE /api/homework/:id - Delete homework (Subject Teacher, time-limited)
router.delete('/:id', new HomeworkController().deleteHomework);

// POST /api/homework/:id/view - Mark homework as viewed (Guardian only)
router.post('/:id/view', new HomeworkController().viewHomework);

// POST /api/homework/:id/feedback - Add feedback (Guardian only)
router.post('/:id/feedback', validate(schemas.homeworkFeedback), new HomeworkController().addFeedback);

// GET /api/homework/:id/analytics - View analytics (Teacher only)
router.get('/:id/analytics', new HomeworkController().getHomeworkAnalytics);

// GET /api/homework/export - Export data (Teacher only)
router.get('/export', new HomeworkController().exportHomeworkData);

export default router;
