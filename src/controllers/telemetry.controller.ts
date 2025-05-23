import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Telemetry } from '../entities/Telemetry';

const telemetryRepository = AppDataSource.getRepository(Telemetry);

export class TelemetryController {
    async create(req: Request, res: Response) {
        try {
            const telemetry = telemetryRepository.create(req.body);
            const result = await telemetryRepository.save(telemetry);
            return res.status(201).json(result);
        } catch (error) {
            console.error('Ошибка при создании телеметрии:', error);
            return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const { page = 1, limit = 10, eventType, userId, deviceId } = req.query;
            
            const queryBuilder = telemetryRepository.createQueryBuilder('telemetry');
            
            if (eventType) {
                queryBuilder.andWhere('telemetry.eventType = :eventType', { eventType });
            }
            
            if (userId) {
                queryBuilder.andWhere('telemetry.userId = :userId', { userId });
            }
            
            if (deviceId) {
                queryBuilder.andWhere('telemetry.deviceId = :deviceId', { deviceId });
            }
            
            const [data, total] = await queryBuilder
                .skip((Number(page) - 1) * Number(limit))
                .take(Number(limit))
                .orderBy('telemetry.timestamp', 'DESC')
                .getManyAndCount();

            return res.json({
                data,
                total,
                page: Number(page),
                totalPages: Math.ceil(total / Number(limit))
            });
        } catch (error) {
            console.error('Ошибка при получении телеметрии:', error);
            return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
        }
    }
} 