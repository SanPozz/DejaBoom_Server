import UsersRepository from '../repositories/users.repository.js';

import { HttpError } from '../utils/httperror.util.js';

const currentUser = async (req, res, next) => {
  try {
    const user = await new UsersRepository().findByFirebaseUID(
      req.firebaseUser.uid,
    );

    if (!user) {
      throw new HttpError(404, 'Usuario no registrado en DejaBoom');
    }

    req.currentUser = user;
    return next();
  } catch (error) {
    console.error('Error al obtener el usuario actual:', error);
    throw error
  }
};

export default currentUser;
