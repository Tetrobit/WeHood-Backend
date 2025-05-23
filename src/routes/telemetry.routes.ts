import { Router } from 'express';
import { TelemetryController } from '../controllers/telemetry.controller';

const router = Router();
const telemetryController = new TelemetryController();

router.post('/', telemetryController.create.bind(telemetryController));
router.get('/', telemetryController.getAll.bind(telemetryController));

export default router; 