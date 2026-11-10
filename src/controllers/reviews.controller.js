import { HttpError } from '../utils/httperror.util.js';

import { getGamesByIds } from '../services/igdb.service.js'

import ReviewsRepository from "../repositories/reviews.repository.js";

const reviewsRepository = new ReviewsRepository();

class ReviewsController {

    static async create(req, res) {
        const { gameId, content, rating, completed } = req.body;
        const userId = req.user.id;
        const ratingValue = Number(rating);

        if (!Number.isInteger(Number(gameId))) {
            throw new HttpError(400, 'gameId inválido');
        }

        if (!content || typeof content !== 'string') {
            throw new HttpError(400, 'content inválido');
        }

        if (!Number.isInteger(ratingValue * 2) || ratingValue < 0.5 || ratingValue > 5) {
            throw new HttpError(400, 'rating inválido');
        }

        if (typeof completed !== 'boolean') {
            throw new HttpError(400, 'completed inválido');
        }

        try {
            const review = await reviewsRepository.save({ gameId: Number(gameId), userId, content, rating: ratingValue, completed });
            return res.status(201).json(review);
        } catch (error) {
            if (error.code === 'P2002') {
                throw new HttpError(409, 'Ya reseñaste este juego');
            }
            throw error;
        }

    }

    static async getByReviewId(req, res) {
        const { reviewId } = req.params;
        const user = req.user;

        if (!Number.isInteger(Number(reviewId))) {
            throw new HttpError(400, 'reviewId inválido');
        }

        try {
            const review = await reviewsRepository.getByReviewId(Number(reviewId), user.id);

            if (!review) {
                throw new HttpError(404, 'Reseña no encontrada');
            }

            const { likedBy, ...reviewData } = review;

            res.status(200).json({ ...reviewData, likedByMe: likedBy.length > 0 });
        } catch (error) {
            
            throw error;
        }
    }

    static async like(req, res) {
        const { reviewId } = req.body;

        if (!Number.isInteger(Number(reviewId))) {
            throw new HttpError(400, 'reviewId inválido');
        }

        try {
            const review = await reviewsRepository.like(Number(reviewId), req.user.id);

            if (!review) {
                throw new HttpError(404, 'Reseña no encontrada');
            }

            res.status(200).json(review);
        } catch (error) {
            throw error;
        }
    }
    
    static async unlike(req, res) {
        const { reviewId } = req.body;

        if (!Number.isInteger(Number(reviewId))) {
            throw new HttpError(400, 'reviewId inválido');
        }

        try {
            const review = await reviewsRepository.unlike(Number(reviewId), req.user.id);

            if (!review) {
                throw new HttpError(404, 'Reseña no encontrada');
            }

            res.status(200).json(review);
        } catch (error) {
            throw error;
        }
    }

    static async getPopular(req, res) {
        
        const reviews = await reviewsRepository.getPopularReviews();

        const games = await getGamesByIds(reviews.map(review => review.gameId)).catch((error) => {
            console.error('IGDB games for popular reviews failed:', error)
        });

        const data = reviews.map(({ _count, rating, ...review }, index) => ({
            ...review,
            rating: Number(rating),
            commentsCount: _count.comments,
            game: games[index],
        }));

        res.status(200).json(data);

    }

}

export default ReviewsController;