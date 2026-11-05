import prisma from '../database/db.js';

class ReviewsRepository {

    save({ gameId, userId, content, rating }) {
        return prisma.reviews.create({
            data: { gameId, userId, content, rating }
        });
    }

}

export default ReviewsRepository;