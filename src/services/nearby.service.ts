import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { NearbyPost, NearbyComment, NearbyLike } from '../entities/Nearby';
import { User } from '../entities/User';
import { NotificationService } from './notification.service';
import { PollService } from './poll.service';
import { commentToPoll } from '../agents/comment_to_poll';

export class NearbyService {
    private nearbyPostRepository: Repository<NearbyPost>;
    private nearbyCommentRepository: Repository<NearbyComment>;
    private nearbyLikeRepository: Repository<NearbyLike>;
    private notificationService: NotificationService;
    private pollService: PollService;

    constructor() {
        this.nearbyPostRepository = AppDataSource.getRepository(NearbyPost);
        this.nearbyCommentRepository = AppDataSource.getRepository(NearbyComment);
        this.nearbyLikeRepository = AppDataSource.getRepository(NearbyLike);
        this.notificationService = new NotificationService();
        this.pollService = new PollService();
    }

    async createPost(user: User, data: {
        title: string;
        description?: string;
        latitude: number;
        longitude: number;
        type: 'image' | 'video';
        fileId: string;
        address?: string;
    }): Promise<NearbyPost> {
        const post = this.nearbyPostRepository.create({
            ...data,
            author: user,
            location: {
                type: 'Point',
                coordinates: [data.longitude, data.latitude]
            },
        });

        const savedPost = await this.nearbyPostRepository.save(post);

        return savedPost;
    }
    
    async getNearbyPosts(latitude: number, longitude: number, radius: number, user?: User, type?: 'image' | 'video'): Promise<(NearbyPost & { liked: boolean })[]> {
        const query = this.nearbyPostRepository
        .createQueryBuilder('nearby_posts')
        .innerJoinAndSelect('nearby_posts.author', 'users')
        .leftJoin('nearby_likes', 'likes', 'likes.postId = nearby_posts.id AND likes.userId = :userId', { userId: user?.id || 0 })
        .addSelect('CASE WHEN likes.id IS NOT NULL THEN true ELSE false END', 'nearby_posts_liked')
        .where('ST_DWithin(nearby_posts.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :radius)', {
            lng: longitude,
            lat: latitude,
            radius
        })
        .andWhere('nearby_posts.deleted = :deleted', { deleted: false });

        if (type) {
            query.andWhere('nearby_posts.type = :type', { type });
        }

        const posts = await query.getMany();
        return posts.map(post => ({
            ...post,
            liked: (post as any).nearby_posts_liked || false
        }));
    }

    async addComment(user: User, postId: number, text: string): Promise<NearbyComment> {
        const post = await this.nearbyPostRepository.findOne({ where: { id: postId } });
        if (!post) throw new Error('Post not found');

        const comment = this.nearbyCommentRepository.create({
            text,
            author: user,
            post
        });

        const savedComment = await this.nearbyCommentRepository.save(comment);
        this.checkForCreatePoll(savedComment.post.id);
        return savedComment;
    }
    
    async checkForCreatePoll(postId: number) {
        const post = await this.nearbyPostRepository.findOne({ where: { id: postId } });

        if (!post) return;
        if (post.poll) return;

        // Проверяем последние 30 комментариев для создания голосования
        const recentComments = await this.nearbyCommentRepository.find({
            where: { post: { id: postId }, deleted: false },
            order: { createdAt: 'DESC' },
            take: 30
        });

        if (recentComments.length < 3) return;

        const pollResult = await commentToPoll(recentComments.map(c => c.text));
        
        if (!pollResult?.shouldCreatePoll || !pollResult.poll) return;

        try {
            await this.pollService.createPollBasedOnPost(post, pollResult.poll);
        } catch (error) {
            console.error('Error creating poll:', error);
        }
    }

    async toggleLike(user: User, postId: number): Promise<{ views: number, liked: boolean, likes: number }> {
        const post = await this.nearbyPostRepository.findOne({ 
            where: { id: postId },
            relations: ['author']
        });
        if (!post) throw new Error('Post not found');

        const existingLike = await this.nearbyLikeRepository.findOne({
            where: { user: { id: user.id }, post: { id: postId } }
        });

        if (existingLike) {
            await this.nearbyLikeRepository.remove(existingLike);
            post.likes--;
            await this.nearbyPostRepository.save(post);
            return { views: post.views, liked: false, likes: post.likes };
        } else {
            const like = this.nearbyLikeRepository.create({
                user,
                post
            });
            await this.nearbyLikeRepository.save(like);
            post.likes++;
            await this.nearbyPostRepository.save(post);

            // Отправляем уведомление автору поста
            if (post.author.id !== user.id) {
                const authorName = `${user.firstName} ${user.lastName}`.trim();
                await this.notificationService.createNotification(
                    post.author.id,
                    'Новый лайк',
                    `${authorName} поставил(а) лайк вашему посту ${post.title ? `"${post.title}"` : 'Без названия'}`,
                    'nearby_like',
                    { postId: post.id, userId: user.id }
                );

                // Отправляем push-уведомление
                try {
                    await this.notificationService.sendPushNotification(
                        post.author.id,
                        'Новый лайк',
                        `${authorName} поставил(а) лайк вашему посту ${post.title ? `"${post.title}"` : 'Без названия'}`,
                        { type: 'like', postId: post.id, userId: user.id }
                    );
                } catch (error) {
                    console.error('Error sending push notification:', error);
                }
            }

            return { views: post.views, liked: true, likes: post.likes };
        }
    }

    async incrementViews(postId: number, user?: User): Promise<{ views: number, likes: number, liked: boolean }> {
        const post = await this.nearbyPostRepository.findOne({ where: { id: postId } });
        if (!post) throw new Error('Post not found');

        post.views++;
        await this.nearbyPostRepository.save(post);

        let liked = false;
        if (user) {
            const existingLike = await this.nearbyLikeRepository.findOne({
                where: { user: { id: user.id }, post: { id: postId } }
            });
            liked = !!existingLike;
        }

        return { views: post.views, likes: post.likes, liked };
    }

    async getComments(postId: number): Promise<NearbyComment[]> {
        const post = await this.nearbyPostRepository.findOne({ where: { id: postId } });
        if (!post) throw new Error('Post not found');

        return this.nearbyCommentRepository.find({
            where: { post: { id: postId }, deleted: false },
            relations: ['author'],
            order: { createdAt: 'DESC' }
        });
    }

    async deletePost(postId: number, userId: string): Promise<NearbyPost> {
        const post = await this.nearbyPostRepository.findOne({ 
            where: { id: postId },
            relations: ['author']
        });
        
        if (!post) throw new Error('Post not found');
        if (post.author.id !== userId) throw new Error('Not authorized to delete this post');

        post.deleted = true;
        return await this.nearbyPostRepository.save(post);
    }

    async deleteComment(commentId: number, userId: string): Promise<NearbyComment> {
        const comment = await this.nearbyCommentRepository.findOne({ 
            where: { id: commentId },
            relations: ['author', 'post'],
        });
        
        if (!comment) throw new Error('Comment not found');
        if (comment.author.id !== userId) throw new Error('Not authorized to delete this comment');

        comment.deleted = true;
        return await this.nearbyCommentRepository.save(comment);
    }
}
