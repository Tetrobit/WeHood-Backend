import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";

// @ts-ignore
import pkceChallenge from "pkce-challenge";
import * as vkapi from "@/vkapi";
import { DeviceLogin } from "@/entities/DeviceLogin";
import EmailService from "@/services/email.service";
import { VerificationCode } from "@/entities/VerificationCode";

export class AuthController {
  async sendVerificationCode(req: Request, res: Response) {
    const { email } = req.query;

    const verificationCode = await EmailService.sendVerificationCode(email as string);

    return res.json({
      id: verificationCode.id,
    });
  }

  async register(req: Request, res: Response) {
    try {
      const { firstName, lastName, email, password, verificationCodeId } = req.body;

      const userRepository = AppDataSource.getRepository(User);
      const existingUser = await userRepository.findOne({ where: { email } });

      if (existingUser) {
        return res.status(400).json({ message: "Пользователь с таким email уже существует" });
      }

      const verificationCode = await AppDataSource.getRepository(VerificationCode)
        .findOne({
          where: {
            id: verificationCodeId as string,
            email: email as string,
            isUsed: true
          },
          order: {
            createdAt: 'DESC'
          }
        });

      if (!verificationCode) {
        return res.status(400).json({ message: "Код подтверждения не найден" });
      }

      const user = new User();
      user.email = email;
      user.password = password;
      user.firstName = firstName;
      user.lastName = lastName;

      await user.hashPassword();
      await userRepository.save(user);

      const deviceLogin = new DeviceLogin();
      deviceLogin.deviceName = req.body.device_name as string;
      deviceLogin.deviceOS = req.body.device_os as string;
      deviceLogin.deviceOSVersion = req.body.device_os_version as string;
      deviceLogin.deviceParams = req.body.device_params as Record<string, any>;
      deviceLogin.user = user;

      await AppDataSource.getRepository(DeviceLogin).save(deviceLogin);

      const token = jwt.sign(
        {
          id: user.id,
          device_login_id: deviceLogin.id,
        },
        process.env.JWT_SECRET || "secret",
      );
      

      return res.status(201).json({
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
    } catch (error) {
      return res.status(500).json({ message: "Ошибка сервера" });
    }
  }
  

  async verifyVerificationCode(req: Request, res: Response) {
    const { verificationCodeId: id, email, code } = req.body;
    console.log(req.query);
    const verificationCode = await AppDataSource.getRepository(VerificationCode)
      .findOne({
        where: {
          id: id as string,
          email: email as string,
          isUsed: false
        },
        order: {
          createdAt: 'DESC'
        }
      });
    
    if (!verificationCode || verificationCode.code !== code) {
      return res.status(400).json({ ok: false, message: "Неверный код подтверждения" });
    }

    verificationCode.isUsed = true;
    await AppDataSource.getRepository(VerificationCode).save(verificationCode);
    
    return res.json({ ok: true, message: "Код подтверждения успешно проверен" });
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { email } });

      if (!user) {
        return res.status(401).json({ ok: false, message: "Неверный email или пароль" });
      }

      const isValidPassword = await user.comparePassword(password);

      if (!isValidPassword) {
        return res.status(401).json({ ok: false, message: "Неверный email или пароль" });
      }
      
      const deviceLogin = new DeviceLogin();
      deviceLogin.deviceName = req.body.device_name as string;
      deviceLogin.deviceOS = req.body.device_os as string;
      deviceLogin.deviceOSVersion = req.body.device_os_version as string;
      deviceLogin.deviceParams = req.body.device_params as Record<string, any>;
      deviceLogin.user = user;

      await AppDataSource.getRepository(DeviceLogin).save(deviceLogin);

      const token = jwt.sign(
        {
          id: user.id,
          device_login_id: deviceLogin.id,
        },
        process.env.JWT_SECRET || "secret",
      );
      

      return res.status(200).json({
        ok: true,
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
    } catch (error) {
      return res.status(500).json({ message: "Ошибка сервера" });
    }
  }

  async checkEmailExists(req: Request, res: Response) {
    const { email } = req.query;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email: email as string } });

    return res.json({ exists: !!user, hasPassword: !!user?.password });
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

    const profileInfo = await vkapi.getProfileInfo(accessToken);
    const userInfo = await vkapi.getUserInfo(accessToken);

    const userRepository = AppDataSource.getRepository(User);
    const deviceLoginRepository = AppDataSource.getRepository(DeviceLogin);
    let userByEmail: User | null = await userRepository.findOne({ where: { email: userInfo.user.email } });
    let userByVkId: User | null = await userRepository.findOne({ where: { vkId: data.user_id.toString() } });

    if (!userInfo.user.email || userInfo.user.email.trim() == '') userByEmail = null;

    let user: User | null = null;

    if (!userByVkId && userByEmail) {
      user = userByEmail;
    }
    else if (!userByVkId && !userByEmail) {
      user = new User();
      user.avatar = profileInfo.response.photo_200;
      user.email = userInfo.user.email;
      user.firstName = profileInfo.response.first_name;
      user.lastName = profileInfo.response.last_name;
      user.vkId = data.user_id.toString();
    }
    else {
      user = userByVkId!;
    }

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

  async isTokenValid(_req: Request, res: Response) {
    return res.json({ ok: true });
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const { firstName, lastName, avatar } = req.body;
      const userId = (req as any).user.id;

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (avatar) user.avatar = avatar;

      await userRepository.save(user);

      return res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar
      });
    } catch (error) {
      return res.status(500).json({ message: "Ошибка сервера" });
    }
  }
}