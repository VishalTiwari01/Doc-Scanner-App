import { Router } from 'express';
import { HistoryController } from '../controller/history.controller';
import { authenticateJWT } from '../../../middlewares/auth';

const router = Router();
const controller = new HistoryController();

// GET /api/v1/history
router.get('/', authenticateJWT, controller.getUserHistory);

// DELETE /api/v1/history/:id
router.delete('/:id', authenticateJWT, controller.deleteHistoryItem);

export default router;
