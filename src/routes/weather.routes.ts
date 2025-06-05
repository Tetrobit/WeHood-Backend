import { Router } from 'express';
import { WeatherController } from '../controllers/weather.controller';
import { softAuthMiddleware } from '../middleware/auth.middleware';
import { authGuard } from '@/guards/auth.guard';

const router = Router();
const weatherController = new WeatherController();

router.get('/forecast', weatherController.getForecast);
router.post('/ai-recommendation',
    softAuthMiddleware,
    authGuard,
    weatherController.getClothingRecommendation);

export default router; 