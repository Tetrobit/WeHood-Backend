import { Router } from "express";
import { UtilsController } from "../controllers/utils.controller";

const router = Router();
const utilsController = new UtilsController();

router.get("/query-params", utilsController.getQueryParams);

export default router; 