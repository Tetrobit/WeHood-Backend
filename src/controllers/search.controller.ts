import { Request, Response } from 'express';
import { Thread } from '@/entities/Thread';
import { AppDataSource } from '@/config/database';

export class SearchController {
    private threadRepository = AppDataSource.getRepository(Thread);;

    async chat(req: Request, res: Response) {
        try {
            const { text, thread_id } = req.body;
            
            let thread: Thread | null;
            
            if (thread_id) {
                thread = await this.threadRepository.findOne({ where: { id: thread_id } });
                if (!thread) {
                    return res.status(404).json({ message: 'Тред не найден' });
                }
            } else {
                thread = this.threadRepository.create();
                thread.messages = [];
            }

            // Добавляем сообщение пользователя
            thread.messages.push({
                role: 'user',
                content: text,
                timestamp: new Date()
            });

            // Добавляем ответ ассистента (пока просто эхо)
            const assistantResponse = text;
            thread.messages.push({
                role: 'assistant',
                content: assistantResponse,
                timestamp: new Date()
            });

            // Сохраняем обновленный тред
            await this.threadRepository.save(thread);

            const responseBody = {
                thread_id: thread.id,
                message: {
                    content: assistantResponse
                }
            };

            return res.status(200).json(responseBody);
        } catch (error) {
            console.error('Ошибка при обработке сообщения:', error);
            return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
        }
    }
}
