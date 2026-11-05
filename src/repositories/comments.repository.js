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
  findByReviewId(reviewId) {
    return prisma.comments.findMany({
      where: { reviewId },
      orderBy: { createdAt: 'asc' },
      include: { user: authorSelect },
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
}

export default CommentsRepository;
