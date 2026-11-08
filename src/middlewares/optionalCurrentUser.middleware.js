import { firebaseAuth } from '../services/firebaseAdmin.service.js';
import UsersRepository from '../repositories/users.repository.js';
import { HttpError } from '../utils/httperror.util.js';

const optionalCurrentUser = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) return next();

  if (!authorization.startsWith('Bearer ')) {
    throw new HttpError(401, 'Token inválido');
  }

  try {
    const token = authorization.slice('Bearer '.length);
    const firebaseUser = await firebaseAuth.verifyIdToken(token);
    const user = await new UsersRepository().findByFirebaseUID(
      firebaseUser.uid,
    );

    if (!user) throw new HttpError(404, 'Usuario no registrado en DejaBoom');

    req.currentUser = user;
    return next();
  } catch (error) {
    if (error instanceof HttpError) throw error;

    console.error('No se pudo verificar el token opcional de Firebase:', error);
    throw new HttpError(401, 'Token inválido o expirado');
  }
};

export default optionalCurrentUser;
