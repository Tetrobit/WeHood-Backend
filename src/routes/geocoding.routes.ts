import { Router } from 'express';
import { GeocodingController } from '../controllers/geocoding.controller';
import { softAuthMiddleware } from '../middleware/auth.middleware';
import { authGuard } from '../guards/auth.guard';

const router = Router();
const geocodingController = new GeocodingController();

router.get('/forward', geocodingController.forwardGeocode);
router.get('/reverse', geocodingController.reverseGeocode);

router.use([softAuthMiddleware, authGuard]);

export default router; 
