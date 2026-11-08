import prisma from '../database/db.js';

const authorSelect = {
  select: { id: true, nickname: true, profilePicture: true },
};

class CommentsRepository {
  findReviewById(reviewId) {
    return prisma.reviews.findUnique({
      where: { id: reviewId },
      select: { id: true },
    });
  }

  //lista pllna de todos los comentarios de la reseña en una sola query, ordenados por fecha de creación ascendente (para luego armar el árbol)
  findByReviewId(reviewId, userId) {
    return prisma.comments.findMany({
      where: { reviewId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: authorSelect,
        _count: { select: { likedBy: true } },
        ...(userId
          ? {
              likedBy: {
                where: { userId },
                select: { userId: true },
              },
            }
          : {}),
      },
    });
  }

  findById(id) {
    return prisma.comments.findUnique({ where: { id } });
  }

  save(data) {
    return prisma.comments.create({ data });
  }

  updateContent(id, content) {
    return prisma.comments.update({ where: { id }, data: { content } });
  }

  softDelete(id) {
    return prisma.comments.update({
      where: { id },
      data: { deletedAt: new Date(), content: '' },
    });
  }

  hardDelete(id) {
    return prisma.comments.delete({ where: { id } });
  }

  countReplies(id) {
    return prisma.comments.count({ where: { parentId: id } });
  }

  async like(commentId, userId) {
    await prisma.commentLikes.upsert({
      where: {
        commentId_userId: { commentId, userId },
      },
      update: {},
      create: { commentId, userId },
    });

    return this.getLikeStatus(commentId, userId);
  }

  async unlike(commentId, userId) {
    await prisma.commentLikes.deleteMany({
      where: { commentId, userId },
    });

    return this.getLikeStatus(commentId, userId);
  }

  async getLikeStatus(commentId, userId) {
    const [likes, likedByMe] = await Promise.all([
      prisma.commentLikes.count({ where: { commentId } }),
      prisma.commentLikes.findUnique({
        where: {
          commentId_userId: { commentId, userId },
        },
        select: { id: true },
      }),
    ]);

    return { likes, likedByMe: Boolean(likedByMe) };
  }
}

export default CommentsRepository;
