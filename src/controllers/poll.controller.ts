import { Request, Response } from 'express';
import { Poll } from '../entities/Poll';
import { AppDataSource } from '../config/database';

const pollRepository = AppDataSource.getRepository(Poll);

export const createPoll = async (req: Request, res: Response) => {
  try {
    const { title, description, options, endDate } = req.body;
    const userId = req.user!.id;

    const poll = new Poll();
    poll.title = title;
    poll.description = description;
    poll.options = options.map((text: string) => ({ text, votes: 0 }));
    poll.createdBy = { id: userId } as any;
    poll.endDate = endDate;

    await pollRepository.save(poll);
    return res.status(201).json(poll);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка при создании голосования' });
  }
};

export const votePoll = async (req: Request, res: Response) => {
  try {
    const { pollId, optionIndex } = req.body;

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
    const poll = await pollRepository.findOne({ 
      where: { id: Number(id) },
      relations: ['createdBy']
    });
    
    if (!poll) {
      return res.status(404).json({ message: 'Голосование не найдено' });
    }

    return res.json(poll);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка при получении голосования' });
  }
};

export const getPolls = async (req: Request, res: Response) => {
  try {
    const { offset = 0, limit = 10 } = req.query;
    
    const polls = await pollRepository.find({
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
      skip: Number(offset),
      take: Number(limit)
    });

    return res.json(polls);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка при получении списка голосований' });
  }
}; 