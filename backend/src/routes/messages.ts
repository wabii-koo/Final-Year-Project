import { Router } from 'express';
import { MessageController } from '../controllers/messageController';
import { validate, schemas } from '../middleware/validation';
import { authenticateToken, checkPermission } from '../middleware/auth';

const router = Router();
const messageController = new MessageController();

// All message routes require authentication
router.use(authenticateToken);

router.get('/', messageController.getMessages);
router.get('/conversations', messageController.getConversations);
router.post('/', validate(schemas.message), messageController.sendMessage);
router.put('/conversations/:partnerId/read', messageController.markConversationRead.bind(messageController));
router.put('/:id/read', messageController.markAsRead);
router.delete('/:id', messageController.deleteMessage);
//router.delete('/:id', messageController.deleteMessage);

export default router;
