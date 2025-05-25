import { Request, Response, NextFunction } from "express";

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
  if (!req.verified) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};
