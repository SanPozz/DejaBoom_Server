import { Router } from "express";

import ListController from "../controllers/lists.controller.js";

import verifyFirebaseToken from "../middlewares/verifyFirebaseToken.middlewaare.js";
import loadUser from "../middlewares/loadUser.middleware.js";
import checkRole from "../middlewares/checkRole.middleware.js";

const router = Router();

router.get("/user/:nickname", verifyFirebaseToken, loadUser, ListController.getByUser)

router.get("/saved", verifyFirebaseToken, loadUser, ListController.getSaved);
router.get("/popular", verifyFirebaseToken, loadUser, ListController.getPopular);

router.get("/:id", verifyFirebaseToken, loadUser, ListController.getById);

router.post("/", verifyFirebaseToken, loadUser, ListController.create);

router.put("/:id", verifyFirebaseToken, loadUser, ListController.update);

router.delete("/:id", verifyFirebaseToken, loadUser, ListController.remove);

router.post("/:id/save", verifyFirebaseToken, loadUser, ListController.save);
router.post("/:id/unsave", verifyFirebaseToken, loadUser, ListController.unsave);

export default router;