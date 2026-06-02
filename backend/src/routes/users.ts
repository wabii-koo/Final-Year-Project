import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getProfile, updateProfile } from '../controllers/userController';

const router = Router();

router.use(authenticateToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Placeholder routes - to be implemented
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: { users: [] },
    timestamp: new Date().toISOString(),
  });
});

export default router;
