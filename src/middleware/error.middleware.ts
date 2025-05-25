import { NextFunction, Request, Response } from "express";

export const errorMiddleware = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    return res.status(500).json({
        message: "Internal Server Error",
    });
};
