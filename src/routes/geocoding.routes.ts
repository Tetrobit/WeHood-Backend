import { Router } from 'express';
import { GeocodingController } from '../controllers/geocoding.controller';
import { authGuard } from '../guards/auth.guard';

const router = Router();
const geocodingController = new GeocodingController();

router.get('/forward', geocodingController.forwardGeocode);
router.get('/reverse', geocodingController.reverseGeocode);
router.get('/ip', geocodingController.getLocationByIp);

router.use([authGuard]);

export default router; 
