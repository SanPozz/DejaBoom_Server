import { Router } from 'express';
import GamesController from '../controllers/games.controller.js';

const router = Router();

router.get('/', GamesController.list);

router.get('/search', GamesController.search);

router.get('/popular', GamesController.getPopular); // Antes de /:id porque si no express toma popular como un id

router.get('/game-of-the-week', GamesController.getGameOfTheWeek); // Antes de /:id porque si no express toma game-of-the-week como un id

router.get('/:id', GamesController.getById);

router.get('/:id/community', GamesController.getCommunity);

export default router;
