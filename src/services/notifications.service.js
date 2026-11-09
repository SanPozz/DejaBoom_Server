import NotificationsRepository from '../repositories/notifications.repository.js';

const repository = new NotificationsRepository();

class NotificationsService {
  static list(recipientId) {
    return repository.findLatestByRecipientId(recipientId);
  }

  static markRead(id, recipientId) {
    return repository.markRead(id, recipientId);
  }

  static async markAllRead(recipientId) {
    const result = await repository.markAllRead(recipientId);
    return { updated: result.count };
  }

  static create({
    recipientId,
    actorId,
    type,
    reviewId = null,
    commentId = null,
  }) {
    if (actorId === recipientId) {
      return null;
    }

    return repository.create({
      recipientId,
      actorId,
      type,
      reviewId,
      commentId,
    });
  }
}

export default NotificationsService;
