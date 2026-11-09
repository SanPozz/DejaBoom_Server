import NotificationsService from '../services/notifications.service.js';
import { HttpError } from '../utils/httperror.util.js';

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

class NotificationsController {
  static async list(req, res) {
    const result = await NotificationsService.list(req.user.id);
    return res.status(200).json(result);
  }

  static async markRead(req, res) {
    const id = parseId(req.params.id);
    if (!id) {
      throw new HttpError(400, 'Id de notificación inválido');
    }

    const notification = await NotificationsService.markRead(id, req.user.id);
    if (!notification) {
      throw new HttpError(404, 'Notificación no encontrada');
    }

    return res.status(200).json(notification);
  }

  static async markAllRead(req, res) {
    const result = await NotificationsService.markAllRead(req.user.id);
    return res.status(200).json(result);
  }
}

export default NotificationsController;
