import { Router } from 'express';
import NotificationsController from '../controllers/notifications.controller.js';
import verifyFirebaseToken from '../middlewares/verifyFirebaseToken.middlewaare.js';
import loadUser from '../middlewares/loadUser.middleware.js';

const router = Router();

router.use(verifyFirebaseToken, loadUser);

router.get('/', NotificationsController.list);
router.patch('/read-all', NotificationsController.markAllRead);
router.patch('/:id/read', NotificationsController.markRead);

export default router;
