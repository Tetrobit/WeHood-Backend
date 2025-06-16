import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';

const router = Router();
const searchController = new SearchController();

router.post('/chat', searchController.chat.bind(searchController));

export default router; 