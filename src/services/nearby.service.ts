import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { NearbyPost, NearbyComment, NearbyLike } from '../entities/Nearby';
import { User } from '../entities/User';

export class NearbyService {
    private nearbyPostRepository: Repository<NearbyPost>;
    private nearbyCommentRepository: Repository<NearbyComment>;
    private nearbyLikeRepository: Repository<NearbyLike>;

    constructor() {
        this.nearbyPostRepository = AppDataSource.getRepository(NearbyPost);
        this.nearbyCommentRepository = AppDataSource.getRepository(NearbyComment);
        this.nearbyLikeRepository = AppDataSource.getRepository(NearbyLike);
    }

    async createPost(user: User, data: {
        title: string;
        description?: string;
        latitude: number;
        longitude: number;
        type: 'image' | 'video';
        fileId: string;
    }): Promise<NearbyPost> {
        const post = this.nearbyPostRepository.create({
            ...data,
            author: user,
            location: {
                type: 'Point',
                coordinates: [data.longitude, data.latitude]
            }
        });

        const savedPost = await this.nearbyPostRepository.save(post);

        return savedPost;
    }
    
    async getNearbyPosts(latitude: number, longitude: number, radius: number, type?: 'image' | 'video'): Promise<NearbyPost[]> {
        const query = this.nearbyPostRepository
        .createQueryBuilder('nearby_posts')
        .innerJoinAndSelect('nearby_posts.author', 'users')
        .where('ST_DWithin(nearby_posts.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :radius)', {
            lng: longitude,
            lat: latitude,
            radius
        });

        if (type) {
            query.andWhere('nearby_posts.type = :type', { type });
        }

        return query.getMany();
    }

    async addComment(user: User, postId: number, text: string): Promise<NearbyComment> {
        const post = await this.nearbyPostRepository.findOne({ where: { id: postId } });
        if (!post) throw new Error('Post not found');

        const comment = this.nearbyCommentRepository.create({
            text,
            author: user,
            post
        });

        return this.nearbyCommentRepository.save(comment);
    }

    async toggleLike(user: User, postId: number): Promise<boolean> {
        const post = await this.nearbyPostRepository.findOne({ where: { id: postId } });
        if (!post) throw new Error('Post not found');

        const existingLike = await this.nearbyLikeRepository.findOne({
            where: { user: { id: user.id }, post: { id: postId } }
        });

        if (existingLike) {
            await this.nearbyLikeRepository.remove(existingLike);
            post.likes--;
            await this.nearbyPostRepository.save(post);
            return false;
        } else {
            const like = this.nearbyLikeRepository.create({
                user,
                post
            });
            await this.nearbyLikeRepository.save(like);
            post.likes++;
            await this.nearbyPostRepository.save(post);
            return true;
        }
    }

    async incrementViews(postId: number): Promise<void> {
        const post = await this.nearbyPostRepository.findOne({ where: { id: postId } });
        if (!post) throw new Error('Post not found');

        post.views++;
        await this.nearbyPostRepository.save(post);
    }
}
