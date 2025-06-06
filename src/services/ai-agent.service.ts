import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { generateImageAndUpload } from '../agents/generate_image';
import { getFileUrl } from './upload.service';

export async function initializeAIAgent() {
    const userRepository = AppDataSource.getRepository(User);
    const aiAgentId = '00000000-0000-0000-0000-000000000000';

    // Проверяем, существует ли уже ИИ агент
    const existingAgent = await userRepository.findOne({ where: { id: aiAgentId } });
    
    if (!existingAgent) {
        // Создаем нового ИИ агента
        const aiAgent = new User();
        aiAgent.id = aiAgentId;
        aiAgent.email = 'ai-agent@wehood.ru';
        aiAgent.firstName = 'ИИ';
        aiAgent.lastName = 'Агент';
        
        // Генерируем аватар для агента
        const avatarResult = await generateImageAndUpload('Создай аватар для ИИ агента, который будет помогать пользователям. Аватар должен быть в стиле минимализма, с использованием синих и белых оттенков.');
        
        if (avatarResult) {
            aiAgent.avatar = getFileUrl(avatarResult.fileId);
        }
        
        await userRepository.save(aiAgent);
        console.log('ИИ агент успешно создан');
    }
} 