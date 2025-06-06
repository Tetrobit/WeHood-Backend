import { Router } from 'express';
import { createPoll, votePoll, getPoll, getPolls } from '../controllers/poll.controller';
import { softAuthMiddleware } from '../middleware/auth.middleware';
import { authGuard } from '@/guards/auth.guard';

const router = Router();
router.use(softAuthMiddleware, authGuard);
router.post('/', createPoll);
router.post('/vote', votePoll);
router.get('/:id', getPoll);
router.get('/', getPolls);

export default router; 