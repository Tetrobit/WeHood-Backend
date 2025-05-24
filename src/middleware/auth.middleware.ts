import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";

export interface AuthRequest extends Request {
  verified: boolean;
  user?: User;
}

export interface JwtPayload {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
    vkId: string;
  },
  device: {
    id: string;
  }
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      req.user = undefined;
      req.verified = false;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as JwtPayload;
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: decoded.user.id } });

      if (!user) {
        req.verified = false;
        req.user = undefined;
        return next();
      }

      req.verified = true;
      req.user = user;
    } catch (error) {
      req.verified = false;
      req.user = undefined;
    } finally {
      return next();
    }
  } catch (error) {
    return res.status(401).json({ message: "Неверный токен" });
  }
}; 