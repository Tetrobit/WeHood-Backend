import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Poll } from '../entities/Poll';
import { User } from '../entities/User';
import { NearbyPost } from '../entities/Nearby';
import { generateImageAndUpload } from '../agents/generate_image';
import { NotificationService } from './notification.service';

export class PollService {
    private pollRepository: Repository<Poll>;
    private notificationService: NotificationService;
    constructor() {
        this.pollRepository = AppDataSource.getRepository(Poll);
        this.notificationService = new NotificationService();
    }

    async createPollBasedOnPost(post: NearbyPost, data: {
        title: string;
        description: string;
        options: string[];
        image: string;
    }): Promise<void> {
        // Получить автора поста, при этом в post.author будет undefined
        const postAuthor = await AppDataSource.getRepository(NearbyPost).findOne({ where: { id: post.id }, relations: ['author'] });
        if (!postAuthor) throw new Error('Post not found');
        
        // Проверяем, нет ли уже голосования для этого поста
        const existingPoll = await this.pollRepository.findOne({
            where: { post: { id: post.id } }
        });

        if (existingPoll) {
            throw new Error('Голосование для этого поста уже существует');
        }

        // Генерируем изображение для голосования
        const imageResult = await generateImageAndUpload(data.image);
        if (!imageResult) {
            throw new Error('Не удалось сгенерировать изображение для голосования');
        }

        const aiAgent = await AppDataSource.getRepository(User).findOne({ where: { id: '00000000-0000-0000-0000-000000000000' } });

        const poll = this.pollRepository.create({
            ...data,
            image: imageResult.fileId,
            createdBy: aiAgent!,
            post,
            options: data.options.map(text => ({ text, votes: 0 }))
        });

        await this.pollRepository.save(poll);

        // Отправить уведомление автору поста
        await this.notificationService.createNotification(
            postAuthor.author.id,
            'Новое голосование',
            `На основе комментариев пользователей создано голосование ${poll.title ? `"${poll.title}"` : 'Без названия'}`,
            'nearby_poll',
            {
                pollId: poll.id,
                postId: post.id,
            }
        );

        await this.notificationService.sendPushNotification(
            postAuthor.author.id,
            'Новое голосование',
            `На основе комментариев пользователей создано голосование ${poll.title ? `"${poll.title}"` : 'Без названия'}`,
            {
                pollId: poll.id,
                postId: post.id,
            }
        );
    }
} 