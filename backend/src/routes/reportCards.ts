import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { ReportCardController } from '../controllers/reportCardController';

const router = Router();
const controller = new ReportCardController();

router.use(authenticateToken);

router.get('/', (req, res) => controller.getReportCards(req, res));
router.post('/', (req, res) => controller.createReportCard(req, res));
router.put('/:id', (req, res) => controller.updateReportCard(req, res));
router.put('/:id/approve', (req, res) => controller.approveReportCard(req, res));
router.put('/:id/reject', (req, res) => controller.rejectReportCard(req, res));
router.put('/:id/unlock', (req, res) => controller.unlockReportCard(req, res));

export default router;
