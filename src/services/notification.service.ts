import { AppDataSource } from '../config/database';
import { Notification } from '../entities/Notification';
import { User } from '../entities/User';

const notificationRepository = AppDataSource.getRepository(Notification);
const userRepository = AppDataSource.getRepository(User);

export class NotificationService {

  async createNotification(userId: string, title: string, message: string, type?: string, data?: any): Promise<Notification> {
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const notification = notificationRepository.create({
      user: user,
      title,
      message,
      type,
      data: data ? JSON.stringify(data) : undefined,
    });

    return await notificationRepository.save(notification);
  }

  async getUserNotifications(userId: string, page: number = 1, limit: number = 20): Promise<{ notifications: Notification[]; total: number }> {
    const [notifications, total] = await notificationRepository.findAndCount({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { notifications, total };
  }

  async markAsRead(notificationId: number, userId: string): Promise<Notification> {
    const notification = await notificationRepository.findOne({
      where: { id: notificationId, user: { id: userId } },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    return await notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await notificationRepository.update(
      { user: { id: userId }, isRead: false },
      { isRead: true }
    );
  }
} 