const prisma = require('../prisma/prismaClient');

class NotificationRepository {
  async create(notificationData) {
    const notification = await prisma.notification.create({
      data: {
        user_id: notificationData.user_id,
        message: notificationData.message,
        type: notificationData.type,
        reference_id: notificationData.reference_id,
        is_read: 0,
      }
    });
    return notification;
  }

  async findById(id) {
    return await prisma.notification.findUnique({
      where: { id: parseInt(id) }
    });
  }

  async findAllByUserId(userId, unreadOnly = false) {
    const whereClause = { user_id: parseInt(userId) };
    if (unreadOnly) {
      whereClause.is_read = 0;
    }

    return await prisma.notification.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' }
    });
  }

  async markAsRead(id) {
    return await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { is_read: 1 }
    });
  }

  async markAllAsRead(userId) {
    await prisma.notification.updateMany({
      where: { 
          user_id: parseInt(userId),
          is_read: 0 
      },
      data: { is_read: 1 }
    });
    return true;
  }

  async delete(id) {
    await prisma.notification.delete({
      where: { id: parseInt(id) }
    });
    return true;
  }
}

module.exports = NotificationRepository;
