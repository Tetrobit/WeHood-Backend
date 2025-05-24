import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

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

export default router; 