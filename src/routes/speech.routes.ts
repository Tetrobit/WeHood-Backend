import { Router } from 'express';
import { SpeechController } from '../controllers/speech.controller';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const router = Router();
const speechController = new SpeechController();


// Настройка хранилища для multer
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const fileId = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, `${fileId}${ext}`);
    }
  });
  
// Фильтр файлов
const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['audio/mpeg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Неподдерживаемый тип файла'));
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    }
});
  

router.post('/recognize', upload.single('file'), speechController.recognize.bind(speechController));
router.post('/synthesize', speechController.synthesize.bind(speechController));

export default router; 