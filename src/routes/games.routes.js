import { Router } from 'express';
import GamesController from '../controllers/games.controller.js';

const router = Router();

router.get('/', GamesController.list);

router.get('/search', GamesController.search);

router.get('/:id', GamesController.getById);

router.get('/:id/similar', GamesController.getSimilar);

router.get('/:id/community', GamesController.getCommunity);

router.get('/:id/community', GamesController.getCommunity);

export default router;
