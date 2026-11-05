

import ReviewsRepository from "../repositories/reviews.repository.js";

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

}

export default ReviewsController;