import prisma from '../database/db.js';

class ReviewsRepository {

    save({ gameId, userId, content, rating }) {
        return prisma.reviews.create({
            data: { gameId, userId, content, rating }
        });
    }

    getByReviewId(reviewId) {
        return prisma.reviews.findUnique({
            where: { id: reviewId },
            include: {
                user: true,
                comments: true
            }
        });
    }

}

export default ReviewsRepository;