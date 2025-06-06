import { Request, Response } from 'express';
import { Poll } from '../entities/Poll';
import { PollVote } from '../entities/PollVote';
import { AppDataSource } from '../config/database';

const pollRepository = AppDataSource.getRepository(Poll);
const pollVoteRepository = AppDataSource.getRepository(PollVote);

export const createPoll = async (req: Request, res: Response) => {
  try {
    const { title, description, options, endDate, image } = req.body;
    const userId = req.user!.id;

    // Проверка обязательных полей
    if (!title || !description || !options || !Array.isArray(options) || options.length === 0) {
      return res.status(400).json({ 
        message: 'Необходимо указать заголовок, описание и хотя бы один вариант ответа' 
      });
    }

    // Проверка длины заголовка
    if (title.length < 3 || title.length > 100) {
      return res.status(400).json({ 
        message: 'Заголовок должен содержать от 3 до 100 символов' 
      });
    }

    // Проверка длины описания
    if (description.length < 0 || description.length > 1000) {
      return res.status(400).json({ 
        message: 'Описание должно содержать от 10 до 1000 символов' 
      });
    }

    // Проверка количества вариантов ответа
    if (options.length < 1 || options.length > 10) {
      return res.status(400).json({ 
        message: 'Количество вариантов ответа должно быть от 2 до 10' 
      });
    }

    // Проверка длины каждого варианта ответа
    for (const option of options) {
      if (typeof option !== 'string' || option.length < 1 || option.length > 100) {
        return res.status(400).json({ 
          message: 'Каждый вариант ответа должен содержать от 1 до 100 символов' 
        });
      }
    }

    // Проверка даты окончания
    if (endDate) {
      const endDateObj = new Date(endDate);
      if (isNaN(endDateObj.getTime()) || endDateObj <= new Date()) {
        return res.status(400).json({ 
          message: 'Дата окончания должна быть в будущем' 
        });
      }
    }

    const poll = new Poll();
    poll.title = title;
    poll.description = description;
    poll.options = options.map((text: string) => ({ text, votes: 0 }));
    poll.createdBy = { id: userId } as any;
    poll.endDate = endDate;
    poll.image = image;

    await pollRepository.save(poll);
    return res.status(201).json(poll);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка при создании голосования' });
  }
};

export const votePoll = async (req: Request, res: Response) => {
  try {
    const { pollId, optionIndex } = req.body;
    const userId = req.user!.id;

    const poll = await pollRepository.findOne({ where: { id: pollId } });
    if (!poll) {
      return res.status(404).json({ message: 'Голосование не найдено' });
    }

    if (!poll.isActive) {
      return res.status(400).json({ message: 'Голосование завершено' });
    }

    if (poll.endDate && new Date() > poll.endDate) {
      poll.isActive = false;
      await pollRepository.save(poll);
      return res.status(400).json({ message: 'Голосование завершено' });
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ message: 'Неверный индекс варианта ответа' });
    }

    // Проверяем, не голосовал ли уже пользователь
    const existingVote = await pollVoteRepository.findOne({
      where: {
        poll: { id: pollId },
        user: { id: userId }
      }
    });

    if (existingVote) {
      return res.status(400).json({ message: 'Вы уже голосовали в этом опросе' });
    }

    // Создаем запись о голосе
    const vote = new PollVote();
    vote.poll = poll;
    vote.user = { id: userId } as any;
    vote.optionIndex = optionIndex;
    await pollVoteRepository.save(vote);

    // Обновляем счетчик голосов
    poll.options[optionIndex].votes += 1;
    await pollRepository.save(poll);

    return res.json(poll);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка при голосовании' });
  }
};

export const getPoll = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const poll = await pollRepository.findOne({ 
      where: { id: Number(id) },
      relations: ['createdBy']
    });
    
    if (!poll) {
      return res.status(404).json({ message: 'Голосование не найдено' });
    }

    // Проверяем, голосовал ли пользователь
    const userVote = await pollVoteRepository.findOne({
      where: {
        poll: { id: Number(id) },
        user: { id: userId }
      }
    });

    const response = {
      ...poll,
      userVoted: !!userVote,
      userVoteOption: userVote?.optionIndex
    };

    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка при получении голосования' });
  }
};

export const getPolls = async (req: Request, res: Response) => {
  try {
    const { offset = 0, limit = 10 } = req.query;

    const [polls, total] = await pollRepository.findAndCount({
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
      skip: Number(offset),
      take: Number(limit)
    });

    return res.json({
      votings: polls,
      total
    });
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка при получении списка голосований' });
  }
}; 