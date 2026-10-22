import CommentsRepository from '../repositories/comments.repository.js';
import { HttpError } from '../utils/httpError.util.js';
import { buildTree, resolveReplyTarget } from '../utils/commentTree.util.js';

const MAX_LENGTH = 1000;
const MODERATION_ROLES = ['ADMIN', 'MODERATOR'];

const repository = new CommentsRepository();

const cleanContent = (content) => {
  const text = typeof content === 'string' ? content.trim() : '';

  if (!text) throw new HttpError(400, 'El comentario no puede estar vacío');
  if (text.length > MAX_LENGTH) {
    throw new HttpError(
      400,
      `El comentario no puede superar los ${MAX_LENGTH} caracteres`,
    );
  }

  return text;
};

const getActiveComment = async (id) => {
  const comment = await repository.findById(id);

  if (!comment || comment.deletedAt) {
    throw new HttpError(404, 'Comentario no encontrado');
  }

  return comment;
};

class CommentsService {
  static async getTree(reviewId) {
    const flat = await repository.findByReviewId(reviewId);
    return buildTree(flat);
  }

  static async create({ reviewId, user, content, parentId = null }) {
    const text = cleanContent(content);

    const review = await repository.findReviewById(reviewId);
    if (!review) throw new HttpError(404, 'Reseña no encontrada');

    let target = { parentId: null, depth: 0 };

    if (parentId !== null) {
      const parent = await repository.findById(parentId);

      if (!parent || parent.reviewId !== reviewId) {
        throw new HttpError(
          404,
          'El comentario al que querés responder no existe',
        );
      }
      if (parent.deletedAt) {
        throw new HttpError(
          400,
          'No se puede responder a un comentario eliminado',
        );
      }

      target = resolveReplyTarget(parent);
    }

    return repository.save({
      content: text,
      reviewId,
      userId: user.id,
      parentId: target.parentId,
      depth: target.depth,
    });
  }

  static async update({ id, user, content }) {
    const text = cleanContent(content);
    const comment = await getActiveComment(id);

    if (comment.userId !== user.id) {
      throw new HttpError(403, 'Solo podés editar tus propios comentarios');
    }

    return repository.updateContent(id, text);
  }

  static async remove({ id, user }) {
    const comment = await getActiveComment(id);

    const isOwner = comment.userId === user.id;
    const canModerate = MODERATION_ROLES.includes(user.role);

    if (!isOwner && !canModerate) {
      throw new HttpError(
        403,
        'No tenés permiso para eliminar este comentario',
      );
    }

    if ((await repository.countReplies(id)) > 0) {
      await repository.softDelete(id);
      return;
    }

    await repository.hardDelete(id);

    //si el padre ya estaba eliminado y quedó sin hijos, ya no aporta nada.
    let currentId = comment.parentId;
    while (currentId !== null) {
      const parent = await repository.findById(currentId);

      if (!parent || !parent.deletedAt) break;
      if ((await repository.countReplies(parent.id)) > 0) break;

      await repository.hardDelete(parent.id);
      currentId = parent.parentId;
    }
  }
}

export default CommentsService;
