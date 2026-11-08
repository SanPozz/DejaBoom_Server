import { Router } from 'express';

import CommentsController from '../controllers/comments.controllers.js';
import verifyFirebaseToken from '../middlewares/verifyFirebaseToken.middlewaare.js';
import currentUser from '../middlewares/currentuser.middleware.js';
import optionalCurrentUser from '../middlewares/optionalCurrentUser.middleware.js';

const router = Router();

// el comentario es publico, cualquiera puede leerlo
router.get(
  '/reviews/:reviewId/comments',
  optionalCurrentUser,
  CommentsController.getByReview,
);

// requieren sesión en firebase
router.post(
  '/reviews/:reviewId/comments',
  verifyFirebaseToken,
  currentUser,
  CommentsController.create,
);
router.put(
  '/comments/:id/like',
  verifyFirebaseToken,
  currentUser,
  CommentsController.like,
);

router.delete(
  '/comments/:id/like',
  verifyFirebaseToken,
  currentUser,
  CommentsController.unlike,
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
