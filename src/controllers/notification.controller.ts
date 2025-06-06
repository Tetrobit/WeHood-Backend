import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Notification } from '../entities/Notification';  

const notificationRepository = AppDataSource.getRepository(Notification);

export class NotificationController {

  async getUserNotifications(req: Request, res: Response) {
    const { offset = 0, limit = 20, userId } = req.query;

    const queryBuilder = notificationRepository.createQueryBuilder('notification');

    if (userId) {
      queryBuilder.andWhere('notification.user.id = :userId', { userId });
    }

    const notifications = await queryBuilder.skip(Number(offset)).take(Number(limit)).getMany();
    return res.status(200).json(notifications);
  }

  async markAsRead(req: Request, res: Response) {
    const { id } = req.params;
    const { userId } = req.body;

    const notification = await notificationRepository.findOne({ where: { id: Number(id), user: { id: userId } } });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    const result = await notificationRepository.save(notification);
    return res.status(200).json(result);
  }

  async markAllAsRead(req: Request, res: Response) {
    const { userId } = req.body;

    const notifications = await notificationRepository.find({ where: { user: { id: userId } } });

    notifications.forEach(notification => {
      notification.isRead = true;
    });

    const result = await notificationRepository.save(notifications);
    return res.status(200).json(result);
  }
} 