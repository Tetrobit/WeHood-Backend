import { Router } from 'express';
import { WeatherController } from '../controllers/weather.controller';

const router = Router();
const weatherController = new WeatherController();

router.get('/forecast', weatherController.getForecast);

export default router; 