import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";

// @ts-ignore
import pkceChallenge from "pkce-challenge";
import * as vkapi from "@/vkapi";
import { DeviceLogin } from "@/entities/DeviceLogin";

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

  async checkEmailExists(req: Request, res: Response) {
    const { email } = req.body;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    return res.json({ exists: !!user });
  }

  async getVKParameters(_req: Request, res: Response) {
    const vkAppId = process.env.VKID_APPID;
    const redirectUri = `${process.env.SERVER_URL}/api/auth/redirect-app`;

    return res.json({ vkAppId, redirectUri, ...(await pkceChallenge()), scope: process.env.VKID_SCOPE });
  }

  async redirectApp(req: Request, res: Response) {
    const params = new URLSearchParams(req.query as Record<string, string>);
    const deeplink = `wehood://auth?${params.toString()}`;

    res.render('auth-redirect', { deeplink });
  }

  async loginVK(req: Request, res: Response) {
    const { code, code_verifier, device_id, state } = req.body;

    const data = await vkapi.exchangeCode(code as string, code_verifier as string, device_id as string, state as string);
    const accessToken: string = data.access_token;
    const refreshToken: string = data.refresh_token;

    const userRepository = AppDataSource.getRepository(User);
    const deviceLoginRepository = AppDataSource.getRepository(DeviceLogin);
    let user = await userRepository.findOne({ where: { vkId: data.user_id.toString() } });

    const profileInfo = await vkapi.getProfileInfo(accessToken);
    const userInfo = await vkapi.getUserInfo(accessToken);

    if (!user) {
      user = new User();
    }

    user.vkId = data.user_id.toString();
    user.email = userInfo.user.email;
    user.firstName = profileInfo.response.first_name;
    user.lastName = profileInfo.response.last_name;
    user.avatar = profileInfo.response.photo_200;
    user = await userRepository.save(user);

    const deviceLogin = new DeviceLogin();
    deviceLogin.deviceName = req.body.device_name as string;
    deviceLogin.deviceOS = req.body.device_os as string;
    deviceLogin.deviceOSVersion = req.body.device_os_version as string;
    deviceLogin.deviceParams = req.body.device_params as Record<string, any>;
    deviceLogin.refreshToken = refreshToken;
    deviceLogin.accessToken = accessToken;
    deviceLogin.refreshTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180);
    deviceLogin.accessTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60);
    deviceLogin.user = user!;

    await deviceLoginRepository.save(deviceLogin);

    const token = jwt.sign(
      {
        id: user.id,
        device_login_id: deviceLogin.id,
      },
      process.env.JWT_SECRET || "secret",
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        vkId: user.vkId,
      },
      device: {
        id: deviceLogin.id,
      }
    });
  }
}