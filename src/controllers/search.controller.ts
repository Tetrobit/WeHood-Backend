import { Request, Response } from 'express';
import { Thread } from '@/entities/Thread';
import { AppDataSource } from '@/config/database';
import { search } from '@/agents/search';
import { textToSpeech } from './speech.controller';

export class SearchController {
    private threadRepository = AppDataSource.getRepository(Thread);;

    async chat(req: Request, res: Response) {
        try {
            const { text, thread_id, context } = req.body;
            
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

            // Добавляем ответ ассистента
            const { messages, response, audio_support, commands } = await search(thread.messages, text, thread_id, context);
            thread.messages = messages;

            // Сохраняем обновленный тред
            await this.threadRepository.save(thread);

            const audio_id = await textToSpeech(audio_support, true);

            const responseBody = {
                thread_id: thread.id,
                message: response,
                audio_id,
                commands
            };

            return res.status(200).json(responseBody);
        } catch (error) {
            console.error('Ошибка при обработке сообщения:', error);
            return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
        }
    }
}
