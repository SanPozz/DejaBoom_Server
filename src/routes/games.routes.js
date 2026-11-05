import { Router } from 'express';
import GamesController from '../controllers/games.controller.js';

const router = Router();

router.get('/', GamesController.list);

router.get('/search', GamesController.search);

router.get('/:id', GamesController.getById);

export default router;
