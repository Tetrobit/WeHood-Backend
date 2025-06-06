import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { softAuthMiddleware } from '../middleware/auth.middleware';
import { authGuard } from '@/guards/auth.guard';

const router = Router();
const notificationController = new NotificationController();

router.use(softAuthMiddleware, authGuard);

router.get('/',notificationController.getUserNotifications.bind(notificationController));
router.post('/:id/read', notificationController.markAsRead.bind(notificationController));
router.post('/read-all', notificationController.markAllAsRead.bind(notificationController));

export default router; 