import { NearbyService } from '../services/nearby.service';
import { Request, Response } from 'express';


export class NearbyController {
    private nearbyService: NearbyService;

    constructor() {
        this.nearbyService = new NearbyService();
    }

    async createPost(req: Request, res: Response) {
        try {
            const user = req.user!;
            const { title, description, latitude, longitude, type, fileId } = req.body;

            const post = await this.nearbyService.createPost(user, {
                title,
                description,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                fileId: fileId,
                type: type as 'image' | 'video'
            });

            return res.json(post);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async getNearbyPosts(req: Request, res: Response) {
        try {
            const { latitude, longitude, radius } = req.query;
            
            const posts = await this.nearbyService.getNearbyPosts(
                parseFloat(latitude as string),
                parseFloat(longitude as string),
                parseFloat(radius as string) || 1000
            );

            return res.json(posts);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async addComment(req: Request, res: Response) {
        try {
            const user = req.user!;
            const { postId } = req.params;
            const { text } = req.body;

            const comment = await this.nearbyService.addComment(
                user!,
                parseInt(postId),
                text
            );

            return res.json(comment);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async toggleLike(req: Request, res: Response) {
        try {
            const user = req.user!;
            const { postId } = req.params;

            const isLiked = await this.nearbyService.toggleLike(
                user!,
                parseInt(postId)
            );

            return res.json({ isLiked });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async incrementViews(req: Request, res: Response) {
        try {
            const { postId } = req.params;
            await this.nearbyService.incrementViews(parseInt(postId));
            return res.json({ success: true });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
} 