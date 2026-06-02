import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { EventController } from '../controllers/eventController';

const router = Router();
const eventController = new EventController();

router.use(authenticateToken);

router.get('/', eventController.getEvents.bind(eventController));
router.post('/', eventController.createEvent.bind(eventController));
router.put('/:id', eventController.updateEvent.bind(eventController));
router.delete('/:id', eventController.deleteEvent.bind(eventController));

export default router;
