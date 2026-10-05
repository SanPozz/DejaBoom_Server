import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import authRoutes from '../routes/auth.routes.js'; 

const createApp = () => {
    const app = express();

    app.use(cors({
        origin: ['https://dejaboomdemo.vercel.app', 'http://localhost:5175'],
        credentials: true,
    }));

    app.use(express.json());
    app.use(cookieParser());
    
    app.get('/', (req, res) => {
        res.send('Hello, world!');
    });

    app.use('/api/auth', authRoutes);

    return app;
};

export default createApp;