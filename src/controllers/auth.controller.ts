import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";

// @ts-ignore
import pkceChallenge from "pkce-challenge";

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;

      const userRepository = AppDataSource.getRepository(User);
      const existingUser = await userRepository.findOne({ where: { email } });

      if (existingUser) {
        return res.status(400).json({ message: "Пользователь с таким email уже существует" });
      }

      const user = new User();
      user.email = email;
      user.password = password;
      user.firstName = firstName;
      user.lastName = lastName;

      await user.hashPassword();
      await userRepository.save(user);

      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || "secret",
      );

      return res.status(201).json({
        message: "Пользователь успешно зарегистрирован",
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: "Ошибка сервера" });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { email } });

      if (!user) {
        return res.status(401).json({ message: "Неверный email или пароль" });
      }

      const isValidPassword = await user.comparePassword(password);

      if (!isValidPassword) {
        return res.status(401).json({ message: "Неверный email или пароль" });
      }

      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || "secret",
      );

      return res.json({
        message: "Успешный вход",
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: "Ошибка сервера" });
    }
  }

  async getVKLink(_req: Request, res: Response) {
    console.log("getVKLink");
    const vkid_appid = process.env.VKID_APPID;
    const redirect_uri = process.env.SERVER_URL;
    
    const {
      code_verifier: _code_verifier,
      code_challenge,
    } = await pkceChallenge();

    const vkLink = `https://id.vk.com/authorize?client_id=${vkid_appid}&redirect_uri=${redirect_uri}&code_challenge=${code_challenge}&code_challenge_method=S256&response_type=code`;
    return res.json({ vkLink });
  }
} 