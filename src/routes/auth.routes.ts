import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { softAuthMiddleware } from "@/middleware/auth.middleware";

const router = Router();
const authController = new AuthController();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/vk-parameters", authController.getVKParameters);
router.get("/redirect-app", authController.redirectApp);
router.post("/login-vk", authController.loginVK);
router.get("/check-email-exists", authController.checkEmailExists);
router.get("/send-verification-code", authController.sendVerificationCode);
router.post("/verify-verification-code", authController.verifyVerificationCode);
router.get("/is-token-valid", authController.isTokenValid);

router.use([softAuthMiddleware]);

export default router; 