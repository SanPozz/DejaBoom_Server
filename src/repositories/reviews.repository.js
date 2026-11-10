import prisma from '../database/db.js';

export const REVIEW_ORDER = {
  recent: [{ createdAt: 'desc' }, { id: 'desc' }],
  best: [{ rating: 'desc' }, { id: 'desc' }],
  worst: [{ rating: 'asc' }, { id: 'asc' }],
};

class ReviewsRepository {
  save({ gameId, userId, content, rating, completed }) {
    return prisma.reviews.create({
      data: { gameId, userId, content, rating, completed },
    });
  }

  async getCommunityStatsByGameId(gameId) {
    const [aggregate, completedCount] = await prisma.$transaction([
      prisma.reviews.aggregate({
        where: { gameId },
        _count: { _all: true },
        _avg: { rating: true },
      }),
      prisma.reviews.count({ where: { gameId, completed: true } }),
    ]);

    const averageRating = aggregate._avg.rating;
    const reviewsCount = aggregate._count._all;

    return {
      reviewsCount,
      completedCount,
      averageRating: averageRating === null ? null : Number(Number(averageRating).toFixed(1)),
    };
  }

  getByReviewId(reviewId, userId) {
    return prisma.reviews.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: { id: true, nickname: true, profilePicture: true },
        },
        comments: true,
        likedBy: {
          where: { userId },
          select: { userId: true },
        },
      },
    });
  }

  async like(reviewId, userId) {
    //indica si este pedido creó el like para no duplicar notificaciones
    let created = false;
    try {
      await prisma.$transaction([
        prisma.reviewLikes.create({ data: { reviewId, userId } }),
        prisma.reviews.update({
          where: { id: reviewId },
          data: { likes: { increment: 1 } },
        }),
      ]);
      created = true;
    } catch (error) {
      //si el like ya existe, no se crea ni se notifica otro.
      if (error.code !== 'P2002' && error.code !== 'P2003') {
        throw error;
      }
    }
    const review = await prisma.reviews.findUnique({ where: { id: reviewId } });

    if (!review) {
      return null;
    }

    return { review, created };
  }

  async unlike(reviewId, userId) {
    await prisma.$transaction(async (tx) => {
      const { count } = await tx.reviewLikes.deleteMany({
        where: { reviewId, userId },
      });

      // Solo resta si el usuario realmente tenía like.
      if (count > 0) {
        await tx.reviews.update({
          where: { id: reviewId },
          data: { likes: { decrement: 1 } },
        });
      }
    });

    return prisma.reviews.findUnique({ where: { id: reviewId } });
  }

  getByUserId(userId, { limit = 20, skip = 0, sort = 'recent' } = {}) {
    return prisma.reviews.findMany({
      where: { userId },
      orderBy: REVIEW_ORDER[sort],
      take: limit,
      skip,
      select: {
        id: true,
        gameId: true,
        content: true,
        rating: true,
        completed: true,
        createdAt: true,
        likes: true,
      },
    });
  }

  getRecentByUserId(userId, limit = 3) {
    return this.getByUserId(userId, { limit });
  }

  async getUserStats(userId) {
    const [reviewsCount, completedCount] = await prisma.$transaction([
      prisma.reviews.count({ where: { userId } }),
      prisma.reviews.count({ where: { userId, completed: true } }),
    ]);

    return { reviewsCount, completedCount };
  }

  async getPopularGameIds({ days = 7, limit = 6 } = {}) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const groupByGame = (where, take) => {
      return prisma.reviews.groupBy({
        by: ['gameId'],
        where,
        _count: { gameId: true },
        orderBy: [{ _count: { gameId: 'desc' } }, { gameId: 'desc' }],
        take,
      });
    };

    const weeklyPopular = await groupByGame({ createdAt: { gte: since } }, limit);

    const popularIds = weeklyPopular.map((group) => group.gameId);

    if (popularIds.length >= limit) return popularIds;

    const allTimePopular = await groupByGame({ gameId: { notIn: popularIds } }, limit - popularIds.length);

    return [...popularIds, ...allTimePopular.map((group) => group.gameId)];
  }

  async getPopularReviews({ days = 7, limit = 3 } = {}) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const findPopular = (where, take) => {
      return prisma.reviews.findMany({
        where,
        orderBy: [{ likes: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        take,
        select: {
          id: true,
          gameId: true,
          content: true,
          rating: true,
          likes: true,
          createdAt: true,
          user: {
            select: { nickname: true, profilePicture: true },
          },
          _count: {
            select: { comments: { where: { deletedAt: null } } },
          },
        },
      });
    };

    const weeklyPopular = await findPopular({ createdAt: { gte: since } }, limit);

    if (weeklyPopular.length >= limit) return weeklyPopular;

    const allTimePopular = await findPopular(
      { id: { notIn: weeklyPopular.map((review) => review.id) } },
      limit - weeklyPopular.length,
    );

    return [...weeklyPopular, ...allTimePopular];
  }
}

export default ReviewsRepository;
