import { Router } from 'express';

import CommentsController from '../controllers/comments.controller.js';
import verifyFirebaseToken from '../middlewares/verifyFirebaseToken.middlewaare.js';
import currentUser from '../middlewares/currentUser.middleware.js';

const router = Router();

// el comentario es publico, cualquiera puede leerlo
router.get('/reviews/:reviewId/comments', CommentsController.getByReview);

// requieren sesión en firebase
router.post(
  '/reviews/:reviewId/comments',
  verifyFirebaseToken,
  currentUser,
  CommentsController.create,
);
router.patch(
  '/comments/:id',
  verifyFirebaseToken,
  currentUser,
  CommentsController.update,
);
router.delete(
  '/comments/:id',
  verifyFirebaseToken,
  currentUser,
  CommentsController.remove,
);

export default router;
