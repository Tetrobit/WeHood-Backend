import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";

declare global {
  namespace Express {
    interface Request {
      verified: boolean;
      user?: User;
    }
  }
}

export interface JwtPayload {
  id: string;
  device_login_id: string;
  iat: number;
}

export const softAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) throw new Error("No token provided");

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as JwtPayload;
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.id } });

    if (!user) throw new Error("User not found");

    req.verified = true;
    req.user = user;
  } catch (error) {
    req.verified = false;
    req.user = undefined;
  } finally {
    return next();
  }
};
