import { Router } from 'express';
import { NearbyController } from '../controllers/nearby.controller';
import { authGuard } from '../guards/auth.guard';

const router = Router();
const nearbyController = new NearbyController();

// Создание поста с медиафайлами
router.post(
    '/posts',
    authGuard,
    nearbyController.createPost.bind(nearbyController)
);

// Получение постов поблизости
router.get(
    '/posts',
    authGuard,
    nearbyController.getNearbyPosts.bind(nearbyController)
);

// Добавление комментария
router.post(
    '/posts/:postId/comments',
    authGuard,
    nearbyController.addComment.bind(nearbyController)
);

// Лайк/анлайк поста
router.post(
    '/posts/:postId/like',
    authGuard,
    nearbyController.toggleLike.bind(nearbyController)
);

// Увеличение счетчика просмотров
router.post(
    '/posts/:postId/view',
    authGuard,
    nearbyController.incrementViews.bind(nearbyController)
);

// Получение комментариев к посту
router.get(
    '/posts/:postId/comments',
    authGuard,
    nearbyController.getComments.bind(nearbyController)
);

// Удаление поста
router.delete(
    '/posts/:postId',
    authGuard,
    nearbyController.deletePost.bind(nearbyController)
);

// Удаление комментария
router.delete(
    '/comments/:commentId',
    authGuard,
    nearbyController.deleteComment.bind(nearbyController)
);

router.get(
    '/posts/:postId/comments/summarize',
    authGuard,
    nearbyController.summarizeComments.bind(nearbyController)
);

export default router; 