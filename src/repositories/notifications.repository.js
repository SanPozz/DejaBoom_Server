import prisma from '../database/db.js';

const notificationSelect = {
  id: true,
  type: true,
  reviewId: true,
  commentId: true,
  createdAt: true,
  readAt: true,
  actor: {
    select: {
      id: true,
      nickname: true,
      profilePicture: true,
    },
  },
};

class NotificationsRepository {
  async findLatestByRecipientId(recipientId, limit = 50) {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notifications.findMany({
        where: { recipientId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit,
        select: notificationSelect,
      }),
      prisma.notifications.count({
        where: { recipientId, readAt: null },
      }),
    ]);

    return { notifications, unreadCount };
  }

  create(data) {
    return prisma.notifications.create({
      data,
      select: notificationSelect,
    });
  }

  async markRead(id, recipientId) {
    await prisma.notifications.updateMany({
      where: { id, recipientId, readAt: null },
      data: { readAt: new Date() },
    });

    return prisma.notifications.findFirst({
      where: { id, recipientId },
      select: notificationSelect,
    });
  }

  markAllRead(recipientId) {
    return prisma.notifications.updateMany({
      where: { recipientId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}

export default NotificationsRepository;
