import CommentsService from '../services/comments.service.js';
import { HttpError } from '../utils/httpError.util.js';

const parseId = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const handleError = (res, error, fallbackMessage) => {
  if (error instanceof HttpError) {
    return res.status(error.status).send(error.message);
  }

  console.error(fallbackMessage, error);
  return res.status(500).send(fallbackMessage);
};

class CommentsController {
  static async getByReview(req, res) {
    const reviewId = parseId(req.params.reviewId);
    if (!reviewId) return res.status(400).send('Id de reseña inválido');

    try {
      const tree = await CommentsService.getTree(reviewId);
      return res.status(200).json(tree);
    } catch (error) {
      return handleError(res, error, 'Error al obtener los comentarios');
    }
  }

  static async create(req, res) {
    const reviewId = parseId(req.params.reviewId);
    if (!reviewId) return res.status(400).send('Id de reseña inválido');

    const { content, parentId } = req.body;

    let parent = null;
    if (parentId !== undefined && parentId !== null) {
      parent = parseId(parentId);
      if (!parent) return res.status(400).send('parentId inválido');
    }

    try {
      const comment = await CommentsService.create({
        reviewId,
        user: req.currentUser,
        content,
        parentId: parent,
      });

      return res.status(201).json({ id: comment.id });
    } catch (error) {
      return handleError(res, error, 'Error al crear el comentario');
    }
  }

  static async update(req, res) {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).send('Id de comentario inválido');

    try {
      await CommentsService.update({
        id,
        user: req.currentUser,
        content: req.body.content,
      });
      return res.status(200).json({ id });
    } catch (error) {
      return handleError(res, error, 'Error al editar el comentario');
    }
  }

  static async remove(req, res) {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).send('Id de comentario inválido');

    try {
      await CommentsService.remove({ id, user: req.currentUser });
      return res.status(204).send();
    } catch (error) {
      return handleError(res, error, 'Error al eliminar el comentario');
    }
  }
}

export default CommentsController;
