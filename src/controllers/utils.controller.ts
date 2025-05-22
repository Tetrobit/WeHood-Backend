import { Request, Response } from "express";

export class UtilsController {
    async getQueryParams(req: Request, res: Response) {
        const params = new URLSearchParams(req.query as Record<string, string>);
        return res.json(Object.fromEntries(params.entries()));
    }
}
