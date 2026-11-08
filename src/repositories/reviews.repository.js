import prisma from '../database/db.js';

class ReviewsRepository {

    save({ gameId, userId, content, rating, completed }) {
        return prisma.reviews.create({
            data: { gameId, userId, content, rating, completed }
        });
    }

    async getCommunityStatsByGameId(gameId) {
        const [reviewsCount, completedCount] = await prisma.$transaction([
            prisma.reviews.count({ where: { gameId } }),
            prisma.reviews.count({ where: { gameId, completed: true } })
        ]);

        return { reviewsCount, completedCount };
    }

    getByReviewId(reviewId, userId) {
        return prisma.reviews.findUnique({
            where: { id: reviewId },
            include: {
                user: {
                    select: { id: true, nickname: true, profilePicture: true }
                },
                comments: true,
                likedBy: {
                    where: { userId },
                    select: { userId: true }
                }
            }
        });
    }

    async like(reviewId, userId) {
        try {
            await prisma.$transaction([
                prisma.reviewLikes.create({ data: { reviewId, userId } }),
                prisma.reviews.update({
                    where: { id: reviewId },
                    data: { likes: { increment: 1 } }
                })
            ]);
        } catch (error) {
            // P2002: el usuario ya tenía like. P2003: la reseña no existe.
            if (error.code !== 'P2002' && error.code !== 'P2003') {
                throw error;
            }
        }

        return prisma.reviews.findUnique({ where: { id: reviewId } });
    }

    async unlike(reviewId, userId) {
        await prisma.$transaction(async (tx) => {
            const { count } = await tx.reviewLikes.deleteMany({
                where: { reviewId, userId }
            });

            // Solo resta si el usuario realmente tenía like.
            if (count > 0) {
                await tx.reviews.update({
                    where: { id: reviewId },
                    data: { likes: { decrement: 1 } }
                });
            }
        });

        return prisma.reviews.findUnique({ where: { id: reviewId } });
    }

}

export default ReviewsRepository;