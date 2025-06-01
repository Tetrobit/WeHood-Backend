import { Request, Response } from 'express';
import { WeatherService } from '../services/weather.service';

export class WeatherController {
    private weatherService: WeatherService;

    constructor() {
        this.weatherService = new WeatherService();
    }

    getForecast = async (req: Request, res: Response): Promise<void> => {
        try {
            const { latitude, longitude } = req.query;

            if (!latitude || !longitude) {
                res.status(400).json({ error: 'Latitude and longitude are required' });
                return;
            }

            const forecast = await this.weatherService.getForecast(
                Number(latitude),
                Number(longitude)
            );

            res.json(forecast);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch weather data' });
        }
    };
} 