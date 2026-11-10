import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import errorHandler from '../middlewares/errorHandler.middleware.js';

import authRoutes from '../routes/auth.routes.js';
import reviewsRoutes from '../routes/reviews.routes.js';
import gamesRoutes from '../routes/games.routes.js';
import commentsRoutes from '../routes/comments.routes.js';
import usersRoutes from '../routes/users.routes.js';
import notificationsRoutes from '../routes/notifications.routes.js';
import listsRoutes from '../routes/lists.routes.js';

const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: [
        'https://dejaboomdemo.vercel.app',
        'http://localhost:5175',
        'http://localhost:5173',
        'http://localhost:5174',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );

  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/auth', authRoutes);
  app.use('/api/reviews', reviewsRoutes);
  app.use('/api/games', gamesRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api', commentsRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/lists', listsRoutes);

  app.use(errorHandler);

  return app;
};

export default createApp;
