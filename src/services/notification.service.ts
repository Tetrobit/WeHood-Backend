import { AppDataSource } from '../config/database';
import { Notification } from '../entities/Notification';
import { User } from '../entities/User';
import { DeviceLogin } from '../entities/DeviceLogin';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import { Not, IsNull } from 'typeorm';

const notificationRepository = AppDataSource.getRepository(Notification);
const userRepository = AppDataSource.getRepository(User);
const deviceLoginRepository = AppDataSource.getRepository(DeviceLogin);

// Инициализация Firebase Admin SDK
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
  : undefined;

if (!serviceAccount) {
  console.warn('Firebase service account not found. Push notifications will be disabled.');
} else {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as ServiceAccount),
  });
}

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

  async sendPushNotification(userId: string, title: string, body: string, data?: any): Promise<void> {
    const deviceLogins = await deviceLoginRepository.find({
      where: { 
        user: { id: userId },
        fcmToken: Not(IsNull())
      }
    });

    if (deviceLogins.length === 0) {
      throw new Error('No FCM tokens found for user');
    }

    const messages: admin.messaging.Message[] = deviceLogins.map(device => ({
      token: device.fcmToken!,
      notification: {
        title,
        body,
      },
      data: data ? Object.entries(data).reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as { [key: string]: string }) : undefined,
    }));

    for (const message of messages) {
      try {
        await admin.messaging().send(message);
      } catch (error) {
        console.error('Error sending push notification:', error);
        // Продолжаем отправку другим устройствам даже если одно не удалось
        continue;
      }
    }
  }

  async updateDeviceFCMToken(deviceId: string, fcmToken: string): Promise<void> {
    const device = await deviceLoginRepository.findOne({ where: { id: deviceId } });
    if (!device) {
      throw new Error('Device not found');
    }

    device.fcmToken = fcmToken;
    await deviceLoginRepository.save(device);
  }

  async sendNotificationToAllUsers(title: string, body: string, data?: any): Promise<void> {
    const deviceLogins = await deviceLoginRepository.find({
      where: { fcmToken: Not(IsNull()) }
    });
    
    for (const device of deviceLogins) {
      try {
        const message: admin.messaging.Message = {
          token: device.fcmToken!,
          notification: {
            title,
            body,
          },
          data: data ? Object.entries(data).reduce((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          }, {} as { [key: string]: string }) : undefined,
        };

        await admin.messaging().send(message);
      } catch (error) {
        console.error(`Error sending push notification to device ${device.id}:`, error);
        // Продолжаем отправку другим устройствам даже если одно не удалось
        continue;
      }
    }
  }
} 