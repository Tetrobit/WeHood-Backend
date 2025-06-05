import { checkComment } from '@/agents/check_comment';
import { NearbyService } from '../services/nearby.service';
import { Request, Response } from 'express';
import { summarizeComments } from '@/agents/summ_comments';


export class NearbyController {
    private nearbyService: NearbyService;

    constructor() {
        this.nearbyService = new NearbyService();
    }

    async createPost(req: Request, res: Response) {
        try {
            const user = req.user!;
            const { title, description, latitude, longitude, type, fileId, address } = req.body;

            const post = await this.nearbyService.createPost(user, {
                title,
                description,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                fileId: fileId,
                type: type as 'image' | 'video',
                address
            });

            return res.json(post);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async getNearbyPosts(req: Request, res: Response) {
        try {
            const { latitude, longitude, radius } = req.query;
            const user = req.user;
            
            const posts = await this.nearbyService.getNearbyPosts(
                parseFloat(latitude as string),
                parseFloat(longitude as string),
                parseFloat(radius as string) || 1000,
                user,
                req.query.type as 'image' | 'video'
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

            const verdict = await checkComment(text);

            if (!verdict?.ok) {
                return res.status(400).json({
                    ok: false,
                    reason: verdict?.reason,
                    toxicity_score: verdict?.toxicity_score
                });
            }

            const comment = await this.nearbyService.addComment(
                user!,
                parseInt(postId),
                text
            );

            return res.json({
                ok: true,
                ...comment,
            });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async toggleLike(req: Request, res: Response) {
        try {
            const user = req.user!;
            const { postId } = req.params;

            const result = await this.nearbyService.toggleLike(
                user!,
                parseInt(postId)
            );

            return res.json(result);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async incrementViews(req: Request, res: Response) {
        try {
            const { postId } = req.params;
            const user = req.user;
            const result = await this.nearbyService.incrementViews(parseInt(postId), user);
            return res.json(result);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async getComments(req: Request, res: Response) {
        try {
            const { postId } = req.params;
            const comments = await this.nearbyService.getComments(parseInt(postId));
            return res.json(comments);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async deletePost(req: Request, res: Response) {
        try {
            const user = req.user!;
            const postId = parseInt(req.params.postId);

            const post = await this.nearbyService.deletePost(postId, user.id);
            return res.json(post);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async deleteComment(req: Request, res: Response) {
        try {
            const user = req.user!;
            const commentId = parseInt(req.params.commentId);

            const comment = await this.nearbyService.deleteComment(commentId, user.id);
            return res.json(comment);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async summarizeComments(req: Request, res: Response) {
        try {
            const { postId } = req.params;
            const comments = await this.nearbyService.getComments(parseInt(postId));
            const summary = await summarizeComments(comments.map(comment => comment.text));
            return res.json({
                ok: true,
                summary
            });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
} 