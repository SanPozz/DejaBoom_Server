import { Router } from "express";
import UsersController from "../controllers/users.controller.js";
import verifyFirebaseToken from "../middlewares/verifyFirebaseToken.middlewaare.js";
import loadUser from "../middlewares/loadUser.middleware.js";
import checkRole from "../middlewares/checkRole.middleware.js";

const router = Router();

router.get("/:nickname/profile", verifyFirebaseToken, loadUser, checkRole(['USER', 'ADMIN']), UsersController.getProfile);

router.patch("/me", verifyFirebaseToken, loadUser, checkRole(['USER', 'ADMIN']), UsersController.updateMe);
router.patch("/me/favorites", verifyFirebaseToken, loadUser, checkRole(['USER', 'ADMIN']), UsersController.updateFavorites);

router.get("/:nickname/reviews", verifyFirebaseToken, loadUser, checkRole(['USER', 'ADMIN']), UsersController.getReviews);

export default router;