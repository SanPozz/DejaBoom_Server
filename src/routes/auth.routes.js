import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";

import verifyFirebaseToken from "../middlewares/verifyFirebaseToken.middlewaare.js";

const router = Router();

router.post('/register', verifyFirebaseToken, AuthController.register);

router.get('/me', verifyFirebaseToken, AuthController.getCurrentUser);

export default router;