import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Poll } from '../entities/Poll';
import { User } from '../entities/User';
import { NearbyPost } from '../entities/Nearby';
import { generateImageAndUpload } from '../agents/generate_image';

export class PollService {
    private pollRepository: Repository<Poll>;

    constructor() {
        this.pollRepository = AppDataSource.getRepository(Poll);
    }

    async createPollBasedOnPost(post: NearbyPost, data: {
        title: string;
        description: string;
        options: string[];
        image: string;
    }): Promise<Poll> {
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

        return await this.pollRepository.save(poll);
    }
} 