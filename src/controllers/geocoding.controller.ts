import { Request, Response } from 'express';
import { GeocodingService } from '../services/geocoding.service';

export class GeocodingController {
    private geocodingService: GeocodingService;

    constructor() {
        this.geocodingService = new GeocodingService();
    }

    forwardGeocode = async (req: Request, res: Response) => {
        try {
            const { address } = req.query;
            
            if (!address || typeof address !== 'string') {
                return res.status(400).json({ error: 'Необходимо указать адрес' });
            }

            const result = await this.geocodingService.forwardGeocode(address);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ error: error instanceof Error ? error.message : 'Внутренняя ошибка сервера' });
        }
    };

    reverseGeocode = async (req: Request, res: Response) => {
        try {
            const { latitude, longitude } = req.query;
            
            if (!latitude || !longitude || 
                isNaN(Number(latitude)) || isNaN(Number(longitude))) {
                return res.status(400).json({ error: 'Необходимо указать корректные координаты' });
            }

            const result = await this.geocodingService.reverseGeocode(
                Number(latitude),
                Number(longitude)
            );
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ error: error instanceof Error ? error.message : 'Внутренняя ошибка сервера' });
        }
    };

    getLocationByIp = async (req: Request, res: Response) => {
        try {
            const ip = req.headers['x-forwarded-for'] as string;
            console.log(ip);
            
            if (!ip || typeof ip !== 'string') {
                return res.status(400).json({ error: 'Необходимо указать IP-адрес' });
            }

            const result = await this.geocodingService.getLocationByIp(ip);
            console.log(result);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ error: error instanceof Error ? error.message : 'Внутренняя ошибка сервера' });
        }
    };
}
