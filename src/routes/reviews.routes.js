import { Router } from "express";

import ReviewsController from "../controllers/reviews.controller.js";

import checkRole from "../middlewares/checkRole.middleware.js";
import verifyFirebaseToken from "../middlewares/verifyFirebaseToken.middlewaare.js";
import loadUser from "../middlewares/loadUser.middleware.js";

const router = Router();

router.post('/create', verifyFirebaseToken, loadUser, checkRole('USER'), ReviewsController.create);

export default router;