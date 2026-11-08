

import ReviewsRepository from "../repositories/reviews.repository.js";

class ReviewNotFoundError extends Error {}

const reviewsRepository = new ReviewsRepository();

class ReviewsController {


    static async create(req, res) {
        const { gameId, content, rating } = req.body;
        const userId = req.user.id;

        if (!Number.isInteger(Number(gameId))) {
            return res.status(400).send('gameId inválido');
        }

        const review = await reviewsRepository.save({ gameId: Number(gameId), userId, content, rating });

        res.status(201).json(review);
    }

    static async getByReviewId(req, res) {
        const { reviewId } = req.params;

        if (!Number.isInteger(Number(reviewId))) {
            return res.status(400).send('reviewId inválido');
        }

        try {
            const review = await reviewsRepository.getByReviewId(Number(reviewId), req.user.id);

            if (!review) {
                throw new ReviewNotFoundError();
            }

            const { likedBy, ...reviewData } = review;

            res.status(200).json({ ...reviewData, likedByMe: likedBy.length > 0 });
        } catch (error) {
            if (error instanceof ReviewNotFoundError) {
                return res.status(404).send('Reseña no encontrada');
            }

            res.status(500).send('Error al obtener la reseña');
        }
    }

    static async like(req, res) {
        const { reviewId } = req.body;

        if (!Number.isInteger(Number(reviewId))) {
            return res.status(400).send('reviewId inválido');
        }

        try {
            const review = await reviewsRepository.like(Number(reviewId), req.user.id);

            if (!review) {
                throw new ReviewNotFoundError();
            }

            res.status(200).json(review);
        } catch (error) {
            if (error instanceof ReviewNotFoundError) {
                return res.status(404).send('Reseña no encontrada');
            }

            res.status(500).send('Error al dar like a la reseña');
        }
    }
    
    static async unlike(req, res) {
        const { reviewId } = req.body;

        if (!Number.isInteger(Number(reviewId))) {
            return res.status(400).send('reviewId inválido');
        }

        try {
            const review = await reviewsRepository.unlike(Number(reviewId), req.user.id);

            if (!review) {
                throw new ReviewNotFoundError();
            }

            res.status(200).json(review);
        } catch (error) {
            if (error instanceof ReviewNotFoundError) {
                return res.status(404).send('Reseña no encontrada');
            }

            res.status(500).send('Error al dar dislike a la reseña');
        }
    }

}

export default ReviewsController;