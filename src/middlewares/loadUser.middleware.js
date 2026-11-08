import UsersRepository from '../repositories/users.repository.js';

import { HttpError } from '../utils/httperror.util.js';

// Debe ir después de verifyFirebaseToken: carga el usuario de la BD en req.user
const loadUser = async (req, res, next) => {
    try {
        const user = await new UsersRepository().findByFirebaseUID(req.firebaseUser.uid);

        if (!user) {
            throw new HttpError(403, 'Usuario no registrado');
        }

        req.user = user;
        return next();
    } catch (error) {
        console.error('Error al cargar el usuario:', error);
        throw error
    }
};

export default loadUser;
